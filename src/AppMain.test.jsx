import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const savePreferencesMock = vi.fn();
const saveGroupsMock = vi.fn();
const fetchPreferencesMock = vi.fn();
const fetchGroupsMock = vi.fn();
const fetchWhatsappStatusMock = vi.fn();
const captureOfferMock = vi.fn();

const startMonitoringHookMock = vi.fn();
const stopMonitoringHookMock = vi.fn();
const loadInitialStatusHookMock = vi.fn();
const startPollingHookMock = vi.fn();

const loadInitialShiftsHookMock = vi.fn();
const clearAllHistoryHookMock = vi.fn();
const resetProcessQueueHookMock = vi.fn();
const registerCaptureHookMock = vi.fn();

const handleFeedItemsHookMock = vi.fn();
const acceptPendingHookMock = vi.fn();
const rejectPendingHookMock = vi.fn();

const useMonitoringReturn = {
  botOn: false,
  feedError: null,
  apiLoading: false,
  startBot: startMonitoringHookMock,
  stopBot: stopMonitoringHookMock,
  loadInitialStatus: loadInitialStatusHookMock,
  startPolling: startPollingHookMock,
};

const useShiftsReturn = {
  feed: [],
  captured: [],
  rejected: [],
  pending: [],
  handleFeedItems: handleFeedItemsHookMock,
  acceptPending: acceptPendingHookMock,
  rejectPending: rejectPendingHookMock,
  loadInitialShifts: loadInitialShiftsHookMock,
  clearAllHistory: clearAllHistoryHookMock,
  resetProcessQueue: resetProcessQueueHookMock,
  registerCapture: registerCaptureHookMock,
};

const mockShift = {
  id: 'offer-1',
  hospital: 'Hospital Central',
  group: 'Grupo A',
  spec: 'UTI',
  val: 3200,
  date: 'Sex 10/05',
  hours: '12h',
  loc: 'Centro',
  dist: 5,
  rawMsg: 'Oferta exemplo',
  sc: 92,
};

vi.mock('./config/featureFlags.js', () => ({
  getFeatureFlags: () => ({ ui_v2: true }),
}));

vi.mock('./services/growthApi.js', () => ({
  trackGrowthEvent: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('./services/whatsappApi.js', () => ({
  fetchWhatsappStatus: (...args) => fetchWhatsappStatusMock(...args),
}));

vi.mock('./services/monitoringApi.js', () => ({
  fetchPreferences: (...args) => fetchPreferencesMock(...args),
  savePreferences: (...args) => savePreferencesMock(...args),
  fetchGroups: (...args) => fetchGroupsMock(...args),
  saveGroups: (...args) => saveGroupsMock(...args),
  captureOffer: (...args) => captureOfferMock(...args),
}));

vi.mock('./hooks/useMonitoring.js', () => ({
  useMonitoring: (args) => {
    args.monitorSessionIdRef.current = 'session-123';
    return useMonitoringReturn;
  },
}));

vi.mock('./hooks/useShifts.js', () => ({
  useShifts: () => useShiftsReturn,
}));

vi.mock('./components/ui/index.jsx', () => ({
  BgOrbs: () => <div data-testid="bg-orbs" />,
  Confetti: () => <div data-testid="confetti" />,
  Toasts: () => <div data-testid="toasts" />,
  ToastViewport: () => <div data-testid="toast-viewport" />,
  Badge: ({ children }) => <span>{children}</span>,
  Button: ({ children, onClick, type = 'button' }) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
  Card: ({ children }) => <div>{children}</div>,
  EmptyState: ({ title, description, action }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
    </div>
  ),
  PageHeader: ({ title }) => <h1>{title}</h1>,
}));

vi.mock('./components/layout/AppShell.jsx', () => ({
  default: ({ children, onStartBot, onStopBot }) => (
    <div>
      <button type="button" onClick={onStartBot}>
        start-bot
      </button>
      <button type="button" onClick={onStopBot}>
        stop-bot
      </button>
      {children}
    </div>
  ),
}));

vi.mock('./components/ShiftModal.jsx', () => ({
  default: ({ onAccept, onClose, shift }) => (
    <div>
      <button type="button" onClick={() => onAccept(shift)}>
        modal-accept
      </button>
      <button type="button" onClick={onClose}>
        modal-close
      </button>
    </div>
  ),
}));

vi.mock('./components/NotifDrawer.jsx', () => ({
  default: () => <div data-testid="notif-drawer" />,
}));

vi.mock('./components/Onboarding.jsx', () => ({
  default: () => <div>onboarding</div>,
}));

vi.mock('./components/tabs/Dashboard.jsx', () => ({
  default: ({ setModal }) => (
    <button type="button" onClick={() => setModal(mockShift)}>
      open-modal
    </button>
  ),
}));

vi.mock('./components/tabs/FeedTab.jsx', () => ({ default: () => <div>feed-tab</div> }));
vi.mock('./components/tabs/SwipeTab.jsx', () => ({ default: () => <div>swipe-tab</div> }));
vi.mock('./components/tabs/CapturedTab.jsx', () => ({ default: () => <div>captured-tab</div> }));
vi.mock('./components/tabs/InsightsTab.jsx', () => ({ default: () => <div>insights-tab</div> }));
vi.mock('./components/tabs/SettingsTab.jsx', () => ({
  default: ({ setPrefs, setGroups }) => (
    <div>
      <button type="button" onClick={() => setPrefs((previous) => ({ ...previous, minVal: 2100 }))}>
        update-prefs
      </button>
      <button
        type="button"
        onClick={() =>
          setGroups((previous) => previous.map((item) => ({ ...item, active: !item.active })))
        }
      >
        update-groups
      </button>
    </div>
  ),
}));
vi.mock('./components/AIChat.jsx', () => ({ default: () => <div>ai-chat</div> }));

import AppMain from './AppMain.jsx';

describe('AppMain critical flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('pb_screen', JSON.stringify('app'));

    fetchPreferencesMock.mockResolvedValue({
      minVal: 1800,
      maxDist: 15,
      days: ['Sex'],
      specs: ['UTI'],
      auto: true,
    });
    fetchGroupsMock.mockResolvedValue([
      { id: 1, name: 'Grupo A', members: 10, active: true, emoji: '🏥' },
    ]);
    fetchWhatsappStatusMock.mockResolvedValue({ connected: true });
    loadInitialShiftsHookMock.mockResolvedValue(undefined);
    loadInitialStatusHookMock.mockResolvedValue({ isBotActive: true });
    startMonitoringHookMock.mockResolvedValue(undefined);
    stopMonitoringHookMock.mockResolvedValue(undefined);
    savePreferencesMock.mockResolvedValue(undefined);
    saveGroupsMock.mockResolvedValue(undefined);
    useShiftsReturn.pending = [mockShift];
    captureOfferMock.mockResolvedValue({ capturedAtISO: '2026-01-01T10:00:00.000Z' });
  });

  it('loads boot data and starts polling when monitor is active', async () => {
    render(<AppMain />);

    await waitFor(() => {
      expect(fetchPreferencesMock).toHaveBeenCalledTimes(1);
      expect(fetchGroupsMock).toHaveBeenCalledTimes(1);
      expect(loadInitialShiftsHookMock).toHaveBeenCalledTimes(1);
      expect(loadInitialStatusHookMock).toHaveBeenCalledTimes(1);
      expect(startPollingHookMock).toHaveBeenCalledTimes(1);
    });
  });

  it('blocks start bot and redirects to settings when whatsapp is disconnected', async () => {
    fetchWhatsappStatusMock.mockResolvedValueOnce({ connected: false });

    render(<AppMain />);

    fireEvent.click(screen.getByRole('button', { name: 'start-bot' }));

    await waitFor(() => {
      expect(startMonitoringHookMock).not.toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: 'update-prefs' })).toBeInTheDocument();
  });

  it('accepts capture from modal and persists offer with current session id', async () => {
    render(<AppMain />);

    fireEvent.click(screen.getByRole('button', { name: 'open-modal' }));
    fireEvent.click(screen.getByRole('button', { name: 'modal-accept' }));

    await waitFor(() => {
      expect(captureOfferMock).toHaveBeenCalledWith(mockShift, {
        sessionId: 'session-123',
        source: 'manual',
      });
      expect(registerCaptureHookMock).toHaveBeenCalledTimes(1);
    });
  });

  it('persists prefs and groups with debounce after settings changes', async () => {
    fetchWhatsappStatusMock.mockResolvedValueOnce({ connected: false });
    render(<AppMain />);

    fireEvent.click(screen.getByRole('button', { name: 'start-bot' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'update-prefs' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'update-prefs' }));
    fireEvent.click(screen.getByRole('button', { name: 'update-groups' }));

    await waitFor(
      () => {
        expect(savePreferencesMock).toHaveBeenCalledTimes(1);
        expect(saveGroupsMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );
  });
});
