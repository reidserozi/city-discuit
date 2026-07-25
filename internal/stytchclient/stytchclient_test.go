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

func TestCreateTOTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/totps" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req createTOTPReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.UserID != "user_123" {
			t.Errorf("unexpected user_id: %s", req.UserID)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"totp_id":        "totp_456",
			"secret":         "JBSWY3DPEBLW64TMMQ======",
			"qr_code":        "data:image/png;base64,iVBORw0KGgo=",
			"recovery_codes": []string{"code1", "code2", "code3"},
		})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	totpID, secret, qr, codes, err := client.CreateTOTP(context.Background(), "user_123")
	if err != nil {
		t.Fatalf("CreateTOTP error: %v", err)
	}
	if totpID != "totp_456" {
		t.Errorf("expected totp_id 'totp_456', got %s", totpID)
	}
	if secret != "JBSWY3DPEBLW64TMMQ======" {
		t.Errorf("unexpected secret: %s", secret)
	}
	if qr != "data:image/png;base64,iVBORw0KGgo=" {
		t.Errorf("unexpected qr code: %s", qr)
	}
	if len(codes) != 3 || codes[0] != "code1" {
		t.Errorf("unexpected recovery codes: %v", codes)
	}
}

func TestAuthenticateTOTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/totps/authenticate" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req authenticateTOTPReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.UserID != "user_123" || req.Code != "123456" {
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

	err := client.AuthenticateTOTP(context.Background(), "user_123", "123456")
	if err != nil {
		t.Fatalf("AuthenticateTOTP error: %v", err)
	}
}

func TestDeleteTOTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/v1/totps/") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != "DELETE" {
			t.Errorf("unexpected method: %s", r.Method)
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

	err := client.DeleteTOTP(context.Background(), "user_123", "totp_456")
	if err != nil {
		t.Fatalf("DeleteTOTP error: %v", err)
	}
}

func TestCreateUser(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/users" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req createUserReq
		json.NewDecoder(r.Body).Decode(&req)
		if req.Email != "test@example.com" {
			t.Errorf("unexpected email: %s", req.Email)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"user_id": "user_789"})
	}))
	defer server.Close()

	client := &Client{
		projectID:  "proj",
		secret:     "sec",
		baseURL:    server.URL,
		httpClient: &http.Client{},
	}

	userID, err := client.CreateUser(context.Background(), "test@example.com", "")
	if err != nil {
		t.Fatalf("CreateUser error: %v", err)
	}
	if userID != "user_789" {
		t.Errorf("expected user_id 'user_789', got %s", userID)
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
