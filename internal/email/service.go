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
