package server

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/discuitnet/discuit/core"
	"github.com/discuitnet/discuit/internal/email"
	"github.com/discuitnet/discuit/internal/httperr"
)

// emailVerificationStart sends a verification email to the logged-in user.
func (s *Server) emailVerificationStart(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Must be logged in
	if !r.loggedIn {
		return errNotLoggedIn
	}

	// Rate limit per user
	if err := s.rateLimit(r, "email_verification_1_"+r.viewer.String(), time.Minute, 1); err != nil {
		return err
	}

	// Get current user
	user, err := core.GetUser(r.ctx, s.db, *r.viewer, r.viewer)
	if err != nil {
		return err
	}

	// User must have an email
	if !user.Email.Valid || user.Email.String == "" {
		return httperr.NewBadRequest("no_email", "User does not have an email address.")
	}

	// Send magic link (Stytch creates or returns existing user by email)
	redirectURL := s.config.SiteURL + "/verify-email?token="
	stytchUserID, err := s.stytch.SendMagicLink(r.ctx, user.Email.String, redirectURL)
	if err != nil {
		s.http500Logger.Printf("Error sending verification email to user %s: %v\n", user.Username, err)
		return err
	}

	// Save the Stytch user ID if not already set
	if !user.StytchUserID.Valid {
		if err := user.SetStytchUserID(r.ctx, s.db, stytchUserID); err != nil {
			s.http500Logger.Printf("Error saving Stytch user ID for %s: %v\n", user.Username, err)
			return err
		}
	}

	return w.writeJSON(map[string]bool{"success": true})
}

// emailVerificationConfirm validates the magic link token and marks email as confirmed.
// This endpoint is NOT protected by login requirement since the link may be opened on a different device.
func (s *Server) emailVerificationConfirm(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Rate limit per-IP
	clientIP := strings.TrimSpace(r.req.Header.Get("X-Forwarded-For"))
	if clientIP == "" {
		clientIP, _, _ = net.SplitHostPort(r.req.RemoteAddr)
	}

	if err := s.rateLimit(r, "email_verification_confirm_1_"+clientIP, time.Minute, 10); err != nil {
		return err
	}

	var body struct {
		Token string `json:"token"`
	}
	if err := r.unmarshalJSONBody(&body); err != nil {
		return err
	}

	body.Token = strings.TrimSpace(body.Token)
	if body.Token == "" {
		return httperr.NewBadRequest("invalid_token", "Token is required.")
	}

	// Authenticate the magic link token
	stytchUserID, email, err := s.stytch.AuthenticateMagicLink(r.ctx, body.Token)
	if err != nil {
		s.http500Logger.Printf("AuthenticateMagicLink failed: %v\n", err)
		return httperr.NewBadRequest("invalid_token", "Invalid or expired verification link.")
	}
	s.http500Logger.Printf("Stytch authenticated: stytchUserID=%s email=%q\n", stytchUserID, email)

	// Look up user by Stytch user ID
	user, err := core.GetUserByStytchUserID(r.ctx, s.db, stytchUserID, nil)
	if err != nil {
		s.http500Logger.Printf("GetUserByStytchUserID failed: %v\n", err)
		if errors.Is(err, sql.ErrNoRows) {
			return httperr.NewBadRequest("invalid_token", "User not found.")
		}
		return err
	}
	s.http500Logger.Printf("Found user: uid=%s username=%s email=%q\n", user.ID, user.Username, user.Email.String)

	// Verify email matches if Stytch returned one (case-insensitive, trimmed comparison)
	// If Stytch didn't return an email, trust the token as proof of identity
	if email != "" {
		if !user.Email.Valid {
			return httperr.NewBadRequest("email_mismatch", "User has no email on file.")
		}
		storedEmail := strings.ToLower(strings.TrimSpace(user.Email.String))
		stytchEmail := strings.ToLower(strings.TrimSpace(email))
		if storedEmail != stytchEmail {
			return httperr.NewBadRequest("email_mismatch", "Email does not match verification token.")
		}
	}

	// Mark email as confirmed
	if err := user.SetEmailConfirmed(r.ctx, s.db, true); err != nil {
		return err
	}

	return w.writeJSON(map[string]bool{"success": true})
}

// sendEmailVerificationBestEffort sends a verification email but doesn't block on failure.
// Called after signup to verify the new email address.
func (s *Server) sendEmailVerificationBestEffort(user *core.User) {
	if s.stytch == nil || !user.Email.Valid || user.Email.String == "" {
		return
	}

	ctx := context.Background()
	redirectURL := s.config.SiteURL + "/verify-email?token="
	stytchUserID, err := s.stytch.SendMagicLink(ctx, user.Email.String, redirectURL)
	if err != nil {
		s.httpLogger.Printf("Error sending verification email to new user %s: %v\n", user.Username, err)
		return
	}

	// Save the Stytch user ID
	if err := user.SetStytchUserID(ctx, s.db, stytchUserID); err != nil {
		s.httpLogger.Printf("Error saving Stytch user ID for %s: %v\n", user.Username, err)
	}
}

// testEmail sends a test email to the logged-in user.
func (s *Server) testEmail(w *responseWriter, r *request) error {
	// Must be logged in
	if !r.loggedIn {
		return errNotLoggedIn
	}

	// Get current user
	user, err := core.GetUser(r.ctx, s.db, *r.viewer, r.viewer)
	if err != nil {
		return err
	}

	// User must have an email
	if !user.Email.Valid || user.Email.String == "" {
		return httperr.NewBadRequest("no_email", "User does not have an email address.")
	}

	// Create and send a test email using the email service directly
	emailSvc := email.New(s.config.SMTPHost, s.config.SMTPPort, s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPFromEmail, s.config.SMTPFromName)

	htmlBody := email.RenderNotificationEmail(
		"Test email from Edit Raleigh",
		s.config.SiteURL,
		"Visit Edit Raleigh",
		"Edit Raleigh",
	)

	if err := emailSvc.Send(user.Email.String, "Test email from Edit Raleigh", htmlBody); err != nil {
		return httperr.NewBadRequest("email_send_failed", fmt.Sprintf("Failed to send email: %v", err))
	}

	return w.writeJSON(map[string]bool{"success": true})
}
