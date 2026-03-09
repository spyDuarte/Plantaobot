import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Dashboard from './Dashboard.jsx';

const DEFAULT_PREFS = {
  minVal: 1500,
  maxDist: 30,
  days: ['Sex', 'Sáb', 'Dom'],
  specs: ['UTI'],
  auto: false,
};

function renderDashboard(overrides = {}) {
  const props = {
    uiV2: true,
    setTab: vi.fn(),
    botOn: false,
    startBot: vi.fn(),
    stopBot: vi.fn(),
    captured: [],
    rejected: [],
    pending: [],
    actG: [],
    total: 0,
    prefs: DEFAULT_PREFS,
    typing: null,
    setModal: vi.fn(),
    planId: null,
    planLimits: null,
    ...overrides,
  };

  return { ...render(<Dashboard {...props} />), props };
}

describe('Dashboard', () => {
  it('exibe botão "Iniciar bot" quando bot está inativo', () => {
    renderDashboard({ botOn: false });
    expect(screen.getByRole('button', { name: 'Iniciar bot' })).toBeInTheDocument();
  });

  it('exibe botão "Parar bot" quando bot está ativo', () => {
    renderDashboard({ botOn: true });
    expect(screen.getByRole('button', { name: 'Parar bot' })).toBeInTheDocument();
  });

  it('chama startBot ao clicar em "Iniciar bot"', () => {
    const startBot = vi.fn();
    renderDashboard({ botOn: false, startBot });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar bot' }));
    expect(startBot).toHaveBeenCalledTimes(1);
  });

  it('chama stopBot ao clicar em "Parar bot"', () => {
    const stopBot = vi.fn();
    renderDashboard({ botOn: true, stopBot });
    fireEvent.click(screen.getByRole('button', { name: 'Parar bot' }));
    expect(stopBot).toHaveBeenCalledTimes(1);
  });

  it('exibe contagem correta de capturas e descartes', () => {
    const captured = [
      { id: '1', hospital: 'H1', val: 2000, date: 'Sex', hours: '12h', dist: 5, spec: 'UTI', sc: 90 },
      { id: '2', hospital: 'H2', val: 1800, date: 'Sáb', hours: '12h', dist: 8, spec: 'UTI', sc: 80 },
    ];
    const rejected = [
      { id: '3', hospital: 'H3', val: 500, date: 'Seg', hours: '12h', dist: 50, spec: 'Pediatria', sc: 20 },
    ];

    renderDashboard({ captured, rejected, total: 3800 });

    expect(screen.getByText('2')).toBeInTheDocument(); // Capturados
    expect(screen.getByText('1')).toBeInTheDocument(); // Descartados
  });

  it('exibe total garantido no mês', () => {
    renderDashboard({ total: 5500 });
    expect(screen.getByText(/5\.500/)).toBeInTheDocument();
  });

  it('exibe badge "Monitorando ativamente" quando bot está ativo', () => {
    renderDashboard({ botOn: true });
    expect(screen.getByText('Monitorando ativamente')).toBeInTheDocument();
  });

  it('exibe badge "Pausado" quando bot está inativo', () => {
    renderDashboard({ botOn: false });
    expect(screen.getByText('Pausado')).toBeInTheDocument();
  });

  it('exibe plano do usuário quando planId está definido', () => {
    renderDashboard({ planId: 'pro', planLimits: { maxCapturesPerMonth: 50 } });
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/50 capturas este mês/)).toBeInTheDocument();
  });

  it('exibe "Capturas ilimitadas" para planos sem limite', () => {
    renderDashboard({ planId: 'premium', planLimits: { maxCapturesPerMonth: null } });
    expect(screen.getByText('Capturas ilimitadas')).toBeInTheDocument();
  });

  it('exibe botão de upgrade para plano free', () => {
    const setTab = vi.fn();
    renderDashboard({ planId: 'free', setTab });
    fireEvent.click(screen.getByText('Fazer upgrade →'));
    expect(setTab).toHaveBeenCalledWith('plans');
  });

  it('não exibe seção de plano quando planId é null', () => {
    renderDashboard({ planId: null });
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Grátis')).not.toBeInTheDocument();
  });
});
