package email

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
)

func RenderNotificationEmail(title, actionURL, actionText, siteName string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%s</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <table width="100%%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">%s</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 0; color: #666; font-size: 14px;">
        <p style="margin-top: 0;">You have a new notification on <strong>%s</strong>.</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 30px 0;">
        <a href="%s" style="display: inline-block; padding: 12px 30px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">%s</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p style="margin: 10px 0;">You received this email because you have notifications enabled. To manage your notification settings, visit your account preferences.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`, title, title, siteName, actionURL, actionText)
}

// DigestEmailData represents the data for rendering a digest email.
type DigestEmailData struct {
	Username          string
	SiteName          string
	TopPostsCount     int
	RepliesSinceCount int
	CommunityActivity int
	UnsubscribeURL    string
}

// RenderDigestEmailHTML renders the HTML version of the weekly digest email.
func RenderDigestEmailHTML(data DigestEmailData) (string, error) {
	htmlTmpl := `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Digest - {{.SiteName}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 28px; margin-bottom: 20px;">Your Weekly Digest</h1>
  <p style="font-size: 16px; margin: 20px 0;">Hi {{.Username}},</p>

  <p style="font-size: 16px; margin: 20px 0;">Here's a summary of what happened on {{.SiteName}} this week.</p>

  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; font-size: 18px; color: #000;">This Week's Activity</h2>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li><strong>{{.TopPostsCount}}</strong> top posts across communities</li>
      <li><strong>{{.RepliesSinceCount}}</strong> new replies to your posts</li>
      <li><strong>{{.CommunityActivity}}</strong> comments in your communities</li>
    </ul>
  </div>

  <p style="font-size: 14px; margin: 20px 0; text-align: center;">
    <a href="{{.UnsubscribeURL}}" style="color: #0066cc; text-decoration: none;">Unsubscribe from digest emails</a>
  </p>

  <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999;">
    <p style="margin: 5px 0;">You received this email because you have weekly digest emails enabled in your preferences.</p>
    <p style="margin: 5px 0;">{{.SiteName}} is closed Sundays. Catch up on the week and take a break.</p>
  </div>
</body>
</html>`

	tmpl, err := template.New("digest_html").Parse(htmlTmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// RenderDigestEmailText renders the plaintext version of the weekly digest email.
func RenderDigestEmailText(data DigestEmailData) string {
	lines := []string{
		"Your Weekly Digest - " + data.SiteName,
		"",
		"Hi " + data.Username + ",",
		"",
		"Here's a summary of what happened on " + data.SiteName + " this week.",
		"",
		"This Week's Activity:",
		fmt.Sprintf("  • %d top posts across communities", data.TopPostsCount),
		fmt.Sprintf("  • %d new replies to your posts", data.RepliesSinceCount),
		fmt.Sprintf("  • %d comments in your communities", data.CommunityActivity),
		"",
		"Unsubscribe: " + data.UnsubscribeURL,
		"",
		"You received this email because you have weekly digest emails enabled.",
		data.SiteName + " is closed Sundays. Catch up and take a break.",
	}
	return strings.Join(lines, "\n")
}
