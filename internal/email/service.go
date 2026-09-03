package email

import (
	"fmt"
	"net/smtp"
	"strings"
)

type Service struct {
	host     string
	port     int
	user     string
	password string
	from     string
	fromName string
}

func New(host string, port int, user, password, from, fromName string) *Service {
	return &Service{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		from:     from,
		fromName: fromName,
	}
}

// NewIfConfigured returns a Service if SMTP is usable, or nil and a reason if it
// isn't. Every caller that needs a mailer should go through this, so that all of
// them agree on what "SMTP is configured" means; having two call sites apply
// different rules is how the digest emails kept sending while other emails
// silently did nothing.
func NewIfConfigured(host string, port int, user, password, from, fromName string) (*Service, error) {
	var missing []string
	if host == "" {
		missing = append(missing, "host")
	}
	if port == 0 {
		missing = append(missing, "port")
	}
	// from is required: it's the SMTP envelope sender passed to smtp.SendMail,
	// and providers (SES included) reject an empty one.
	if from == "" {
		missing = append(missing, "from address")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("SMTP not configured, missing: %s", strings.Join(missing, ", "))
	}
	return New(host, port, user, password, from, fromName), nil
}

// Send sends an email via SMTP.
func (s *Service) Send(to, subject, htmlBody string) error {
	addr := fmt.Sprintf("%s:%d", s.host, s.port)

	// Build the From header with optional display name
	var fromHeader string
	if s.fromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", s.fromName, s.from)
	} else {
		fromHeader = s.from
	}

	// Build MIME message
	msg := strings.Builder{}
	msg.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	// Send via SMTP
	auth := smtp.PlainAuth("", s.user, s.password, s.host)
	err := smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg.String()))
	if err != nil {
		return fmt.Errorf("failed to send email to %s: %w", to, err)
	}

	return nil
}

// SendMultipart sends a multipart email (HTML + plaintext) via SMTP.
// The email client will prefer HTML if supported, otherwise fall back to plaintext.
func (s *Service) SendMultipart(to, subject, htmlBody, textBody string) error {
	addr := fmt.Sprintf("%s:%d", s.host, s.port)

	// Build the From header with optional display name
	var fromHeader string
	if s.fromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", s.fromName, s.from)
	} else {
		fromHeader = s.from
	}

	// Create a boundary for multipart MIME
	boundary := "===============boundary_digest_email==============="

	// Build multipart MIME message
	msg := strings.Builder{}
	msg.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
	msg.WriteString("\r\n")

	// Plain text part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(textBody)
	msg.WriteString("\r\n")

	// HTML part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)
	msg.WriteString("\r\n")

	// End boundary
	msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	// Send via SMTP
	auth := smtp.PlainAuth("", s.user, s.password, s.host)
	err := smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg.String()))
	if err != nil {
		return fmt.Errorf("failed to send email to %s: %w", to, err)
	}

	return nil
}
