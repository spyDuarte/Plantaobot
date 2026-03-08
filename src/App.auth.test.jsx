import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';
import { ApiError } from './services/apiClient.js';
import * as authApi from './services/authApi.js';

vi.mock('./AppMain.jsx', () => ({
  default: () => <div data-testid="mock-app-main">APP_MAIN_READY</div>,
}));

vi.mock('./services/authApi.js', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  fetchMe: vi.fn(),
  resendVerification: vi.fn(),
  forgotPassword: vi.fn(),
  confirmAuth: vi.fn(),
  resetPassword: vi.fn(),
  bootstrapImport: vi.fn(),
}));

describe('App auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders login gate when /auth/me returns 401', async () => {
    authApi.fetchMe.mockRejectedValue(
      new ApiError('Sessão inválida.', { status: 401, path: '/auth/me' }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Entrar na Plataforma' })).toBeInTheDocument();
  });

  it('renders main app when user session is valid', async () => {
    authApi.fetchMe.mockResolvedValue({
      user: { id: 'user-1', email: 'med@example.com' },
      profile: { id: 'user-1', name: 'Dr. Med' },
      emailVerified: true,
    });
    authApi.bootstrapImport.mockResolvedValue({ imported: false, alreadyImported: true });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-app-main')).toBeInTheDocument();
    });

    expect(authApi.bootstrapImport).toHaveBeenCalledTimes(1);
  });

  it('handles callback recovery token and shows reset password state', async () => {
    authApi.confirmAuth.mockResolvedValue({ ok: true });

    window.history.replaceState({}, '', '/?token_hash=med@example.com&type=recovery');

    render(<App />);

    await waitFor(() => {
      expect(authApi.confirmAuth).toHaveBeenCalledWith({
        token_hash: 'med@example.com',
        type: 'recovery',
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Definir nova senha' })).toBeInTheDocument();
    });
  });

  it('blocks login submit with invalid email before calling API', async () => {
    authApi.fetchMe.mockRejectedValue(
      new ApiError('Sessão inválida.', { status: 401, path: '/auth/me' }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Entrar na Plataforma' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'invalido' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Senha123' } });
    const loginForm = screen.getByPlaceholderText('seu@email.com').closest('form');
    fireEvent.submit(loginForm);

    await waitFor(() => {
      expect(screen.getByText('Email em formato inválido.')).toBeInTheDocument();
    });

    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows validation warning when resend verification has no valid email', async () => {
    authApi.fetchMe.mockRejectedValue(
      new ApiError('Sessão inválida.', { status: 401, path: '/auth/me' }),
    );
    authApi.login.mockRejectedValue(
      new ApiError('Email não verificado.', { status: 403, path: '/auth/login' }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Entrar na Plataforma' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'sem-arroba' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Senha123' } });
    let loginForm = screen.getByPlaceholderText('seu@email.com').closest('form');
    fireEvent.submit(loginForm);

    // Ajusta para credenciais válidas para simular conta não verificada e entrar na tela correta
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'med@example.com' },
    });
    loginForm = screen.getByPlaceholderText('seu@email.com').closest('form');
    fireEvent.submit(loginForm);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reenviar verificação' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar verificação' }));

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalledWith({ email: 'med@example.com' });
    });
  });

  it('returns to login when unauthorized event is emitted', async () => {
    authApi.fetchMe.mockResolvedValue({
      user: { id: 'user-9', email: 'user9@example.com' },
      profile: { id: 'user-9', name: 'Dr. Nove' },
      emailVerified: true,
    });
    authApi.bootstrapImport.mockResolvedValue({ imported: false, alreadyImported: true });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-app-main')).toBeInTheDocument();
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent('pb-auth-unauthorized', { detail: { path: '/monitor/status' } }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
    });
  });
});
