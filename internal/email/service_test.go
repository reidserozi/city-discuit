package email

import "testing"

func TestNewIfConfigured(t *testing.T) {
	tests := []struct {
		name     string
		host     string
		port     int
		from     string
		wantSvc  bool
		wantMiss string
	}{
		{
			name: "fully configured", host: "email-smtp.us-east-1.amazonaws.com", port: 587,
			from: "no-reply@example.com", wantSvc: true,
		},
		{
			// The production case that broke: key present in .env but value empty.
			// Previously this passed the digest's gate and failed the web server's,
			// so digests sent while every other email silently did nothing.
			name: "empty from address", host: "email-smtp.us-east-1.amazonaws.com", port: 587,
			from: "", wantSvc: false, wantMiss: "from address",
		},
		{
			name: "no host", host: "", port: 587,
			from: "no-reply@example.com", wantSvc: false, wantMiss: "host",
		},
		{
			name: "no port", host: "email-smtp.us-east-1.amazonaws.com", port: 0,
			from: "no-reply@example.com", wantSvc: false, wantMiss: "port",
		},
		{
			name: "nothing set", host: "", port: 0, from: "", wantSvc: false,
			wantMiss: "host, port, from address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, err := NewIfConfigured(tt.host, tt.port, "user", "password", tt.from, "Name")

			if tt.wantSvc {
				if err != nil {
					t.Fatalf("got error %v, want a usable service", err)
				}
				if svc == nil {
					t.Fatal("got nil service with no error")
				}
				return
			}

			if err == nil {
				t.Fatal("got no error, want one naming the missing fields")
			}
			if svc != nil {
				t.Error("got a service back despite incomplete config")
			}
			if got := err.Error(); !contains(got, tt.wantMiss) {
				t.Errorf("error %q does not name missing fields %q", got, tt.wantMiss)
			}
		})
	}
}

func contains(s, sub string) bool {
	return len(sub) == 0 || (len(s) >= len(sub) && indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
