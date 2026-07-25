// Package stytchclient implements a thin wrapper around the Stytch REST API.
// Minimal HTTP client with no external SDK dependencies, following the house style
// established by internal/hcaptcha.
package stytchclient

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	baseURLTest = "https://test.stytch.com"
	baseURLLive = "https://api.stytch.com"
)

type Client struct {
	projectID   string
	secret      string
	baseURL     string
	httpClient  *http.Client
	environment string
}

// New creates a new Stytch API client. Environment should be "test" or "live".
func New(projectID, secret, environment string) *Client {
	baseURL := baseURLTest
	if environment == "live" {
		baseURL = baseURLLive
	}
	return &Client{
		projectID:   projectID,
		secret:      secret,
		baseURL:     baseURL,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
		environment: environment,
	}
}

func (c *Client) basicAuth() string {
	credentials := c.projectID + ":" + c.secret
	return base64.StdEncoding.EncodeToString([]byte(credentials))
}

func (c *Client) do(ctx context.Context, method, path string, body interface{}) ([]byte, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal body: %w", err)
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("new request: %w", err)
	}

	req.Header.Set("Authorization", "Basic "+c.basicAuth())
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errResp struct {
			ErrorType    string `json:"error_type"`
			ErrorMessage string `json:"error_message"`
		}
		_ = json.Unmarshal(respBody, &errResp)
		return nil, fmt.Errorf("stytch api error (status %d): %s - %s", resp.StatusCode, errResp.ErrorType, errResp.ErrorMessage)
	}

	return respBody, nil
}

type sendMagicLinkReq struct {
	Email string `json:"email"`
}

type sendMagicLinkResp struct {
	UserID string `json:"user_id"`
}

// SendMagicLink sends a magic link to the given email address.
// The redirectURL is where the user will be sent after clicking the link.
// Note: Stytch handles the redirect URL configuration in the dashboard, not per-request.
func (c *Client) SendMagicLink(ctx context.Context, email, redirectURL string) (stytchUserID string, err error) {
	respBody, err := c.do(ctx, "POST", "/v1/magic_links/email/login_or_create", sendMagicLinkReq{
		Email: email,
	})
	if err != nil {
		return "", err
	}

	var resp sendMagicLinkResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.UserID, nil
}

type authenticateMagicLinkReq struct {
	Token string `json:"token"`
}

type authenticateMagicLinkResp struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

// AuthenticateMagicLink validates a magic link token and returns the user ID and email.
func (c *Client) AuthenticateMagicLink(ctx context.Context, token string) (stytchUserID, email string, err error) {
	respBody, err := c.do(ctx, "POST", "/v1/magic_links/authenticate", authenticateMagicLinkReq{
		Token: token,
	})
	if err != nil {
		return "", "", err
	}

	var resp authenticateMagicLinkResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", "", fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.UserID, resp.Email, nil
}

type createTOTPReq struct {
	UserID string `json:"user_id"`
}

type createTOTPResp struct {
	TOTPID          string   `json:"totp_id"`
	Secret          string   `json:"secret"`
	QRCode          string   `json:"qr_code"`
	RecoveryCodes   []string `json:"recovery_codes"`
}

// CreateTOTP creates a new TOTP (time-based one-time password) device for the user.
func (c *Client) CreateTOTP(ctx context.Context, stytchUserID string) (totpID, secret, qrCodeDataURI string, recoveryCodes []string, err error) {
	respBody, err := c.do(ctx, "POST", "/v1/totps", createTOTPReq{
		UserID: stytchUserID,
	})
	if err != nil {
		return "", "", "", nil, err
	}

	var resp createTOTPResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", "", "", nil, fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.TOTPID, resp.Secret, resp.QRCode, resp.RecoveryCodes, nil
}

type authenticateTOTPReq struct {
	UserID string `json:"user_id"`
	Code   string `json:"code"`
}

// AuthenticateTOTP verifies a TOTP code for a user.
func (c *Client) AuthenticateTOTP(ctx context.Context, stytchUserID, code string) error {
	_, err := c.do(ctx, "POST", "/v1/totps/authenticate", authenticateTOTPReq{
		UserID: stytchUserID,
		Code:   code,
	})
	return err
}

type deleteTOTPReq struct {
	UserID string `json:"user_id"`
	TOTPID string `json:"totp_id"`
}

// DeleteTOTP removes a TOTP device from a user.
func (c *Client) DeleteTOTP(ctx context.Context, stytchUserID, totpID string) error {
	_, err := c.do(ctx, "DELETE", "/v1/totps/"+url.PathEscape(totpID), deleteTOTPReq{
		UserID: stytchUserID,
		TOTPID: totpID,
	})
	return err
}

type createUserReq struct {
	Email      string `json:"email,omitempty"`
	ExternalID string `json:"external_id,omitempty"`
}

type createUserResp struct {
	UserID string `json:"user_id"`
}

// CreateUser provisions a new Stytch user. At least one of email or externalID must be provided.
func (c *Client) CreateUser(ctx context.Context, email, externalID string) (stytchUserID string, err error) {
	respBody, err := c.do(ctx, "POST", "/v1/users", createUserReq{
		Email:      email,
		ExternalID: externalID,
	})
	if err != nil {
		return "", err
	}

	var resp createUserResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.UserID, nil
}
