import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Form, FormField } from '../components/Form';
import Input from '../components/Input';
import { APIError, mfetch } from '../helper';
import { MainState } from '../slices/mainSlice';
import { RootState } from '../store';

const ForgotPassword = () => {
  const user = useSelector<RootState>((state) => state.main.user) as MainState['user'];
  const loggedIn = user !== null;

  // Redirect if already logged in
  if (loggedIn) {
    return <Redirect to="/" />;
  }

  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError('Please enter a username or email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await mfetch('/api/_password_reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ identifier: trimmedId }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json();
        throw new APIError(res.status, json);
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to send password reset email.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content page-login wrap">
      <div className="card login-card">
        {submitted ? (
          <div>
            <div className="title">Check your email</div>
            <div style={{ padding: '2rem' }}>
              <p>
                If an account exists with that username or email address, we've sent a password reset link to the associated email. Follow the link to create a new password.
              </p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                The link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="title">Forgot your password?</div>
            <Form onSubmit={handleSubmit}>
              <FormField label="Username or email address">
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  disabled={loading}
                  autoFocus
                />
              </FormField>

              {error && (
                <FormField>
                  <div className="form-error">{error}</div>
                </FormField>
              )}

              <FormField className="is-submit">
                <button
                  type="submit"
                  className="button button-main"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </FormField>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                <a href="/login" style={{ color: 'var(--color-link)' }}>
                  Back to login
                </a>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
