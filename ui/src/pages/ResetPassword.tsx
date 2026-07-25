import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { Form, FormField } from '../components/Form';
import { InputPassword } from '../components/Input';
import { APIError, mfetch } from '../helper';
import { MainState, userLoggedIn } from '../slices/mainSlice';
import { AppDispatch, RootState } from '../store';

const ResetPassword = () => {
  const user = useSelector<RootState>((state) => state.main.user) as MainState['user'];
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // Redirect if already logged in
  if (user !== null) {
    return <Redirect to="/" />;
  }

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract token from URL query params
  const token = new URLSearchParams(location.search).get('token') || '';

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset token.');
      return;
    }

    if (!password || !repeatPassword) {
      setError('Please enter a password in both fields.');
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await mfetch('/api/_password_reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        const userData = await res.json();
        // Auto-login the user
        dispatch(userLoggedIn(userData));
        setSuccess(true);
        // Redirect to home after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const json = await res.json();
        if (res.status === 400) {
          setError(json.message || 'Invalid or expired reset link.');
        } else {
          throw new APIError(res.status, json);
        }
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to reset password.');
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
        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="title">Password reset successfully!</div>
            <p style={{ marginTop: '1rem' }}>You've been logged in. Redirecting...</p>
          </div>
        ) : (
          <>
            <div className="title">Create a new password</div>
            <Form onSubmit={handleSubmit}>
              <FormField label="New password">
                <InputPassword
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading || !token}
                  autoFocus={!!token}
                />
              </FormField>

              <FormField label="Confirm password">
                <InputPassword
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading || !token}
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
                  disabled={loading || !token}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
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

export default ResetPassword;
