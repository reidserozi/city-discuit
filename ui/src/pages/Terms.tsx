import Link from '../components/Link';
import StaticPage from '../components/StaticPage';

const Terms = () => {
  return (
    <StaticPage className="" title="Terms of Service">
      <main className="document">
        <h1>Terms of Service</h1>
        <p>
          These Terms of Service govern your access to and use of our services including this
          website ("Services"). By using these Services you agree to be bound by these terms.
        </p>

        <h2>Age Requirements</h2>
        <p>
          You must be at least 13 years old to use the Services. By accessing or using Edit Raleigh, you represent and warrant that you are 13 or older.
        </p>

        <h2>Privacy</h2>
        <p>
          Our <Link to="/privacy-policy">Privacy Policy</Link> describes how we handle the
          information you provide to us when you use our Services. You understand that through your
          use of the Services you consent to the collection and use of this information.
        </p>

        <h2>Content on the Services</h2>
        <p>
          You are responsible for your use of the Services and for any Content you provide,
          including compliance with applicable laws, rules, and regulations. You should not provide
          Content that you are uncomfortable sharing with others.
        </p>

        <p>
          Any use or reliance on any Content or materials posted via the Services or obtained by you
          through the Services is at your own risk. We do not endorse, support, represent or
          guarantee the completeness, truthfulness, accuracy, or reliability of any Content or
          communications posted via the Services or endorse any opinions expressed via the Services.
          You understand that by using the Services, you may be exposed to Content that might be
          offensive, harmful, inaccurate or otherwise inappropriate, or in some cases, postings that
          have been mislabeled or are otherwise deceptive. All Content is the sole responsibility of
          the person who originated such Content. We may not monitor or control the Content posted
          via the Services and, we cannot take responsibility for such Content.
        </p>

        <p>
          We reserve the right to remove any Content that may or may not violate the Terms of
          Service at any time.
        </p>

        <h2>Content License</h2>
        <p>
          You retain all rights to any Content you submit, post or display on or through the
          Services.
        </p>

        <p>
          By submitting, posting or displaying Content on or through the Services, you grant the
          public a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, modify,
          publish, and distribute such Content under the Creative Commons Attribution 4.0 (CC-BY)
          license. This means your contributions may be used by anyone — including residents, city
          staff, journalists, and researchers — for any purpose, so long as they provide credit to
          you as an "Edit Raleigh Contributor."
        </p>

        <p>
          You also grant Edit Raleigh a perpetual, worldwide, non-exclusive, fully paid-up,
          royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit,
          display and distribute such Content in any and all media or distribution methods now known
          or later developed.
        </p>

        <p>
          You represent and warrant that you have, or have obtained, all rights, licenses, consents,
          permissions, power and/or authority necessary to grant the rights granted herein for any
          Content that you submit, post or display on or through the Services. You agree that such
          Content will not contain material subject to copyright or other proprietary rights, unless
          you have necessary permission or are otherwise legally entitled to post the material and
          to grant Edit Raleigh the license described above.
        </p>

        <h2>Copyright</h2>
        <p>
          If you believe that your Content has been copied in a way that constitutes copyright
          infringement, please send us an email at{' '}
          <a href={import.meta.env.VITE_EMAILCONTACT}>{import.meta.env.VITE_EMAILCONTACT}</a>.
        </p>

        <h2>Account Termination</h2>
        <p>
          Edit Raleigh reserves the right to limit, suspend, terminate, modify, or delete your
          account and your access to the Services at its sole discretion, for any or no reason,
          with or without notice.
        </p>

        <h2>Section 230</h2>
        <p>
          Edit Raleigh is a platform for community discussion. We are not the publisher or speaker
          of user-submitted content. Under 47 U.S.C. § 230, Edit Raleigh is not liable for
          damages based on user-generated content, except as specifically required by law.
        </p>

        <h2>Limitations of Liability</h2>
        <p>
          In no event shall this website or its suppliers and maintainers be liable for any damages,
          including, without limitation, damages for loss of data or profit, arising out of the use
          or inability to use the Services, even if we have been notified beforehand the possibility
          of such damage.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The Services of this website are provided "as is". We make no warranties, expressed or
          implied, and hereby disclaims and negates all other warranties, including without
          limitation, implied warranties or conditions of merchantability, fitness for a particular
          purpose, or non-infringement of intellectual property or other violation of rights.
          Further, we do not warrant or make any representations concerning the accuracy, likely
          results, or reliability of the use of the Services or otherwise relating to such materials
          or on any sites linked to this site.
        </p>

        <h2>Governing Law &amp; Venue</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance with the laws of
          the State of North Carolina, without regard to the principles of conflict of laws. You
          agree that any legal action or proceeding arising out of or relating to these Terms or your
          use of the Services shall be brought exclusively in the state or federal courts located in
          Wake County, North Carolina, and you consent to the jurisdiction and venue of such courts.
        </p>

        {/* TODO: Additional NC-specific protections (anti-SLAPP, anonymous-poster standards, etc.) should be reviewed by a licensed NC attorney before adding. This ensures accuracy and compliance with North Carolina law. */}

        <h2>General</h2>
        <p>These Terms may change at any time.</p>
      </main>
    </StaticPage>
  );
};

export default Terms;
