import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SwipeTab from './SwipeTab.jsx';

const basePending = [
  {
    id: 'shift-1',
    hospital: 'Hospital Central',
    date: '2026-03-05',
    val: 1800,
    dist: 12,
    score: 91,
  },
];

describe('SwipeTab', () => {
  it('accepts and rejects the current pending shift', () => {
    const acceptPending = vi.fn();
    const rejectPending = vi.fn();

    render(
      <SwipeTab
        uiV2
        botOn
        pending={basePending}
        captured={[]}
        prefs={{ minVal: 1000, maxDist: 30, days: [], specs: [], auto: false }}
        acceptPending={acceptPending}
        rejectPending={rejectPending}
        setModal={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Aceitar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Recusar/ }));

    expect(acceptPending).toHaveBeenCalledWith(basePending[0]);
    expect(rejectPending).toHaveBeenCalledWith(basePending[0]);
  });

  it('shows empty state when no pending shifts are available', () => {
    render(
      <SwipeTab
        uiV2
        botOn={false}
        pending={[]}
        captured={[]}
        prefs={{ minVal: 1000, maxDist: 30, days: [], specs: [], auto: false }}
        acceptPending={vi.fn()}
        rejectPending={vi.fn()}
        setModal={vi.fn()}
      />,
    );

    expect(screen.getByText('Sua fila está vazia')).toBeInTheDocument();
    expect(screen.getByText('Inicie o monitoramento no dashboard para receber plantões.')).toBeInTheDocument();
  });
});
