import { useState, useRef, useCallback, useEffect } from "react";
import { fetchMonitorStatus, startMonitoring, stopMonitoring, fetchFeed } from "../services/monitoringApi.js";

const POLL_MS = Number(import.meta.env.VITE_MONITOR_POLL_MS || 10000);

export function useMonitoring({ groups, prefs, name, monitorSessionIdRef, onFeedItems, toast }) {
  const [botOn, setBotOn] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  const pollTimerRef = useRef(null);
  const pollCursorRef = useRef(null);
  const pollInFlightRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollFeed = useCallback(async () => {
    if (!botOn || pollInFlightRef.current) {
      return;
    }

    pollInFlightRef.current = true;
    try {
      const activeGroups = groups.filter((group) => group.active).map((group) => group.id);
      const response = await fetchFeed({
        cursor: pollCursorRef.current,
        sessionId: monitorSessionIdRef.current,
        groupIds: activeGroups,
      });

      if (response.cursor) {
        pollCursorRef.current = response.cursor;
      }

      if (response.items && response.items.length > 0 && onFeedItems) {
        onFeedItems(response.items);
      }
    } catch (error) {
      const message = error?.message || "Falha ao consultar o feed em tempo real.";
      setFeedError(message);
      toast("Erro no monitoramento", message, "error", "system");
    } finally {
      pollInFlightRef.current = false;
    }
  }, [botOn, groups, onFeedItems, toast, monitorSessionIdRef]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollFeed();
    pollTimerRef.current = setInterval(() => {
      pollFeed();
    }, POLL_MS);
  }, [pollFeed, stopPolling]);

  const startBot = useCallback(async () => {
    setFeedError(null);
    pollCursorRef.current = null;

    try {
      const response = await startMonitoring({
        groups,
        prefs,
        operatorName: name,
      });

      monitorSessionIdRef.current = response.sessionId;
      setBotOn(true);
      startPolling();
      toast("Monitoramento iniciado", "Conexão ativa com o backend de ofertas.", "success", "system");
    } catch (error) {
      const message = error?.message || "Não foi possível iniciar o monitoramento real.";
      setFeedError(message);
      toast("Falha ao iniciar", message, "error", "system");
    }
  }, [groups, monitorSessionIdRef, name, prefs, startPolling, toast]);

  const stopBot = useCallback(async () => {
    stopPolling();
    setBotOn(false);

    try {
      await stopMonitoring(monitorSessionIdRef.current);
      toast("Monitoramento pausado", "Conexão com backend encerrada.", "info", "system");
    } catch (error) {
      toast("Falha ao pausar", error?.message || "Não foi possível encerrar o monitoramento remotamente.", "warning", "system");
    }
  }, [monitorSessionIdRef, stopPolling, toast]);

  const loadInitialStatus = useCallback(async () => {
    try {
      const monitorStatus = await fetchMonitorStatus();
      monitorSessionIdRef.current = monitorStatus.sessionId;
      const isBotActive = Boolean(monitorStatus.active);
      setBotOn(isBotActive);

      return { isBotActive };
    } catch (error) {
      const message = error?.message || "Não foi possível inicializar os dados reais do monitoramento.";
      setFeedError(message);
      toast("API indisponível", message, "warning", "system");
      return { isBotActive: false };
    } finally {
      setApiLoading(false);
    }
  }, [toast, monitorSessionIdRef]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    botOn,
    setBotOn,
    feedError,
    setFeedError,
    apiLoading,
    startBot,
    stopBot,
    loadInitialStatus,
    startPolling,
    stopPolling,
  };
}
