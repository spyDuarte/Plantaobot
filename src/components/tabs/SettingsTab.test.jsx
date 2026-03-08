import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SettingsTab from './SettingsTab.jsx';

vi.mock('../../services/whatsappApi.js', () => ({
  fetchWhatsappConfig: vi.fn().mockResolvedValue(null),
  fetchWhatsappStatus: vi
    .fn()
    .mockResolvedValue({
      connected: false,
      connectedAt: null,
      instanceId: null,
      phoneNumber: null,
    }),
  resetWhatsappToken: vi.fn(),
  buildWebhookUrl: vi.fn().mockReturnValue(''),
  connectWhatsapp: vi.fn(),
  fetchWhatsappGroups: vi.fn(),
}));

const baseGroups = [
  { id: 'g1', name: 'Grupo A', members: 120, active: true, emoji: '🏥' },
  { id: 'g2', name: 'Grupo B', members: 80, active: false, emoji: '🩺' },
];

const basePrefs = {
  minVal: 1000,
  maxDist: 25,
  days: ['Seg'],
  specs: ['Clínica'],
  auto: false,
};

describe('SettingsTab', () => {
  it('updates acceptance mode and available days preferences', async () => {
    const setPrefs = vi.fn();

    await act(async () =>
      render(
        <SettingsTab
          uiV2
          groups={baseGroups}
          setGroups={vi.fn()}
          prefs={basePrefs}
          setPrefs={setPrefs}
          name="Dr. Teste"
          actG={baseGroups.filter((group) => group.active)}
          setScreen={vi.fn()}
          setObStep={vi.fn()}
          onClearHistory={vi.fn()}
          onLogout={vi.fn()}
        />,
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /Automático/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ter' }));

    const prefUpdates = setPrefs.mock.calls.map((call) => call[0]({ ...basePrefs }));
    expect(prefUpdates).toContainEqual({ ...basePrefs, auto: true });
    expect(prefUpdates).toContainEqual({ ...basePrefs, days: ['Seg', 'Ter'] });
  });

  it('toggles monitored groups', async () => {
    const setGroups = vi.fn();

    await act(async () =>
      render(
        <SettingsTab
          uiV2
          groups={baseGroups}
          setGroups={setGroups}
          prefs={basePrefs}
          setPrefs={vi.fn()}
          name="Dr. Teste"
          actG={baseGroups.filter((group) => group.active)}
          setScreen={vi.fn()}
          setObStep={vi.fn()}
          onClearHistory={vi.fn()}
          onLogout={vi.fn()}
        />,
      ),
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Desativar Grupo A' }));

    expect(setGroups).toHaveBeenCalledTimes(1);
    expect(setGroups.mock.calls[0][0](baseGroups)).toEqual([
      { ...baseGroups[0], active: false },
      baseGroups[1],
    ]);
  });
});
