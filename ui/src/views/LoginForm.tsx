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
  const [mfaCode, setMfaCode] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setLoginError(null);
  }, [username, password, mfaCode]);

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
        // Check if MFA is required
        if (json.mfaRequired) {
          setPendingToken(json.pendingToken);
          setMfaCode('');
          setLoginError(null);
        } else {
          // No MFA, direct login
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

  const handleMfaSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    if (!pendingToken || !mfaCode.trim()) {
      setLoginError('Please enter your 6-digit code.');
      return;
    }
    try {
      const res = await mfetch('/api/_login/mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ pendingToken, code: mfaCode.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        dispatch(userLoggedIn(json));
        window.location.reload();
      } else {
        if (res.status === 400) {
          const json = await res.json();
          setLoginError(json.message || 'Invalid MFA code. Please try again.');
        } else if (res.status === 410) {
          setLoginError('MFA code expired. Please log in again.');
          setPendingToken(null);
          setMfaCode('');
        } else {
          throw new APIError(res.status, await res.json());
        }
      }
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const usernameRef = useRef<HTMLInputElement>(null);
  const mfaCodeRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/login') {
      if (pendingToken) {
        mfaCodeRef.current?.focus();
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
    setMfaCode('');
    setLoginError(null);
  };

  // MFA code entry stage
  if (pendingToken) {
    return (
      <Form className="login-box modal-card-content" onSubmit={handleMfaSubmit}>
        <FormField label="Authenticator code">
          <Input
            ref={mfaCodeRef}
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoComplete="off"
            autoFocus
          />
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            Enter the 6-digit code from your authenticator app.
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
