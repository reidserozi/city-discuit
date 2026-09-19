package server

import (
	"net"
	"strings"
	"time"

	"github.com/discuitnet/discuit/core"
	"github.com/discuitnet/discuit/internal/httperr"
)

// passwordResetStart initiates a password reset by sending a magic link email.
// Always returns generic success message to avoid user enumeration.
func (s *Server) passwordResetStart(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Must NOT be logged in for password reset
	if r.loggedIn {
		return httperr.NewForbidden("already_logged_in", "You must be logged out to reset your password.")
	}

	// Rate limits
	clientIP := strings.TrimSpace(r.req.Header.Get("X-Forwarded-For"))
	if clientIP == "" {
		clientIP, _, _ = net.SplitHostPort(r.req.RemoteAddr)
	}

	if err := s.rateLimit(r, "password_reset_1_"+clientIP, time.Minute, 3); err != nil {
		return err
	}

	var body struct {
		Identifier string `json:"identifier"` // username or email
	}
	if err := r.unmarshalJSONBody(&body); err != nil {
		return err
	}

	body.Identifier = strings.TrimSpace(body.Identifier)
	if body.Identifier == "" {
		// Still return generic success to avoid enumeration
		return w.writeJSON(map[string]bool{"success": true})
	}

	// Rate limit on per-identifier basis
	if err := s.rateLimit(r, "password_reset_3_"+clientIP+body.Identifier, time.Hour, 5); err != nil {
		return err
	}

	// Rate limit per-IP per-hour
	if err := s.rateLimit(r, "password_reset_2_"+clientIP, time.Hour, 10); err != nil {
		return err
	}

	// Try to find user by username or email
	var user *core.User
	var err error

	user, err = core.GetUserByUsername(r.ctx, s.db, body.Identifier, nil)
	if err != nil && !httperr.IsNotFound(err) {
		return err
	}

	if user == nil {
		// Try by email
		user, err = core.GetUserByEmail(r.ctx, s.db, body.Identifier, nil)
		if err != nil && !httperr.IsNotFound(err) {
			return err
		}
	}

	// If user found and has email, send magic link
	if user != nil && user.Email.Valid && user.Email.String != "" {
		// The redirect URL must exactly match one registered in the Stytch dashboard
		// (including query string, or lack of one) -- Stytch appends its own
		// `?token=...` when it builds the actual emailed link, so we must send the
		// bare URL here, not pre-append an empty token param ourselves. (See the
		// same fix/comment in email_verification.go.)
		redirectURL := s.config.SiteURL + "/reset-password"
		if _, err := s.stytch.SendMagicLink(r.ctx, user.Email.String, redirectURL); err != nil {
			// Log error but don't fail the request to avoid enumeration
			s.httpLogger.Printf("Error sending password reset email to user %s: %v\n", user.Username, err)
		}
	}

	// Always return generic success
	return w.writeJSON(map[string]bool{"success": true})
}

// passwordResetConfirm validates the magic link token and sets a new password.
func (s *Server) passwordResetConfirm(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Rate limit on per-IP basis
	clientIP := strings.TrimSpace(r.req.Header.Get("X-Forwarded-For"))
	if clientIP == "" {
		clientIP, _, _ = net.SplitHostPort(r.req.RemoteAddr)
	}

	if err := s.rateLimit(r, "password_reset_confirm_1_"+clientIP, time.Minute, 10); err != nil {
		return err
	}

	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := r.unmarshalJSONBody(&body); err != nil {
		return err
	}

	body.Token = strings.TrimSpace(body.Token)
	if body.Token == "" {
		return httperr.NewBadRequest("invalid_token", "Token is required.")
	}

	if body.Password == "" {
		return httperr.NewBadRequest("invalid_password", "Password is required.")
	}

	// Authenticate the magic link token
	stytchUserID, email, err := s.stytch.AuthenticateMagicLink(r.ctx, body.Token)
	if err != nil {
		return httperr.NewBadRequest("invalid_token", "Invalid or expired password reset link.")
	}

	// Look up user by Stytch user ID
	user, err := core.GetUserByStytchUserID(r.ctx, s.db, stytchUserID, nil)
	if err != nil {
		if httperr.IsNotFound(err) {
			return httperr.NewBadRequest("invalid_token", "User not found.")
		}
		return err
	}

	// TEMPORARY diagnostic logging -- remove once the "Email has changed"
	// mismatch reported against production is root-caused.
	s.http500Logger.Printf("passwordResetConfirm: stytchUserID=%s stytchEmail=%q matched uid=%s username=%s dbEmail=%q\n",
		stytchUserID, email, user.ID, user.Username, user.Email.String)

	// Verify email hasn't changed since reset was initiated (case-insensitive,
	// trimmed comparison -- Stytch may return the email in a different case
	// than what's stored; see the same pattern in email_verification.go).
	if !user.Email.Valid {
		return httperr.NewBadRequest("email_mismatch", "User has no email on file.")
	}
	storedEmail := strings.ToLower(strings.TrimSpace(user.Email.String))
	stytchEmail := strings.ToLower(strings.TrimSpace(email))
	if storedEmail != stytchEmail {
		return httperr.NewBadRequest("email_mismatch", "Email has changed since reset was requested.")
	}

	// Reset the password
	if err := user.ResetPassword(r.ctx, s.db, body.Password); err != nil {
		return err
	}

	// Logout all sessions for this user (security: old sessions shouldn't remain valid)
	if err := s.LogoutAllSessionsOfUser(user); err != nil {
		s.http500Logger.Printf("Error logging out all sessions for user %s: %v\n", user.Username, err)
		// Don't fail the request on this error
	}

	// Auto-login the current session
	if err := s.loginUser(user, r.ses, w, r.req); err != nil {
		return err
	}

	return w.writeJSON(user)
}
