package email

import (
	"strings"
	"testing"
)

func TestRenderNeighborhoodCodeEmail(t *testing.T) {
	data := NeighborhoodCodeEmailData{
		NeighborhoodName: "Oakdale",
		Code:             "1234",
	}

	subject, body, err := RenderNeighborhoodCodeEmail(data)
	if err != nil {
		t.Fatalf("Error rendering template: %v", err)
	}

	// Check subject
	expectedSubject := "Your Edit Raleigh code for Oakdale"
	if subject != expectedSubject {
		t.Errorf("Subject mismatch: got %q, want %q", subject, expectedSubject)
	}

	// Check body contains neighborhood name
	if !strings.Contains(body, "Oakdale") {
		t.Error("Body missing neighborhood name")
	}

	// Check body contains code
	if !strings.Contains(body, "1234") {
		t.Error("Body missing code")
	}

	// Check body is HTML
	if !strings.Contains(body, "<html>") {
		t.Error("Body should be HTML")
	}

	// Check for key phrases
	keyPhrases := []string{
		"neighborhood leader",
		"residents will need",
		"newsletter",
		"Facebook",
		"Hand it out yourself",
		"@RaleighWiki",
	}

	for _, phrase := range keyPhrases {
		if !strings.Contains(body, phrase) {
			t.Errorf("Body missing key phrase: %q", phrase)
		}
	}

	t.Logf("Subject: %s", subject)
	t.Logf("Body length: %d characters", len(body))
}
