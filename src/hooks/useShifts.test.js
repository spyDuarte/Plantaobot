import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/monitoringApi.js');

// Stub useLocalStorage to use plain useState
vi.mock('./useLocalStorage.js', async () => {
  const { useState } = await import('react');
  return {
    useLocalStorage: (_key, initial) => useState(initial),
  };
});

import {
  captureOffer,
  clearHistory,
  fetchCapturedOffers,
  fetchRejectedOffers,
  rejectOffer,
} from '../services/monitoringApi.js';
import { useShifts } from './useShifts.js';

const captureOfferMock = vi.mocked(captureOffer);
const rejectOfferMock = vi.mocked(rejectOffer);
const clearHistoryMock = vi.mocked(clearHistory);
const fetchCapturedOffersMock = vi.mocked(fetchCapturedOffers);
const fetchRejectedOffersMock = vi.mocked(fetchRejectedOffers);

const DEFAULT_PREFS = {
  minVal: 1500,
  maxDist: 30,
  days: ['Sex', 'Sáb', 'Dom'],
  specs: ['UTI', 'Clínica Geral'],
  auto: false,
};

const makeOffer = (overrides = {}) => ({
  id: 'offer-1',
  hospital: 'Hospital Teste',
  group: 'Grupo A',
  spec: 'UTI',
  val: 2000,
  date: 'Sex 07/03',
  dayLabel: 'Sex',
  hours: '12h',
  loc: 'Centro',
  dist: 10,
  rawMsg: 'Oferta de plantão',
  isOffer: true,
  ...overrides,
});

function buildHook(prefsOverrides = {}) {
  const toast = vi.fn();
  const addNotif = vi.fn();
  const setConfetti = vi.fn();
  const setTyping = vi.fn();
  const monitorSessionIdRef = { current: 'session-1' };

  const prefs = { ...DEFAULT_PREFS, ...prefsOverrides };

  const result = renderHook(() =>
    useShifts({ prefs, monitorSessionIdRef, toast, addNotif, setConfetti, setTyping }),
  );

  return { ...result, toast, addNotif, setConfetti, setTyping };
}

beforeEach(() => {
  vi.clearAllMocks();
  captureOfferMock.mockResolvedValue({});
  rejectOfferMock.mockResolvedValue({});
  clearHistoryMock.mockResolvedValue(undefined);
  fetchCapturedOffersMock.mockResolvedValue([]);
  fetchRejectedOffersMock.mockResolvedValue([]);
});

describe('useShifts — mergeFeed', () => {
  it('adiciona itens ao feed', async () => {
    const { result } = buildHook();
    const offer = makeOffer();

    act(() => {
      result.current.setFeed([offer]);
    });

    expect(result.current.feed).toHaveLength(1);
    expect(result.current.feed[0].id).toBe('offer-1');
  });

  it('não duplica itens com mesmo id', async () => {
    const { result } = buildHook();
    const offer = makeOffer();

    act(() => {
      result.current.setFeed([offer]);
    });
    act(() => {
      result.current.setFeed((prev) => {
        const next = [...prev];
        const indexById = new Map(next.map((item, index) => [item.id, index]));
        [offer].forEach((item) => {
          const existingIndex = indexById.get(item.id);
          if (existingIndex == null) {
            next.push(item);
          } else {
            next[existingIndex] = { ...next[existingIndex], ...item };
          }
        });
        return next;
      });
    });

    expect(result.current.feed).toHaveLength(1);
  });
});

describe('useShifts — processOffer (modo manual)', () => {
  it('move para pending quando score >= 60', async () => {
    const { result } = buildHook({ auto: false });
    const offer = makeOffer(); // val=2000 >= 1500, dist=10 <= 30, day=Sex, spec=UTI => score=100

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0].id).toBe('offer-1');
    expect(result.current.rejected).toHaveLength(0);
  });

  it('move para rejected quando score < 60', async () => {
    const { result } = buildHook({ auto: false });
    const offer = makeOffer({
      id: 'offer-low',
      val: 500, // abaixo do mínimo de 1500
      dist: 100, // acima do máximo de 30
      dayLabel: 'Seg', // não está nos dias disponíveis
      spec: 'Pediatria', // não está nas specs disponíveis
    });

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(result.current.rejected).toHaveLength(1);
    expect(result.current.pending).toHaveLength(0);
    expect(rejectOfferMock).toHaveBeenCalledTimes(1);
  });
});

describe('useShifts — processOffer (modo auto)', () => {
  it('captura automaticamente quando score >= 60', async () => {
    captureOfferMock.mockResolvedValue({ id: 'offer-1', capturedAt: new Date().toISOString() });
    const { result, addNotif, toast } = buildHook({ auto: true });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(captureOfferMock).toHaveBeenCalledTimes(1);
    expect(result.current.captured).toHaveLength(1);
    expect(result.current.pending).toHaveLength(0);
    expect(toast).toHaveBeenCalledWith(
      'Plantão garantido',
      expect.stringContaining('Hospital Teste'),
      'success',
      'bot',
    );
    expect(addNotif).toHaveBeenCalledWith(
      'Plantão capturado',
      expect.any(String),
      'success',
      'bot',
    );
  });

  it('rejeita automaticamente quando score < 60', async () => {
    const { result } = buildHook({ auto: true });
    const offer = makeOffer({
      id: 'offer-low',
      val: 500,
      dist: 100,
      dayLabel: 'Seg',
      spec: 'Pediatria',
    });

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(result.current.rejected).toHaveLength(1);
    expect(result.current.captured).toHaveLength(0);
    expect(rejectOfferMock).toHaveBeenCalledTimes(1);
  });

  it('não processa a mesma oferta duas vezes', async () => {
    captureOfferMock.mockResolvedValue({ id: 'offer-1' });
    const { result } = buildHook({ auto: true });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
      await result.current.handleFeedItems([offer]);
    });

    expect(captureOfferMock).toHaveBeenCalledTimes(1);
  });
});

describe('useShifts — acceptPending', () => {
  it('captura plantão pendente e o remove de pending', async () => {
    captureOfferMock.mockResolvedValue({ id: 'offer-1' });
    const { result } = buildHook({ auto: false });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });
    expect(result.current.pending).toHaveLength(1);

    await act(async () => {
      await result.current.acceptPending(result.current.pending[0]);
    });

    expect(captureOfferMock).toHaveBeenCalledTimes(1);
    expect(result.current.captured).toHaveLength(1);
    expect(result.current.pending).toHaveLength(0);
  });

  it('mostra toast de erro se captureOffer falhar', async () => {
    captureOfferMock.mockRejectedValue(new Error('Falha de rede'));
    const { result, toast } = buildHook({ auto: false });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    await act(async () => {
      await result.current.acceptPending(result.current.pending[0]);
    });

    expect(toast).toHaveBeenCalledWith('Falha ao aceitar', 'Falha de rede', 'error', 'manual');
    expect(result.current.captured).toHaveLength(0);
  });
});

describe('useShifts — rejectPending', () => {
  it('move plantão de pending para rejected', async () => {
    rejectOfferMock.mockResolvedValue({ id: 'offer-1' });
    const { result } = buildHook({ auto: false });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });
    expect(result.current.pending).toHaveLength(1);

    await act(async () => {
      await result.current.rejectPending(result.current.pending[0]);
    });

    expect(result.current.pending).toHaveLength(0);
    expect(result.current.rejected).toHaveLength(1);
  });

  it('mostra toast de erro se rejectOffer falhar', async () => {
    rejectOfferMock.mockRejectedValue(new Error('Falha'));
    const { result, toast } = buildHook({ auto: false });
    const offer = makeOffer();

    // Manually add to pending to bypass processOffer
    act(() => {
      result.current.setPending([offer]);
    });

    await act(async () => {
      await result.current.rejectPending(offer);
    });

    expect(toast).toHaveBeenCalledWith('Falha ao rejeitar', 'Falha', 'error', 'manual');
  });
});

describe('useShifts — registerCapture', () => {
  it('dispara confetti para plantões de alto valor (>= R$3000)', async () => {
    captureOfferMock.mockResolvedValue({ id: 'offer-big' });
    const { result, setConfetti } = buildHook({ auto: true });
    const offer = makeOffer({ id: 'offer-big', val: 3500 });

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(setConfetti).toHaveBeenCalledWith(true);
  });

  it('não dispara confetti para plantões de valor baixo (< R$3000)', async () => {
    captureOfferMock.mockResolvedValue({ id: 'offer-small' });
    const { result, setConfetti } = buildHook({ auto: true });
    const offer = makeOffer({ id: 'offer-small', val: 2000 });

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });

    expect(setConfetti).not.toHaveBeenCalledWith(true);
  });
});

describe('useShifts — loadInitialShifts', () => {
  it('carrega plantões do backend na inicialização', async () => {
    const remoteCaptured = [makeOffer({ id: 'remote-1', capturedAt: new Date().toISOString() })];
    fetchCapturedOffersMock.mockResolvedValue(remoteCaptured);
    fetchRejectedOffersMock.mockResolvedValue([]);

    const { result } = buildHook();

    await act(async () => {
      await result.current.loadInitialShifts();
    });

    expect(result.current.captured).toHaveLength(1);
    expect(result.current.captured[0].id).toBe('remote-1');
  });

  it('não falha se backend retornar erro', async () => {
    fetchCapturedOffersMock.mockRejectedValue(new Error('Network error'));
    const { result } = buildHook();

    await expect(
      act(async () => {
        await result.current.loadInitialShifts();
      }),
    ).resolves.not.toThrow();
  });
});

describe('useShifts — resetProcessQueue', () => {
  it('limpa a fila de pendentes', async () => {
    const { result } = buildHook({ auto: false });
    const offer = makeOffer();

    await act(async () => {
      await result.current.handleFeedItems([offer]);
    });
    expect(result.current.pending).toHaveLength(1);

    act(() => {
      result.current.resetProcessQueue();
    });

    expect(result.current.pending).toHaveLength(0);
  });
});
