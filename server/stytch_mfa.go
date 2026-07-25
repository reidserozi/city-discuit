package server

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"net"
	"strings"
	"time"

	"github.com/discuitnet/discuit/core"
	"github.com/discuitnet/discuit/internal/httperr"
	"github.com/discuitnet/discuit/internal/uid"
	"github.com/gomodule/redigo/redis"
)

// getOrCreateStytchUserID lazily provisions a Stytch User and persists the ID.
// Returns the existing Stytch user ID if already provisioned.
func (s *Server) getOrCreateStytchUserID(ctx context.Context, user *core.User) (string, error) {
	if user.StytchUserID.Valid {
		return user.StytchUserID.String, nil
	}

	// Create new Stytch user
	stytchUserID, err := s.stytch.CreateUser(ctx, user.Email.String, user.ID.String())
	if err != nil {
		return "", err
	}

	// Persist the mapping
	if err := user.SetStytchUserID(ctx, s.db, stytchUserID); err != nil {
		return "", err
	}

	return stytchUserID, nil
}

// createPendingMFALogin generates a short-lived bearer token for MFA code submission.
// Token is stored in Redis with 5-minute TTL and single-use semantics.
func (s *Server) createPendingMFALogin(userID string) (string, error) {
	// Generate cryptographically secure token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(tokenBytes)

	// Store in Redis with 5-minute TTL
	conn := s.redisPool.Get()
	defer conn.Close()

	key := "mfa_pending:" + token

	// Store user ID and attempts as separate keys for easier atomic operations
	if _, err := conn.Do("SET", key, userID); err != nil {
		return "", err
	}
	if _, err := conn.Do("SET", key+":attempts", 0); err != nil {
		return "", err
	}
	if _, err := conn.Do("EXPIRE", key, 300); err != nil { // 5 minutes
		return "", err
	}
	if _, err := conn.Do("EXPIRE", key+":attempts", 300); err != nil {
		return "", err
	}

	return token, nil
}

// loginMFA submits a TOTP code to complete MFA login.
func (s *Server) loginMFA(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Rate limits
	clientIP := strings.TrimSpace(r.req.Header.Get("X-Forwarded-For"))
	if clientIP == "" {
		clientIP, _, _ = net.SplitHostPort(r.req.RemoteAddr)
	}

	if err := s.rateLimit(r, "login_mfa_1_"+clientIP, time.Second, 10); err != nil {
		return err
	}

	var body struct {
		PendingToken string `json:"pendingToken"`
		Code         string `json:"code"`
	}
	if err := r.unmarshalJSONBody(&body); err != nil {
		return err
	}

	body.PendingToken = strings.TrimSpace(body.PendingToken)
	body.Code = strings.TrimSpace(body.Code)

	if body.PendingToken == "" || body.Code == "" {
		return httperr.NewBadRequest("invalid_request", "pendingToken and code are required.")
	}

	// Rate limit per pending token
	if err := s.rateLimit(r, "login_mfa_2_"+body.PendingToken, 5*time.Minute, 6); err != nil {
		return err
	}

	// Retrieve pending MFA login from Redis
	conn := s.redisPool.Get()
	defer conn.Close()

	key := "mfa_pending:" + body.PendingToken
	userIDStr, err := redis.String(conn.Do("GET", key))
	if err != nil {
		if errors.Is(err, redis.ErrNil) {
			return httperr.NewBadRequest("invalid_token", "Invalid or expired MFA token.")
		}
		return err
	}

	// Get current attempt count
	attemptCount, err := redis.Int64(conn.Do("GET", key+":attempts"))
	if err != nil && !errors.Is(err, redis.ErrNil) {
		return err
	}

	// Check if we've exceeded max attempts
	if attemptCount >= 5 {
		conn.Do("DEL", key, key+":attempts")
		return httperr.NewBadRequest("too_many_attempts", "Too many failed attempts. Please log in again.")
	}

	// Look up user by ID
	userID, err := uid.FromString(userIDStr)
	if err != nil {
		return httperr.NewBadRequest("invalid_token", "Invalid user ID in token.")
	}

	user, err := core.GetUser(r.ctx, s.db, userID, nil)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return httperr.NewBadRequest("invalid_token", "User not found.")
		}
		return err
	}

	// Ensure user has Stytch ID
	if !user.StytchUserID.Valid {
		return httperr.NewBadRequest("mfa_not_enabled", "User does not have MFA enabled.")
	}

	// Verify the TOTP code with Stytch
	if err := s.stytch.AuthenticateTOTP(r.ctx, user.StytchUserID.String, body.Code); err != nil {
		// Increment failed attempts
		conn.Do("INCR", key+":attempts")
		return httperr.NewBadRequest("invalid_code", "Invalid or expired MFA code.")
	}

	// Success! Delete the pending token (single-use)
	conn.Do("DEL", key, key+":attempts")

	// Log the user in
	if err := s.loginUser(user, r.ses, w, r.req); err != nil {
		return err
	}

	return w.writeJSON(user)
}

// handleMFA handles MFA enrollment and disabling.
// POST: action=enrollStart or action=enrollConfirm
// DELETE: disables MFA
func (s *Server) handleMFA(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	if !r.loggedIn {
		return errNotLoggedIn
	}

	// Rate limit
	if err := s.rateLimit(r, "mfa_enroll_1_"+r.viewer.String(), time.Minute, 5); err != nil {
		return err
	}

	// Get current user
	user, err := core.GetUser(r.ctx, s.db, *r.viewer, r.viewer)
	if err != nil {
		return err
	}

	query := r.urlQueryParams()
	action := query.Get("action")

	switch r.req.Method {
	case "POST":
		if action == "enrollStart" {
			// Start TOTP enrollment
			stytchUserID, err := s.getOrCreateStytchUserID(r.ctx, user)
			if err != nil {
				return err
			}

			totpID, secret, qrCode, recoveryCodes, err := s.stytch.CreateTOTP(r.ctx, stytchUserID)
			if err != nil {
				return err
			}

			return w.writeJSON(map[string]interface{}{
				"totpID":        totpID,
				"secret":        secret,
				"qrCode":        qrCode,
				"recoveryCodes": recoveryCodes,
			})
		} else if action == "enrollConfirm" {
			// Confirm TOTP enrollment
			var body struct {
				Code string `json:"code"`
			}
			if err := r.unmarshalJSONBody(&body); err != nil {
				return err
			}

			body.Code = strings.TrimSpace(body.Code)
			if body.Code == "" {
				return httperr.NewBadRequest("invalid_code", "Code is required.")
			}

			stytchUserID, err := s.getOrCreateStytchUserID(r.ctx, user)
			if err != nil {
				return err
			}

			// Verify the code with Stytch
			if err := s.stytch.AuthenticateTOTP(r.ctx, stytchUserID, body.Code); err != nil {
				return httperr.NewBadRequest("invalid_code", "Invalid MFA code.")
			}

			// Enable MFA for user
			if err := user.SetMFAEnabled(r.ctx, s.db, true); err != nil {
				return err
			}

			return w.writeJSON(map[string]bool{"success": true})
		} else {
			return httperr.NewBadRequest("invalid_action", "Unknown action.")
		}

	case "DELETE":
		// Disable MFA
		var body struct {
			Password string `json:"password"`
		}
		if err := r.unmarshalJSONBody(&body); err != nil {
			return err
		}

		body.Password = strings.TrimSpace(body.Password)
		if body.Password == "" {
			return httperr.NewBadRequest("invalid_password", "Password is required to disable MFA.")
		}

		// Re-verify password (same pattern as ChangePassword)
		if _, err := core.MatchLoginCredentials(r.ctx, s.db, user.Username, body.Password); err != nil {
			return err
		}

		// Get Stytch user ID
		if !user.StytchUserID.Valid {
			return httperr.NewBadRequest("mfa_not_enabled", "MFA is not enabled for this user.")
		}

		// Delete all TOTP devices (we only support one per user in the simple design)
		// For now, we'll just disable MFA in our DB; Stytch cleanup is optional
		if err := user.SetMFAEnabled(r.ctx, s.db, false); err != nil {
			return err
		}

		return w.writeJSON(map[string]bool{"success": true})

	default:
		return httperr.NewBadRequest("invalid_method", "Only POST and DELETE are supported.")
	}
}
