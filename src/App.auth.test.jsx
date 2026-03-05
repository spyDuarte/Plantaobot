import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
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
    authApi.fetchMe.mockRejectedValue(new ApiError('Sessão inválida.', { status: 401, path: '/auth/me' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
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
      expect(screen.getByRole('button', { name: 'Atualizar senha' })).toBeInTheDocument();
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
      window.dispatchEvent(new CustomEvent('pb-auth-unauthorized', { detail: { path: '/monitor/status' } }));
    });

    await waitFor(() => {
      expect(screen.getByText('Acesse sua conta')).toBeInTheDocument();
    });
  });
});

