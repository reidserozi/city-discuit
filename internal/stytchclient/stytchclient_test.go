package stytchclient

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSendMagicLink(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/magic_links/email/login_or_create" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != "POST" {
			t.Errorf("unexpected method: %s", r.Method)
		}

		auth := r.Header.Get("Authorization")
		expectedAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte("proj:sec"))
		if auth != expectedAuth {
			t.Errorf("unexpected auth header: %s", auth)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"user_id": "user_123"})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	userID, err := client.SendMagicLink(context.Background(), "test@example.com", "https://redirect.example.com")
	if err != nil {
		t.Fatalf("SendMagicLink error: %v", err)
	}
	if userID != "user_123" {
		t.Errorf("expected user_id 'user_123', got %s", userID)
	}
}

func TestAuthenticateMagicLink(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/magic_links/authenticate" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req authenticateMagicLinkReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.Token != "tok_123" {
			t.Errorf("unexpected token: %s", req.Token)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"user_id": "user_123",
			"email":   "test@example.com",
		})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	userID, email, err := client.AuthenticateMagicLink(context.Background(), "tok_123")
	if err != nil {
		t.Fatalf("AuthenticateMagicLink error: %v", err)
	}
	if userID != "user_123" {
		t.Errorf("expected user_id 'user_123', got %s", userID)
	}
	if email != "test@example.com" {
		t.Errorf("expected email 'test@example.com', got %s", email)
	}
}

func TestSendEmailOTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/otps/email/login_or_create" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req sendEmailOTPReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.Email != "test@example.com" {
			t.Errorf("unexpected email: %s", req.Email)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"method_id": "method_456",
			"user_id":   "user_123",
		})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	methodID, userID, err := client.SendEmailOTP(context.Background(), "test@example.com")
	if err != nil {
		t.Fatalf("SendEmailOTP error: %v", err)
	}
	if methodID != "method_456" {
		t.Errorf("expected method_id 'method_456', got %s", methodID)
	}
	if userID != "user_123" {
		t.Errorf("expected user_id 'user_123', got %s", userID)
	}
}

func TestAuthenticateEmailOTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/otps/authenticate" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req authenticateEmailOTPReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.MethodID != "method_456" || req.Code != "123456" {
			t.Errorf("unexpected request: %+v", req)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	err := client.AuthenticateEmailOTP(context.Background(), "method_456", "123456")
	if err != nil {
		t.Fatalf("AuthenticateEmailOTP error: %v", err)
	}
}

func TestErrorHandling(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"error_type":    "invalid_request",
			"error_message": "Email is required",
		})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	_, err := client.SendMagicLink(context.Background(), "", "https://redirect.example.com")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "stytch api error") {
		t.Errorf("expected stytch api error, got: %v", err)
	}
}
