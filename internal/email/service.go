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
