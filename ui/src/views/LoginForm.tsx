import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Form, FormField } from '../components/Form';
import Input, { InputPassword } from '../components/Input';
import { APIError, mfetch } from '../helper';
import { loginModalOpened, signupModalOpened, snackAlertError, userLoggedIn } from '../slices/mainSlice';

const LoginForm = ({ isModal = false }: { isModal?: boolean }) => {
  const dispatch = useDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setLoginError(null);
  }, [username, password, otpCode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLoginSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    if (username === '' && password === '') {
      setLoginError('Username and password empty.');
      return;
    } else if (username === '') {
      setLoginError('Username empty.');
      return;
    } else if (password === '') {
      setLoginError('Password empty.');
      return;
    }
    try {
      const res = await mfetch('/api/_login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const json = await res.json();
        // Check if OTP is required
        if (json.otpRequired) {
          setPendingToken(json.pendingToken);
          setOtpCode('');
          setLoginError(null);
          setResendCooldown(0);
        } else {
          // No OTP, direct login
          dispatch(userLoggedIn(json));
          window.location.reload();
        }
      } else {
        if (res.status === 401) {
          setLoginError('Username and password do not match.');
        } else if (res.status === 403) {
          const json = await res.json();
          if (json.code === 'account_suspended') {
            setLoginError(`@${username} is suspended.`);
          } else {
            throw new APIError(res.status, json);
          }
        } else {
          throw new APIError(res.status, await res.json());
        }
      }
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const handleOtpSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    if (!pendingToken || !otpCode.trim()) {
      setLoginError('Please enter your 6-digit code.');
      return;
    }
    try {
      const res = await mfetch('/api/_login/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ pendingToken, code: otpCode.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        dispatch(userLoggedIn(json));
        window.location.reload();
      } else {
        if (res.status === 400) {
          const json = await res.json();
          setLoginError(json.message || 'Invalid OTP code. Please try again.');
        } else if (res.status === 410) {
          setLoginError('OTP code expired. Please log in again.');
          setPendingToken(null);
          setOtpCode('');
        } else {
          throw new APIError(res.status, await res.json());
        }
      }
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const handleResendOtp: React.MouseEventHandler = async (event) => {
    event.preventDefault();
    if (!pendingToken || resendCooldown > 0) return;

    try {
      const res = await mfetch('/api/_login/otp/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ pendingToken }),
      });
      if (res.ok) {
        setLoginError(null);
        setOtpCode('');
        setResendCooldown(30);
      } else {
        const json = await res.json();
        setLoginError(json.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const usernameRef = useRef<HTMLInputElement>(null);
  const otpCodeRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/login') {
      if (pendingToken) {
        otpCodeRef.current?.focus();
      } else {
        usernameRef.current?.focus();
      }
    }
  }, [pathname, pendingToken]);

  const handleOnSignup: React.MouseEventHandler = (event) => {
    event.preventDefault();
    dispatch(loginModalOpened(false));
    dispatch(signupModalOpened());
  };

  const handleBackToLogin = () => {
    setPendingToken(null);
    setOtpCode('');
    setLoginError(null);
    setResendCooldown(0);
  };

  // OTP code entry stage
  if (pendingToken) {
    return (
      <Form className="login-box modal-card-content" onSubmit={handleOtpSubmit}>
        <FormField label="Email verification code">
          <Input
            ref={otpCodeRef}
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoComplete="off"
            autoFocus
          />
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            We emailed you a 6-digit code. Enter it below to finish logging in.
          </div>
        </FormField>
        {loginError && (
          <FormField>
            <div className="form-error text-center">{loginError}</div>
          </FormField>
        )}
        <FormField className="is-submit">
          <input type="submit" className="button button-main" value="Verify" />
          <button type="button" className="button-link" onClick={handleBackToLogin}>
            Back to login
          </button>
        </FormField>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
          <button
            type="button"
            style={{
              color: resendCooldown > 0 ? '#999' : 'var(--color-link)',
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Didn't receive it? Resend code"}
          </button>
        </div>
      </Form>
    );
  }

  // Standard username/password stage
  return (
    <Form className="login-box modal-card-content" onSubmit={handleLoginSubmit}>
      <FormField label="Username">
        <Input
          ref={usernameRef}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus={isModal}
          autoComplete="username"
        />
      </FormField>
      <FormField label="Password">
        <InputPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </FormField>
      {loginError && (
        <FormField>
          <div className="form-error text-center">{loginError}</div>
        </FormField>
      )}
      <FormField className="is-submit">
        <input type="submit" className="button button-main" value="Login" />
        <button className="button-link" onClick={handleOnSignup}>
          {"Don't have an account? Signup"}
        </button>
      </FormField>
      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
        <a href="/forgot-password" style={{ color: 'var(--color-link)', textDecoration: 'none' }}>
          Forgot your password?
        </a>
      </div>
    </Form>
  );
};

export default LoginForm;
