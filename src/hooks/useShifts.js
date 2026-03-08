import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import {
  captureOffer,
  rejectOffer,
  clearHistory,
  fetchCapturedOffers,
  fetchRejectedOffers,
} from '../services/monitoringApi.js';
import { calcScore, fmt, nowT } from '../utils/index.js';

function appendUniqueById(list, item) {
  if (!item) {
    return list;
  }

  if (list.some((entry) => entry.id === item.id)) {
    return list;
  }

  return [...list, item];
}

export function useShifts({ prefs, monitorSessionIdRef, toast, addNotif, setConfetti, setTyping }) {
  const [feed, setFeed] = useState([]);
  const [captured, setCaptured] = useLocalStorage('pb_captured', []);
  const [rejected, setRejected] = useState([]);
  const [pending, setPending] = useState([]);
  const processedOffersRef = useRef(new Set());

  const mergeFeed = useCallback((items) => {
    setFeed((previous) => {
      const next = [...previous];
      const indexById = new Map(next.map((item, index) => [item.id, index]));

      items.forEach((item) => {
        const existingIndex = indexById.get(item.id);
        if (existingIndex == null) {
          next.push(item);
          indexById.set(item.id, next.length - 1);
          return;
        }

        next[existingIndex] = {
          ...next[existingIndex],
          ...item,
        };
      });

      return next.slice(-250);
    });
  }, []);

  const registerCapture = useCallback(
    (shift, { fromAuto = false } = {}) => {
      const nowIso = new Date().toISOString();
      const normalizedShift = {
        ...shift,
        capturedAt: shift.capturedAt || nowT(),
        capturedAtISO: shift.capturedAtISO || nowIso,
      };

      setCaptured((previous) => appendUniqueById(previous, normalizedShift));
      setPending((previous) => previous.filter((item) => item.id !== shift.id));

      if (fromAuto) {
        addNotif(
          'Plantão capturado',
          `${shift.hospital} - ${shift.date} - R$ ${fmt(shift.val)}`,
          'success',
          'bot',
        );
        toast('Plantão garantido', `${shift.hospital} - R$ ${fmt(shift.val)}`, 'success', 'bot');
      } else {
        toast('Plantão aceito', `${shift.hospital} - R$ ${fmt(shift.val)}`, 'success', 'manual');
      }

      if (Number(shift.val) >= 3000 && setConfetti) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2500);
      }
    },
    [addNotif, toast, setCaptured, setConfetti],
  );

  const processOffer = useCallback(
    async (offer) => {
      if (!offer?.id || processedOffersRef.current.has(offer.id)) {
        return;
      }

      processedOffersRef.current.add(offer.id);

      const result = calcScore(offer, prefs);
      const scoredOffer = {
        ...offer,
        state: 'done',
        sc: result.s,
        ok: result.s >= 60,
      };

      mergeFeed([scoredOffer]);

      if (prefs.auto) {
        if (scoredOffer.ok) {
          try {
            const persisted = await captureOffer(scoredOffer, {
              sessionId: monitorSessionIdRef.current,
              source: 'auto',
            });
            registerCapture({ ...scoredOffer, ...persisted }, { fromAuto: true });
          } catch (error) {
            setPending((previous) => appendUniqueById(previous, scoredOffer));
            toast(
              'Falha na captura',
              error.message || 'Não foi possível capturar o plantão automaticamente.',
              'warning',
              'bot',
            );
          }
        } else {
          setRejected((previous) => appendUniqueById(previous, scoredOffer));
          try {
            await rejectOffer(scoredOffer, {
              sessionId: monitorSessionIdRef.current,
              reason: 'score_below_threshold',
            });
          } catch {
            // Rejeição já refletida localmente.
          }
        }
        return;
      }

      if (scoredOffer.ok) {
        setPending((previous) => appendUniqueById(previous, scoredOffer));
      } else {
        setRejected((previous) => appendUniqueById(previous, scoredOffer));
        try {
          await rejectOffer(scoredOffer, {
            sessionId: monitorSessionIdRef.current,
            reason: 'score_below_threshold',
          });
        } catch {
          // Rejeição já refletida localmente.
        }
      }
    },
    [mergeFeed, prefs, registerCapture, toast, monitorSessionIdRef],
  );

  const handleFeedItems = useCallback(
    async (items) => {
      const feedItems = items.map((item) => {
        if (!item.isOffer) {
          return {
            ...item,
            state: item.state || 'done',
          };
        }

        return {
          ...item,
          state: item.state || 'scanning',
        };
      });

      mergeFeed(feedItems);

      const lastItem = feedItems[feedItems.length - 1];
      if (setTyping && lastItem) {
        setTyping(lastItem.group);
        setTimeout(() => setTyping(null), 900);
      }

      for (const item of feedItems) {
        if (item.isOffer) {
          await processOffer(item);
        }
      }
    },
    [mergeFeed, processOffer, setTyping],
  );

  const acceptPending = useCallback(
    async (shift) => {
      try {
        const persisted = await captureOffer(shift, {
          sessionId: monitorSessionIdRef.current,
          source: 'manual',
        });
        registerCapture({ ...shift, ...persisted }, { fromAuto: false });
      } catch (error) {
        toast(
          'Falha ao aceitar',
          error?.message || 'Não foi possível capturar este plantão.',
          'error',
          'manual',
        );
      }
    },
    [monitorSessionIdRef, registerCapture, toast],
  );

  const rejectPending = useCallback(
    async (shift) => {
      try {
        const persisted = await rejectOffer(shift, {
          sessionId: monitorSessionIdRef.current,
          reason: 'manual_reject',
        });

        const rejectedShift = persisted || shift;
        setPending((previous) => previous.filter((item) => item.id !== shift.id));
        setRejected((previous) => appendUniqueById(previous, rejectedShift));
      } catch (error) {
        toast(
          'Falha ao rejeitar',
          error?.message || 'Não foi possível rejeitar este plantão.',
          'error',
          'manual',
        );
      }
    },
    [monitorSessionIdRef, toast],
  );

  const loadInitialShifts = useCallback(async () => {
    try {
      const [remoteCaptured, remoteRejected] = await Promise.all([
        fetchCapturedOffers(),
        fetchRejectedOffers(),
      ]);

      if (Array.isArray(remoteCaptured)) {
        setCaptured(remoteCaptured);
      }

      if (Array.isArray(remoteRejected)) {
        setRejected(remoteRejected);
      }
    } catch {
      // failed to load history, that's ok
    }
  }, [setCaptured]);

  const clearAllHistory = useCallback(async () => {
    if (
      !window.confirm(
        'Limpar todo o histórico de plantões capturados? Esta ação não pode ser desfeita.',
      )
    ) {
      return;
    }

    try {
      await clearHistory();
      setCaptured([]);
      setRejected([]);
      setPending([]);
      setFeed([]);
      processedOffersRef.current = new Set();
      toast('Histórico limpo', 'Dados operacionais removidos com sucesso.', 'info', 'manual');
    } catch (error) {
      toast(
        'Falha ao limpar',
        error?.message || 'Não foi possível limpar o histórico no backend.',
        'error',
        'manual',
      );
    }
  }, [setCaptured, toast]);

  const resetProcessQueue = useCallback(() => {
    setPending([]);
    processedOffersRef.current = new Set();
  }, []);

  return {
    feed,
    setFeed,
    captured,
    setCaptured,
    rejected,
    setRejected,
    pending,
    setPending,
    handleFeedItems,
    acceptPending,
    rejectPending,
    loadInitialShifts,
    clearAllHistory,
    resetProcessQueue,
    registerCapture,
  };
}
