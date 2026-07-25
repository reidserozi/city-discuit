import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, FormField } from '../../components/Form';
import Input, { InputPassword } from '../../components/Input';
import { APIError, mfetch } from '../../helper';
import { snackAlert, userLoggedIn } from '../../slices/mainSlice';
import { RootState } from '../../store';

const TwoFactorAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.main.user);

  const [stage, setStage] = useState<'view' | 'enroll' | 'confirm-enroll' | 'disable'>('view');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartEnroll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mfetch('/api/_mfa?action=enrollStart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const json = await res.json();
        setTotpSecret(json.secret);
        setQrCodeUrl(json.qrCode);
        setRecoveryCodes(json.recoveryCodes || []);
        setStage('enroll');
      } else {
        const json = await res.json();
        throw new APIError(res.status, json);
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to start MFA enrollment.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!totpCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await mfetch('/api/_mfa?action=enrollConfirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ code: totpCode }),
      });

      if (res.ok) {
        dispatch(userLoggedIn(user!)); // Update user to reflect mfaEnabled: true
        dispatch(snackAlert('Two-factor authentication enabled!'));
        setStage('view');
        setTotpSecret('');
        setQrCodeUrl('');
        setRecoveryCodes([]);
        setTotpCode('');
      } else {
        const json = await res.json();
        throw new APIError(res.status, json);
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to verify code.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartDisable = () => {
    setPassword('');
    setError(null);
    setStage('disable');
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your password to disable two-factor authentication.');
      return;
    }

    setLoading(true);
    try {
      const res = await mfetch('/api/_mfa', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        dispatch(userLoggedIn(user!)); // Update user to reflect mfaEnabled: false
        dispatch(snackAlert('Two-factor authentication disabled.'));
        setStage('view');
        setPassword('');
      } else {
        const json = await res.json();
        if (res.status === 400) {
          setError(json.message || 'Invalid password.');
        } else {
          throw new APIError(res.status, json);
        }
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Failed to disable two-factor authentication.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEnroll = () => {
    setStage('view');
    setTotpSecret('');
    setQrCodeUrl('');
    setRecoveryCodes([]);
    setTotpCode('');
    setError(null);
  };

  const handleCancelDisable = () => {
    setStage('view');
    setPassword('');
    setError(null);
  };

  // View stage - show status and buttons
  if (stage === 'view') {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Two-Factor Authentication</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
              {user?.mfaEnabled
                ? 'Two-factor authentication is enabled on your account.'
                : 'Enhance your account security with two-factor authentication.'}
            </p>
          </div>
          {user?.mfaEnabled ? (
            <button
              type="button"
              className="button button-outline"
              onClick={handleStartDisable}
              style={{ whiteSpace: 'nowrap' }}
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              className="button button-main"
              onClick={handleStartEnroll}
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? 'Setting up...' : 'Enable'}
            </button>
          )}
        </div>
        {user?.mfaEnabled && (
          <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
            When enabled, you'll be asked for a code from your authenticator app each time you log in.
          </p>
        )}
      </div>
    );
  }

  // Enrollment stage - show QR code and secret
  if (stage === 'enroll') {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Set up Two-Factor Authentication</h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.):
          </p>
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img
                src={qrCodeUrl}
                alt="QR Code for TOTP"
                style={{ width: '200px', height: '200px', border: '1px solid #ddd', padding: '0.5rem' }}
              />
            </div>
          )}

          {totpSecret && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                Or enter this code manually:
              </p>
              <code
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  letterSpacing: '2px',
                }}
              >
                {totpSecret}
              </code>
            </div>
          )}
        </div>

        {recoveryCodes.length > 0 && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '0.25rem' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 0, marginBottom: '0.5rem' }}>
              Save these recovery codes in a safe place:
            </p>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0' }}>
              If you lose access to your authenticator, you can use these codes to recover your account.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {recoveryCodes.map((code, i) => (
                <code
                  key={i}
                  style={{
                    display: 'block',
                    padding: '0.5rem',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #eee',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <strong>Next:</strong> Enter the 6-digit code from your authenticator app:
        </p>

        <Form onSubmit={handleConfirmEnroll}>
          <FormField label="Verification code">
            <Input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              autoComplete="off"
            />
          </FormField>

          {error && (
            <FormField>
              <div className="form-error">{error}</div>
            </FormField>
          )}

          <FormField className="is-submit">
            <button type="submit" className="button button-main" disabled={loading || totpCode.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button type="button" className="button-link" onClick={handleCancelEnroll}>
              Cancel
            </button>
          </FormField>
        </Form>
      </div>
    );
  }

  // Disable stage - password confirmation
  if (stage === 'disable') {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-red)' }}>Disable Two-Factor Authentication</h3>
        <p style={{ fontSize: '0.9rem' }}>
          Enter your password to disable two-factor authentication on your account.
        </p>

        <Form onSubmit={handleDisable}>
          <FormField label="Password">
            <InputPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
            />
          </FormField>

          {error && (
            <FormField>
              <div className="form-error">{error}</div>
            </FormField>
          )}

          <FormField className="is-submit">
            <button type="submit" className="button button-outline" disabled={loading || !password}>
              {loading ? 'Disabling...' : 'Disable'}
            </button>
            <button type="button" className="button-link" onClick={handleCancelDisable}>
              Cancel
            </button>
          </FormField>
        </Form>
      </div>
    );
  }

  return null;
};

export default TwoFactorAuth;
