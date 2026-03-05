import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingsTab from './SettingsTab.jsx';

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
  it('updates acceptance mode and available days preferences', () => {
    const setPrefs = vi.fn();

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
    );

    fireEvent.click(screen.getByRole('button', { name: /Automático/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ter' }));

    const prefUpdates = setPrefs.mock.calls.map((call) => call[0]({ ...basePrefs }));
    expect(prefUpdates).toContainEqual({ ...basePrefs, auto: true });
    expect(prefUpdates).toContainEqual({ ...basePrefs, days: ['Seg', 'Ter'] });
  });

  it('toggles monitored groups', () => {
    const setGroups = vi.fn();

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
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Desativar Grupo A' }));

    expect(setGroups).toHaveBeenCalledTimes(1);
    expect(setGroups.mock.calls[0][0](baseGroups)).toEqual([
      { ...baseGroups[0], active: false },
      baseGroups[1],
    ]);
  });
});
