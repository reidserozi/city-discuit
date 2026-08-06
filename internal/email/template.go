package email

import "fmt"

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
