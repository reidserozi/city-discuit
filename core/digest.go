package core

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/discuitnet/discuit/internal/email"
	"github.com/discuitnet/discuit/internal/uid"
	msql "github.com/discuitnet/discuit/internal/sql"
)

// DigestData represents the content for a user's weekly digest email.
type DigestData struct {
	User                  *User
	TopPosts              []*Post
	RepliesToUserPosts    []*Comment
	CommunityActivityTime time.Time
	CommunityActivity     []*Comment
}

// GetRepliesSinceForUser returns recent comments on the user's posts since the given time.
func GetRepliesSinceForUser(ctx context.Context, db *sql.DB, user uid.ID, since time.Time, limit int) ([]*Comment, error) {
	query := `
		SELECT
			c.id, c.post_id, c.author_id, c.body, c.created_at, c.edited_at,
			c.deleted, c.deleted_at, c.upvotes, c.downvotes, c.parent_id
		FROM comments c
		INNER JOIN posts p ON c.post_id = p.id
		WHERE p.author_id = ? AND c.author_id != ? AND c.created_at >= ?
		ORDER BY c.created_at DESC
		LIMIT ?
	`

	rows, err := db.QueryContext(ctx, query, user, user, since, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		c := &Comment{}
		if err := rows.Scan(
			&c.ID,
			&c.PostID,
			&c.AuthorID,
			&c.Body,
			&c.CreatedAt,
			&c.EditedAt,
			&c.Deleted,
			&c.DeletedAt,
			&c.Upvotes,
			&c.Downvotes,
			&c.ParentID,
		); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	return comments, rows.Err()
}

// GetJoinedCommunityActivitySinceForUser returns recent activity in communities the user has joined.
func GetJoinedCommunityActivitySinceForUser(ctx context.Context, db *sql.DB, user uid.ID, since time.Time, limit int) ([]*Comment, error) {
	query := `
		SELECT
			c.id, c.post_id, c.author_id, c.body, c.created_at, c.edited_at,
			c.deleted, c.deleted_at, c.upvotes, c.downvotes, c.parent_id
		FROM comments c
		INNER JOIN posts p ON c.post_id = p.id
		INNER JOIN community_members cm ON p.community_id = cm.community_id
		WHERE cm.user_id = ? AND c.author_id != ? AND c.created_at >= ?
		ORDER BY c.created_at DESC
		LIMIT ?
	`

	rows, err := db.QueryContext(ctx, query, user, user, since, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		c := &Comment{}
		if err := rows.Scan(
			&c.ID,
			&c.PostID,
			&c.AuthorID,
			&c.Body,
			&c.CreatedAt,
			&c.EditedAt,
			&c.Deleted,
			&c.DeletedAt,
			&c.Upvotes,
			&c.Downvotes,
			&c.ParentID,
		); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	return comments, rows.Err()
}

// sendDigestToUser sends a digest email to a single user. Used by both scheduled and manual sends.
func sendDigestToUser(ctx context.Context, db *sql.DB, hmacSecret string, emailService *email.Service, siteName string, userID uid.ID, emailAddr string) (username string, err error) {
	user, err := GetUser(ctx, db, userID, nil)
	if err != nil {
		return "", err
	}

	// Get digest content
	now := time.Now()
	since := now.Add(-time.Hour * 24 * 7) // Last 7 days
	topPosts, _ := GetDigestPosts(ctx, db, 5)
	repliesSince, _ := GetRepliesSinceForUser(ctx, db, userID, since, 10)
	activitySince, _ := GetJoinedCommunityActivitySinceForUser(ctx, db, userID, since, 10)

	unsubscribeToken := GenerateDigestUnsubscribeToken(userID, hmacSecret)
	unsubscribeURL := emailSiteURL + "/api/digest_unsubscribe?token=" + unsubscribeToken + "&user=" + userID.String()

	// Build digest email data
	digestData := email.DigestEmailData{
		Username:          user.Username,
		SiteName:          siteName,
		TopPostsCount:     len(topPosts),
		RepliesSinceCount: len(repliesSince),
		CommunityActivity: len(activitySince),
		UnsubscribeURL:    unsubscribeURL,
	}

	// Render email templates
	htmlBody, err := email.RenderDigestEmailHTML(digestData)
	if err != nil {
		return "", err
	}

	textBody := email.RenderDigestEmailText(digestData)

	// Send email if service is available, otherwise just log
	if emailService != nil {
		if err := emailService.SendMultipart(emailAddr, "Your Weekly Digest - "+siteName, htmlBody, textBody); err != nil {
			return "", err
		}
	} else {
		log.Printf("[DRY RUN] Would send digest to %s (%s): %d posts, %d replies, %d activity\n",
			user.Username, emailAddr, len(topPosts), len(repliesSince), len(activitySince))
	}

	return user.Username, nil
}

// SendWeeklyDigest sends digest emails to users who have opted in.
// It runs on Saturday evenings and respects the double-send prevention using application_data.
// If emailService is nil, the function logs intended sends without actually emailing.
func SendWeeklyDigest(ctx context.Context, db *sql.DB, hmacSecret string, emailService *email.Service, siteName string) error {
	// Check if we've already sent the digest this week.
	now := time.Now()
	if now.Weekday() != time.Saturday || now.Hour() < 18 || now.Hour() >= 19 {
		// Not Saturday evening (6:00-7:00 PM), don't send
		return nil
	}

	// Get application data to check last send time
	keys, err := GetApplicationVAPIDKeys(ctx, db)
	if err != nil {
		return err
	}

	lastSent := keys.DigestLastSent
	if lastSent != nil && now.Sub(*lastSent) < time.Hour*24*6 {
		// Already sent within the last 6 days, skip
		log.Println("Digest email already sent recently, skipping")
		return nil
	}

	// Query users with digest_email_on = true and verified email
	query := `
		SELECT u.id, u.email
		FROM users u
		WHERE u.digest_email_on = true AND u.email_confirmed_at IS NOT NULL
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Send digest to each user
	successCount := 0
	failCount := 0

	for rows.Next() {
		var userID uid.ID
		var emailAddr msql.NullString

		if err := rows.Scan(&userID, &emailAddr); err != nil {
			log.Printf("Error scanning user: %v\n", err)
			failCount++
			continue
		}

		if !emailAddr.Valid || emailAddr.String == "" {
			continue
		}

		_, err := sendDigestToUser(ctx, db, hmacSecret, emailService, siteName, userID, emailAddr.String)
		if err != nil {
			log.Printf("Error sending digest to user %s: %v\n", userID, err)
			failCount++
			continue
		}

		successCount++
	}

	if err = rows.Err(); err != nil {
		return err
	}

	log.Printf("Digest email processing complete: %d sent, %d failed\n", successCount, failCount)

	// Update last sent time in application_data
	return updateDigestLastSent(ctx, db, now)
}

// GenerateDigestUnsubscribeToken creates an HMAC token for digest unsubscribe verification.
func GenerateDigestUnsubscribeToken(userID uid.ID, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(userID[:])
	return hex.EncodeToString(h.Sum(nil))
}

// updateDigestLastSent updates the last digest send time in application_data.
func updateDigestLastSent(ctx context.Context, db *sql.DB, now time.Time) error {
	// Fetch current VAPID keys, update DigestLastSent, and write back
	keys, err := GetApplicationVAPIDKeys(ctx, db)
	if err != nil {
		return err
	}

	keys.DigestLastSent = &now
	data, err := json.Marshal(keys)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, "UPDATE application_data SET `value` = ? WHERE `key` = ?", string(data), vapidKeysDBKey)
	if err != nil {
		return err
	}

	log.Printf("Updated digest_last_sent to %v\n", now)
	return nil
}

// SendDigestTest sends a digest email to a specific user immediately for testing.
// Unlike SendWeeklyDigest, this does not check the time of day or cooldown window.
// Call this only from manual CLI commands or testing code.
func SendDigestTest(ctx context.Context, db *sql.DB, hmacSecret string, emailService *email.Service, siteName, username string) error {
	if emailService == nil {
		return errors.New("email service is not configured")
	}

	// Look up user by username
	user, err := GetUserByUsername(ctx, db, username, nil)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Check that user has opted in and has a verified email
	if !user.DigestEmailOn {
		return errors.New("digest email is not enabled for this user")
	}
	if !user.EmailConfirmedAt.Valid {
		return errors.New("user email is not verified")
	}
	if !user.Email.Valid || user.Email.String == "" {
		return errors.New("user has no email address")
	}

	// Send the digest
	_, err = sendDigestToUser(ctx, db, hmacSecret, emailService, siteName, user.ID, user.Email.String)
	if err != nil {
		return err
	}

	log.Printf("Digest email sent successfully to %s (%s)\n", user.Username, user.Email.String)
	return nil
}
