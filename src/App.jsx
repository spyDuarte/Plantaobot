import { useCallback, useEffect, useMemo, useState } from 'react';
import AppMain from './AppMain.jsx';
import { CSS } from './styles/index.js';
import { C } from './constants/colors.js';
import { Badge, Button, Input } from './components/ui/index.jsx';
import {
  bootstrapImport,
  confirmAuth,
  fetchMe,
  forgotPassword,
  login,
  logout,
  resendVerification,
  resetPassword,
  signup,
} from './services/authApi.js';
import { ApiError } from './services/apiClient.js';
import {
  normalizeEmailInput,
  validateEmailPayload,
  validateLoginForm,
  validateResetPassword,
  validateSignupForm,
} from './utils/authValidation.js';

// Auth gate logic:
//   VITE_AUTH_ENABLED=true  → always on (used by tests and explicit opt-in)
//   VITE_AUTH_ENABLED=false → always off (dev bypass without credentials)
//   unset + supabase        → on only when VITE_SUPABASE_URL/ANON_KEY are defined
//   unset + bff             → always on (BFF handles its own session cookie)
const _authProvider = String(import.meta.env.VITE_AUTH_PROVIDER || 'supabase').toLowerCase();
const _supabaseReady = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const AUTH_ENABLED =
  import.meta.env.VITE_AUTH_ENABLED === 'true' ||
  (import.meta.env.VITE_AUTH_ENABLED !== 'false' && (_authProvider === 'bff' || _supabaseReady));

const STATUS = {
  LOADING: 'loading',
  PROCESSING_CALLBACK: 'processing_callback',
  UNAUTHENTICATED: 'unauthenticated',
  UNVERIFIED: 'unverified',
  AUTHENTICATED: 'authenticated',
};

const MODE = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot',
  RESET: 'reset',
};

const LEGACY_DATA_KEYS = ['pb_prefs', 'pb_groups', 'pb_captured', 'pb_rejected'];

function toSafeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readLocalStorageJson(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) {
      return fallbackValue;
    }

    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeLocalStorageJson(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota and browser restrictions.
  }
}

function clearLegacyOperationalData() {
  if (typeof window === 'undefined') {
    return;
  }

  LEGACY_DATA_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Non-blocking cleanup.
    }
  });
}

function buildBootstrapPayload() {
  return {
    prefs: toSafeObject(readLocalStorageJson('pb_prefs', {})),
    groups: toSafeArray(readLocalStorageJson('pb_groups', [])),
    captured: toSafeArray(readLocalStorageJson('pb_captured', [])),
    rejected: toSafeArray(readLocalStorageJson('pb_rejected', [])),
  };
}

function parseAuthCallback() {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  if (!tokenHash || !type) {
    return null;
  }

  return {
    tokenHash,
    type,
  };
}

function clearAuthCallbackParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  ['token_hash', 'type', 'error', 'error_code', 'error_description', 'code'].forEach((param) => {
    url.searchParams.delete(param);
  });

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function errorMessage(error, fallbackMessage) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (typeof error?.message === 'string' && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function ToneMessage({ item }) {
  if (!item) {
    return null;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <Badge tone={item.tone} style={{ display: 'block', textAlign: 'center', padding: '8px' }}>
        {item.text}
      </Badge>
    </div>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: C.background || '#f8fafc',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: C.surface1,
            padding: 32,
            borderRadius: 12,
            boxShadow:
              '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: C.primary,
                color: '#fff',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              PB
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text0, marginBottom: 8 }}>
              Plantaobot
            </div>
            <div style={{ fontSize: 15, color: C.text1 }}>{title}</div>
            {subtitle ? (
              <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>{subtitle}</div>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [status, setStatus] = useState(AUTH_ENABLED ? STATUS.LOADING : STATUS.AUTHENTICATED);
  const [authMode, setAuthMode] = useState(MODE.LOGIN);
  const [busy, setBusy] = useState(false);
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [session, setSession] = useState({
    user: null,
    profile: null,
    emailVerified: false,
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetValue, setResetValue] = useState('');

  const syncProfileName = useCallback((profile) => {
    if (!profile?.name) {
      return;
    }

    const currentName = readLocalStorageJson('pb_name', '');
    if (!currentName || String(currentName).trim() === '') {
      writeLocalStorageJson('pb_name', profile.name);
    }
  }, []);

  const runBootstrapImport = useCallback(async () => {
    const payload = buildBootstrapPayload();
    const result = await bootstrapImport(payload);

    if (result?.imported || result?.alreadyImported) {
      clearLegacyOperationalData();
    }
  }, []);

  const loadCurrentSession = useCallback(async () => {
    try {
      const data = await fetchMe();

      setSession({
        user: data.user,
        profile: data.profile,
        emailVerified: Boolean(data.emailVerified),
      });

      syncProfileName(data.profile);

      if (!data.emailVerified) {
        setStatus(STATUS.UNVERIFIED);
        return false;
      }

      setBootstrapBusy(true);
      try {
        await runBootstrapImport();
      } finally {
        setBootstrapBusy(false);
      }

      setStatus(STATUS.AUTHENTICATED);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus(STATUS.UNAUTHENTICATED);
        setSession({ user: null, profile: null, emailVerified: false });
        return false;
      }

      setStatus(STATUS.UNAUTHENTICATED);
      setMessage({
        tone: 'error',
        text: errorMessage(error, 'Falha ao validar sua sessão atual.'),
      });
      return false;
    }
  }, [runBootstrapImport, syncProfileName]);

  useEffect(() => {
    let active = true;

    const handleUnauthorized = () => {
      if (!active) {
        return;
      }

      setStatus(STATUS.UNAUTHENTICATED);
      setAuthMode(MODE.LOGIN);
      setSession({ user: null, profile: null, emailVerified: false });
      setMessage({ tone: 'warning', text: 'Sessão expirada. Faça login novamente.' });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pb-auth-unauthorized', handleUnauthorized);
    }

    const bootstrap = async () => {
      if (!AUTH_ENABLED) return;

      const callback = parseAuthCallback();

      if (callback) {
        setStatus(STATUS.PROCESSING_CALLBACK);
        try {
          await confirmAuth({
            token_hash: callback.tokenHash,
            type: callback.type,
          });

          if (!active) {
            return;
          }

          if (callback.type === 'recovery') {
            setAuthMode(MODE.RESET);
            setStatus(STATUS.UNAUTHENTICATED);
            setMessage({ tone: 'success', text: 'Token validado. Defina a nova senha.' });
          } else {
            setMessage({ tone: 'success', text: 'Email confirmado com sucesso.' });
            await loadCurrentSession();
          }
        } catch (error) {
          if (!active) {
            return;
          }

          setStatus(STATUS.UNAUTHENTICATED);
          setAuthMode(MODE.LOGIN);
          setMessage({
            tone: 'error',
            text: errorMessage(error, 'Não foi possível processar o link de confirmação.'),
          });
        } finally {
          clearAuthCallbackParams();
        }

        return;
      }

      await loadCurrentSession();
    };

    void bootstrap();

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pb-auth-unauthorized', handleUnauthorized);
      }
    };
  }, [loadCurrentSession]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Cookies are httpOnly and may already be expired; local state still resets.
    }

    setStatus(STATUS.UNAUTHENTICATED);
    setAuthMode(MODE.LOGIN);
    setSession({ user: null, profile: null, emailVerified: false });
    setMessage({ tone: 'info', text: 'Sessão encerrada.' });
  }, []);

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setMessage(null);

      const validation = validateLoginForm(loginForm);

      if (!validation.valid) {
        setMessage({ tone: 'warning', text: validation.message });
        setBusy(false);
        return;
      }

      setLoginForm(validation.normalized);

      try {
        await login(validation.normalized);
        await loadCurrentSession();
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          setStatus(STATUS.UNVERIFIED);
          setSession((previous) => ({
            ...previous,
            user: {
              ...(previous.user || {}),
              email: loginForm.email,
            },
            emailVerified: false,
          }));
          setMessage({ tone: 'warning', text: 'Confirme seu email para concluir o login.' });
        } else {
          setMessage({ tone: 'error', text: errorMessage(error, 'Não foi possível fazer login.') });
        }
      } finally {
        setBusy(false);
      }
    },
    [loadCurrentSession, loginForm],
  );

  const handleSignup = useCallback(
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setMessage(null);

      const validation = validateSignupForm(signupForm);

      if (!validation.valid) {
        setMessage({ tone: 'warning', text: validation.message });
        setBusy(false);
        return;
      }

      setSignupForm(validation.normalized);

      try {
        const result = await signup(validation.normalized);

        if (result.emailVerified) {
          await loadCurrentSession();
        } else {
          setAuthMode(MODE.LOGIN);
          setLoginForm((previous) => ({ ...previous, email: validation.normalized.email }));
          setMessage({
            tone: 'info',
            text: 'Conta criada. Verifique seu email para ativar o acesso.',
          });
        }
      } catch (error) {
        setMessage({
          tone: 'error',
          text: errorMessage(error, 'Não foi possível criar sua conta.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [loadCurrentSession, signupForm],
  );

  const handleForgotPassword = useCallback(
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setMessage(null);

      const validation = validateEmailPayload(forgotEmail);

      if (!validation.valid) {
        setMessage({ tone: 'warning', text: validation.message });
        setBusy(false);
        return;
      }

      setForgotEmail(validation.normalized);

      try {
        await forgotPassword({ email: validation.normalized });
        setMessage({ tone: 'success', text: 'Enviamos um link para redefinir sua senha.' });
      } catch (error) {
        setMessage({
          tone: 'error',
          text: errorMessage(error, 'Não foi possível enviar o email de recuperação.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [forgotEmail],
  );

  const handleResetPassword = useCallback(
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setMessage(null);

      const validation = validateResetPassword(resetValue);

      if (!validation.valid) {
        setMessage({ tone: 'warning', text: validation.message });
        setBusy(false);
        return;
      }

      try {
        await resetPassword({ newPassword: validation.normalized });
        setResetValue('');
        setMessage({ tone: 'success', text: 'Senha atualizada com sucesso.' });
        await loadCurrentSession();
      } catch (error) {
        setMessage({
          tone: 'error',
          text: errorMessage(error, 'Não foi possível redefinir sua senha.'),
        });
      } finally {
        setBusy(false);
      }
    },
    [loadCurrentSession, resetValue],
  );

  const resendTargetEmail = useMemo(
    () => session.user?.email || signupForm.email || loginForm.email,
    [loginForm.email, session.user?.email, signupForm.email],
  );

  const handleResendVerification = useCallback(async () => {
    const validation = validateEmailPayload(resendTargetEmail);

    if (!validation.valid) {
      setMessage({
        tone: 'warning',
        text: 'Informe um email para reenviar o link de confirmação.',
      });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await resendVerification({ email: validation.normalized });
      setMessage({ tone: 'success', text: 'Email de verificação reenviado.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: errorMessage(error, 'Não foi possível reenviar o email de verificação.'),
      });
    } finally {
      setBusy(false);
    }
  }, [resendTargetEmail]);

  if (status === STATUS.AUTHENTICATED) {
    return <AppMain onLogout={handleLogout} />;
  }

  if (status === STATUS.LOADING || status === STATUS.PROCESSING_CALLBACK || bootstrapBusy) {
    return (
      <AuthLayout title="Acesso seguro">
        <ToneMessage item={message} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `3px solid ${C.border}`,
              borderTopColor: C.primary,
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ fontSize: 14, color: C.text1 }}>
            {status === STATUS.PROCESSING_CALLBACK
              ? 'Validando token de email...'
              : bootstrapBusy
                ? 'Sincronizando dados iniciais da conta...'
                : 'Verificando sessão...'}
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (status === STATUS.UNVERIFIED) {
    return (
      <AuthLayout
        title="Email pendente de verificação"
        subtitle="Confirme seu email para liberar o acesso"
      >
        <ToneMessage item={message} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, color: C.text1, textAlign: 'center' }}>
            Enviamos um link para:
            <br />
            <strong style={{ color: C.text0 }}>
              {session.user?.email || resendTargetEmail || 'não informada'}
            </strong>
          </div>
          <Button type="button" onClick={handleResendVerification} disabled={busy}>
            {busy ? 'Enviando...' : 'Reenviar verificação'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void loadCurrentSession();
            }}
            disabled={busy}
          >
            Já confirmei o email
          </Button>
          <Button type="button" variant="secondary" onClick={handleLogout} disabled={busy}>
            Voltar para o Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Acesse sua conta">
      <ToneMessage item={message} />

      {authMode === MODE.LOGIN ? (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((previous) => ({
                  ...previous,
                  email: normalizeEmailInput(event.target.value),
                }))
              }
              autoComplete="email"
              required
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>Senha</label>
              <button
                type="button"
                onClick={() => setAuthMode(MODE.FORGOT)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.primary,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((previous) => ({ ...previous, password: event.target.value }))
              }
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Entrando...' : 'Entrar na Plataforma'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => setAuthMode(MODE.SIGNUP)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.primary,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Criar conta
            </button>
          </div>
        </form>
      ) : null}

      {authMode === MODE.SIGNUP ? (
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Nome completo
            </label>
            <Input
              type="text"
              placeholder="Dr(a). Seu Nome"
              value={signupForm.name}
              onChange={(event) =>
                setSignupForm((previous) => ({ ...previous, name: event.target.value }))
              }
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={signupForm.email}
              onChange={(event) =>
                setSignupForm((previous) => ({
                  ...previous,
                  email: normalizeEmailInput(event.target.value),
                }))
              }
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Senha
            </label>
            <Input
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={signupForm.password}
              onChange={(event) =>
                setSignupForm((previous) => ({ ...previous, password: event.target.value }))
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Criando conta...' : 'Criar conta'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
            Já possui conta?{' '}
            <button
              type="button"
              onClick={() => setAuthMode(MODE.LOGIN)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.primary,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Fazer login
            </button>
          </div>
        </form>
      ) : null}

      {authMode === MODE.FORGOT ? (
        <form
          onSubmit={handleForgotPassword}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Email para recuperação
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(normalizeEmailInput(event.target.value))}
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Enviando link...' : 'Enviar link de recuperação'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
            Lembrou a senha?{' '}
            <button
              type="button"
              onClick={() => setAuthMode(MODE.LOGIN)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.primary,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Voltar ao login
            </button>
          </div>
        </form>
      ) : null}

      {authMode === MODE.RESET ? (
        <form
          onSubmit={handleResetPassword}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: C.text1,
                marginBottom: 6,
              }}
            >
              Nova senha
            </label>
            <Input
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={resetValue}
              onChange={(event) => setResetValue(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Atualizando...' : 'Definir nova senha'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAuthMode(MODE.LOGIN)}
            disabled={busy}
          >
            Cancelar
          </Button>
        </form>
      ) : null}
    </AuthLayout>
  );
}
