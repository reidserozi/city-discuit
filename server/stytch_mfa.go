package server

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net"
	"strings"
	"time"

	"github.com/discuitnet/discuit/core"
	"github.com/discuitnet/discuit/internal/httperr"
	"github.com/discuitnet/discuit/internal/uid"
	"github.com/gomodule/redigo/redis"
)

// createPendingOTPLogin generates a short-lived bearer token for OTP code submission.
// Token is stored in Redis with 5-minute TTL and single-use semantics.
// Stores both user ID and method ID (from Stytch) needed to verify the OTP.
func (s *Server) createPendingOTPLogin(userID, methodID string) (string, error) {
	// Generate cryptographically secure token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(tokenBytes)

	// Store in Redis with 5-minute TTL
	conn := s.redisPool.Get()
	defer conn.Close()

	key := "otp_pending:" + token
	otpData := struct {
		UserID  string `json:"user_id"`
		EmailID string `json:"email_id"`
	}{
		UserID:  userID,
		EmailID: methodID,
	}

	otpDataJSON, err := json.Marshal(otpData)
	if err != nil {
		return "", err
	}

	if _, err := conn.Do("SET", key, string(otpDataJSON)); err != nil {
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

// loginEmailOTP submits a 6-digit email OTP code to complete login.
func (s *Server) loginEmailOTP(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Rate limits
	clientIP := strings.TrimSpace(r.req.Header.Get("X-Forwarded-For"))
	if clientIP == "" {
		clientIP, _, _ = net.SplitHostPort(r.req.RemoteAddr)
	}

	if err := s.rateLimit(r, "login_otp_1_"+clientIP, time.Second, 10); err != nil {
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
	if err := s.rateLimit(r, "login_otp_2_"+body.PendingToken, 5*time.Minute, 6); err != nil {
		return err
	}

	// Retrieve pending OTP login from Redis
	conn := s.redisPool.Get()
	defer conn.Close()

	key := "otp_pending:" + body.PendingToken
	otpDataStr, err := redis.String(conn.Do("GET", key))
	if err != nil {
		if errors.Is(err, redis.ErrNil) {
			return httperr.NewBadRequest("invalid_token", "Invalid or expired OTP token.")
		}
		return err
	}

	// Parse OTP data
	var otpData struct {
		UserID  string `json:"user_id"`
		EmailID string `json:"email_id"`
	}
	if err := json.Unmarshal([]byte(otpDataStr), &otpData); err != nil {
		return httperr.NewBadRequest("invalid_token", "Malformed OTP token.")
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
	userID, err := uid.FromString(otpData.UserID)
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

	// Verify the OTP code with Stytch
	if err := s.stytch.AuthenticateEmailOTP(r.ctx, otpData.EmailID, body.Code); err != nil {
		// Increment failed attempts
		conn.Do("INCR", key+":attempts")
		return httperr.NewBadRequest("invalid_code", "Invalid or expired OTP code.")
	}

	// Success! Delete the pending token (single-use)
	conn.Do("DEL", key, key+":attempts")

	// Log the user in
	if err := s.loginUser(user, r.ses, w, r.req); err != nil {
		return err
	}

	return w.writeJSON(user)
}

// resendEmailOTP re-sends the OTP code to the user's email.
func (s *Server) resendEmailOTP(w *responseWriter, r *request) error {
	if s.stytch == nil {
		return httperr.NewForbidden("feature_disabled", "Stytch is not configured.")
	}

	// Rate limit - tightly restrict resends
	var body struct {
		PendingToken string `json:"pendingToken"`
	}
	if err := r.unmarshalJSONBody(&body); err != nil {
		return err
	}

	body.PendingToken = strings.TrimSpace(body.PendingToken)
	if body.PendingToken == "" {
		return httperr.NewBadRequest("invalid_request", "pendingToken is required.")
	}

	if err := s.rateLimit(r, "login_otp_resend_1_"+body.PendingToken, 30*time.Second, 1); err != nil {
		return err
	}

	// Retrieve pending OTP login from Redis
	conn := s.redisPool.Get()
	defer conn.Close()

	key := "otp_pending:" + body.PendingToken
	otpDataStr, err := redis.String(conn.Do("GET", key))
	if err != nil {
		if errors.Is(err, redis.ErrNil) {
			return httperr.NewBadRequest("invalid_token", "Invalid or expired OTP token.")
		}
		return err
	}

	// Parse OTP data
	var otpData struct {
		UserID  string `json:"user_id"`
		EmailID string `json:"email_id"`
	}
	if err := json.Unmarshal([]byte(otpDataStr), &otpData); err != nil {
		return httperr.NewBadRequest("invalid_token", "Malformed OTP token.")
	}

	// Get user to access email
	userID, err := uid.FromString(otpData.UserID)
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

	// Guard on email validity
	if !user.Email.Valid {
		return httperr.NewBadRequest("no_email", "User email is not set.")
	}

	// Re-send OTP - this generates a new emailID
	newEmailID, _, err := s.stytch.SendEmailOTP(r.ctx, user.Email.String)
	if err != nil {
		return err
	}

	// Update the pending token with the new email ID
	newOTPData := struct {
		UserID  string `json:"user_id"`
		EmailID string `json:"email_id"`
	}{
		UserID:  otpData.UserID,
		EmailID: newEmailID,
	}

	newOTPDataJSON, err := json.Marshal(newOTPData)
	if err != nil {
		return err
	}

	if _, err := conn.Do("SET", key, string(newOTPDataJSON)); err != nil {
		return err
	}
	if _, err := conn.Do("SET", key+":attempts", 0); err != nil {
		return err
	}
	if _, err := conn.Do("EXPIRE", key, 300); err != nil { // 5 minutes
		return err
	}
	if _, err := conn.Do("EXPIRE", key+":attempts", 300); err != nil {
		return err
	}

	return w.writeJSON(map[string]bool{"success": true})
}

