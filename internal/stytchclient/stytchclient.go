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
	if len(token) > 20 {
		fmt.Printf("DEBUG: Authenticating magic link token (first 20 chars): %s...\n", token[:20])
	} else {
		fmt.Printf("DEBUG: Authenticating magic link token: %s\n", token)
	}
	respBody, err := c.do(ctx, "POST", "/v1/magic_links/authenticate", authenticateMagicLinkReq{
		Token: token,
	})
	if err != nil {
		fmt.Printf("DEBUG: Stytch rejected token: %v\n", err)
		return "", "", err
	}
	fmt.Printf("DEBUG: Stytch accepted token, response: %s\n", string(respBody))

	var resp authenticateMagicLinkResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", "", fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.UserID, resp.Email, nil
}

type sendEmailOTPReq struct {
	Email string `json:"email"`
}

type sendEmailOTPResp struct {
	UserID   string `json:"user_id"`
	MethodID string `json:"method_id"`
}

// SendEmailOTP sends a 6-digit OTP code via email for login.
func (c *Client) SendEmailOTP(ctx context.Context, email string) (methodID, stytchUserID string, err error) {
	respBody, err := c.do(ctx, "POST", "/v1/otps/email/login_or_create", sendEmailOTPReq{
		Email: email,
	})
	if err != nil {
		return "", "", err
	}

	var resp sendEmailOTPResp
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return "", "", fmt.Errorf("unmarshal response: %w", err)
	}

	return resp.MethodID, resp.UserID, nil
}

type authenticateEmailOTPReq struct {
	MethodID string `json:"method_id"`
	Code     string `json:"code"`
}

// AuthenticateEmailOTP verifies a 6-digit OTP code.
func (c *Client) AuthenticateEmailOTP(ctx context.Context, methodID, code string) error {
	_, err := c.do(ctx, "POST", "/v1/otps/authenticate", authenticateEmailOTPReq{
		MethodID: methodID,
		Code:     code,
	})
	return err
}

