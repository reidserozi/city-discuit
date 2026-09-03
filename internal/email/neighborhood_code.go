package email

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"strings"
)

//go:embed templates/neighborhood_code.html
var neighborhoodCodeFS embed.FS

type NeighborhoodCodeEmailData struct {
	NeighborhoodName string
	Code             string
}

// RenderNeighborhoodCodeEmail renders the neighborhood code email template.
// Returns (subject, htmlBody, error). The template file contains both the subject
// line and body, separated by a blank line.
func RenderNeighborhoodCodeEmail(data NeighborhoodCodeEmailData) (string, string, error) {
	templateContent, err := neighborhoodCodeFS.ReadFile("templates/neighborhood_code.html")
	if err != nil {
		return "", "", fmt.Errorf("failed to read template: %w", err)
	}

	tmpl, err := template.New("neighborhood_code").Parse(string(templateContent))
	if err != nil {
		return "", "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", "", fmt.Errorf("failed to execute template: %w", err)
	}

	// Split on first blank line to separate subject from body
	rendered := buf.String()
	parts := strings.SplitN(rendered, "\n\n", 2)
	if len(parts) < 2 {
		return "", "", fmt.Errorf("template does not contain subject and body separated by blank line")
	}

	// Extract subject from first line (remove "Subject: " prefix)
	subjectLine := strings.TrimPrefix(strings.TrimSpace(parts[0]), "Subject:")
	subjectLine = strings.TrimSpace(subjectLine)

	return subjectLine, parts[1], nil
}
