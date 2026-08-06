import Link from '../components/Link';
import StaticPage from '../components/StaticPage';

const PrivacyPolicy = () => {
  return (
    <StaticPage className="" title="Privacy Policy">
      <main className="document">
        <h1>Privacy Policy</h1>

        <p>
          {import.meta.env.VITE_SITENAME} is an independent, volunteer-run civic platform for Raleigh, North Carolina. This Privacy Policy describes what information we collect, how we use it, and how we protect your privacy.
        </p>

        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <p>
          When you sign up, we collect a username (required, 3–21 characters), password (encrypted with bcrypt), and optionally an email address, display name, bio, and profile picture. Your email address is optional and not verified — it is never displayed publicly to other users. We also record the IP address and timestamp when your account is created, and optionally which neighborhood you're from (to provide geographic context for your profile).
        </p>

        <h3>Location Data in Your Posts</h3>
        <p>
          Posts on {import.meta.env.VITE_SITENAME} are pinned to real locations in the city — latitude, longitude, and location name. This location data is part of your post and will be visible to other users. It is tied to the post you write, not stored on your user account.
        </p>

        <h3>Technical & Visitor Data</h3>
        <p>
          Like most websites, we automatically collect information from all visitors: your IP address, browser type and version, and the date and time of your requests. This helps us understand how the site is being used and identify abuse.
        </p>

        <h2>Cookies</h2>
        <p>
          We use two cookies to keep you logged in and secure:
        </p>
        <ul>
          <li><strong>Session cookie (SID)</strong> — identifies you across page visits so you stay logged in</li>
          <li><strong>CSRF token cookie</strong> — protects against unauthorized form submissions</li>
        </ul>
        <p>
          These cookies are functional only — they do not track you across websites or enable advertising. You can disable cookies in your browser, but you will not be able to log in.
        </p>

        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Operate and maintain the site</li>
          <li>Verify your email and send you verification messages</li>
          <li>Send you notifications when someone replies to your post or upvotes your comment (you can disable these notifications in your account settings)</li>
          <li>Prevent abuse and enforce our Terms of Service</li>
          <li>Analyze site usage (admins only) to improve the site over time</li>
        </ul>
        <p>
          We do not use your information for advertising, marketing, or to build profiles about you. We do not sell your information.
        </p>

        <h2>Email Communications</h2>
        <p>
          If you provide an email address, we will use it to:
        </p>
        <ul>
          <li>Send you a verification email when you sign up</li>
          <li>Send you optional notification emails (reply notifications, upvote notifications — you can disable either in your account settings)</li>
          <li>Contact you if we need to address violations of our Terms of Service or inform you of important changes to the site</li>
        </ul>
        <p>
          We send email via our own SMTP server, which we control. We do not use third-party marketing platforms or send promotional emails.
        </p>

        <h2>Sharing With Third Parties</h2>
        <p>
          We do not share your personal information with advertisers or third-party data brokers. We do not sell your data.
        </p>
        <p>
          We may share your information with:
        </p>
        <ul>
          <li><strong>MFA provider (if enabled)</strong> — if you set up two-factor authentication, we use an optional third-party service (Stytch) to issue and verify authentication codes</li>
          <li><strong>Browser push services</strong> — if you subscribe to push notifications, the browser vendor (Apple, Google, Microsoft, Firefox) handles delivery of the push message; we only store your subscription endpoint</li>
          <li><strong>Law enforcement</strong> — if we receive a valid legal process (subpoena, court order, warrant) from law enforcement, we may be required to disclose information in our possession</li>
        </ul>

        <h2>Data Retention & Account Deletion</h2>
        <p>
          Your account data is retained as long as your account is active. If you delete your account, the following happens:
        </p>
        <ul>
          <li>Your email address, password, and bio are cleared from the system</li>
          <li>Your display name is replaced with a generic "ghost" account visible to other users</li>
          <li>Your community memberships, notification settings, and push subscriptions are removed</li>
          <li>Your posts and comments remain on the site (because they are part of the public civic record)</li>
        </ul>
        <p>
          If you want your posts or comments removed after deleting your account, or if you have
          other data-removal requests, contact us via direct message on X:{' '}
          <a href="https://x.com/RaleighWiki" target="_blank" rel="noopener">
            @RaleighWiki
          </a>
          . New to DMs?{' '}
          <a href="https://help.x.com/en/using-x/direct-messages" target="_blank" rel="noopener">
            Here's how
          </a>
          .
        </p>

        {/* TODO: Specific consumer-privacy statute compliance claims (CCPA, state NC data-privacy law, GDPR) were intentionally not asserted here pending review by a licensed attorney. Revisit if the site ever scales or if new legal requirements apply. */}

        <h2>Children's Privacy</h2>
        <p>
          {import.meta.env.VITE_SITENAME} is intended for users 18 years of age and older. We do not knowingly collect information from anyone under 18. If we learn that we have collected information from a minor, we will delete it.
        </p>

        <h2>Changes to This Policy</h2>
        <p>We reserve the right to revise this Privacy Policy at any time.</p>

        <p>
          Questions? Reach us via direct message on X:{' '}
          <a href="https://x.com/RaleighWiki" target="_blank" rel="noopener">
            @RaleighWiki
          </a>
          .
        </p>
      </main>
    </StaticPage>
  );
};

export default PrivacyPolicy;
