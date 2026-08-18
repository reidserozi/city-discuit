import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { APIError, mfetch } from '../helper';

const VerifyEmail = () => {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Extract token from URL query params
  const token = new URLSearchParams(location.search).get('token') || '';

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token. Please request a new verification email.');
        return;
      }

      try {
        const res = await mfetch('/api/_email_verification/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          const json = await res.json();
          if (res.status === 400) {
            setStatus('error');
            setMessage(json.message || 'Invalid or expired verification link.');
          } else {
            throw new APIError(res.status, json);
          }
        }
      } catch (err) {
        setStatus('error');
        if (err instanceof APIError) {
          setMessage(err.message || 'Failed to verify email.');
        } else {
          setMessage('An unexpected error occurred.');
        }
      }
    };

    confirmEmail();
  }, [token]);

  return (
    <div className="page-content wrap">
      <div className="card verify-email-card">
        {status === 'loading' && (
          <>
            <div className="title">Verifying your email...</div>
            <p className="verify-email-message">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="title verify-email-success">Email verified!</div>
            <p className="verify-email-body">{message}</p>
            <p className="verify-email-message">
              You can now close this page and enjoy the full features of the site.
            </p>
            <a href="/" className="button button-main verify-email-action">
              Go to home
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="title verify-email-error">Verification failed</div>
            <p className="verify-email-body">{message}</p>
            <div className="verify-email-message">
              <p>Try:</p>
              <ul className="verify-email-list">
                <li>Requesting a new verification email from your settings</li>
                <li>Checking your spam or junk folder</li>
              </ul>
            </div>
            <a href="/" className="button button-main verify-email-action">
              Go to home
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
