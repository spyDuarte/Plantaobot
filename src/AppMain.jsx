import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "./constants/colors.js";
import { MONTHLY, GROUPS } from "./data/mockData.js";
import { fmt } from "./utils/index.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { CSS } from "./styles/index.js";
import {
  BgOrbs,
  Confetti,
  Toasts,
  ToastViewport,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "./components/ui/index.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import ShiftModal from "./components/ShiftModal.jsx";
import NotifDrawer from "./components/NotifDrawer.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Dashboard from "./components/tabs/Dashboard.jsx";
import FeedTab from "./components/tabs/FeedTab.jsx";
import SwipeTab from "./components/tabs/SwipeTab.jsx";
import CapturedTab from "./components/tabs/CapturedTab.jsx";
import InsightsTab from "./components/tabs/InsightsTab.jsx";
import SettingsTab from "./components/tabs/SettingsTab.jsx";
import AIChat from "./components/AIChat.jsx";
import { getFeatureFlags } from "./config/featureFlags.js";
import { createNotification, createNavItem, createToast } from "./models/uiModels.js";
import { normalizeShiftCollection } from "./utils/shiftViewModel.js";
import {
  DEFAULT_GROWTH_METRICS,
  areGrowthMetricsEqual,
  hasInviteQueryParams,
  hasValidReferralCode,
  isNormalizedGrowthMetrics,
  normalizeGrowthMetrics,
  normalizeReferralCode,
} from "./utils/growthTracking.js";
import {
  fetchPreferences,
  savePreferences,
  fetchGroups,
  saveGroups,
  captureOffer,
} from "./services/monitoringApi.js";
import { trackGrowthEvent } from "./services/growthApi.js";
import { fetchWhatsappStatus } from "./services/whatsappApi.js";
import { useMonitoring } from "./hooks/useMonitoring.js";
import { useShifts } from "./hooks/useShifts.js";

const DEFAULT_PREFS = {
  minVal: 1500,
  maxDist: 20,
  days: ["Sex", "Sáb", "Dom"],
  specs: ["Emergência", "UTI", "Clínica Geral"],
  auto: true,
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function normalizePrefs(input) {
  if (!input || typeof input !== "object") {
    return DEFAULT_PREFS;
  }

  return {
    minVal: Number(input.minVal ?? DEFAULT_PREFS.minVal),
    maxDist: Number(input.maxDist ?? DEFAULT_PREFS.maxDist),
    days: Array.isArray(input.days) && input.days.length > 0 ? input.days : DEFAULT_PREFS.days,
    specs: Array.isArray(input.specs) && input.specs.length > 0 ? input.specs : DEFAULT_PREFS.specs,
    auto: typeof input.auto === "boolean" ? input.auto : DEFAULT_PREFS.auto,
  };
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function parseCaptureDate(shift) {
  const candidates = [
    shift?.capturedAtISO,
    shift?.capturedAt,
    shift?.createdAt,
    shift?.ts,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function buildMonthlySeries(capturedList) {
  const now = new Date();
  const buckets = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: toMonthKey(date),
      m: MONTH_LABELS[date.getMonth()],
      v: 0,
    });
  }

  const indexByKey = new Map(buckets.map((item, index) => [item.key, index]));

  capturedList.forEach((shift) => {
    const date = parseCaptureDate(shift);
    const key = toMonthKey(date);
    const targetIndex = indexByKey.get(key);
    if (targetIndex != null) {
      buckets[targetIndex].v += Number(shift.val ?? 0);
    }
  });

  return buckets.map(({ m, v }) => ({ m, v }));
}

function toSlug(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10);
}

function createReferralCode(name) {
  const seed = toSlug(name) || "medico";
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `${seed}-${randomSuffix}`;
}

function buildInviteUrl(referralCode, name) {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("ref", referralCode);
  url.searchParams.set("utm_source", "captured_share");
  if (name) {
    url.searchParams.set("ref_name", String(name).trim().slice(0, 40));
  }
  return url.toString();
}

async function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export default function AppMain({ onLogout = null }) {
  const [screen, setScreen] = useLocalStorage("pb_screen", "onboard");
  const [obStep, setObStep] = useState(0);
  const [tab, setTab] = useState("dashboard");
  const [name, setName] = useLocalStorage("pb_name", "");
  const [typing, setTyping] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [modal, setModal] = useState(null);
  const [groups, setGroups] = useLocalStorage("pb_groups", GROUPS);
  const [monthly, setMonthly] = useState(MONTHLY);
  const [prefs, setPrefs] = useLocalStorage("pb_prefs", DEFAULT_PREFS);
  const [growthMetrics, setGrowthMetrics] = useLocalStorage("pb_growth_metrics", DEFAULT_GROWTH_METRICS);
  const [referralCode, setReferralCode] = useLocalStorage("pb_referral_code", "");
  const [lastShareAt, setLastShareAt] = useLocalStorage("pb_last_share_at", "");

  const flags = getFeatureFlags();
  const uiV2 = flags.ui_v2;

  const feedRef = useRef(null);
  const tid = useRef(0);
  const nid = useRef(0);
  const monitorSessionIdRef = useRef(null);
  const prefsSyncReadyRef = useRef(false);
  const groupsSyncReadyRef = useRef(false);
  const inviteSeenRef = useRef(new Set());

  const toast = useCallback((title, message, severity = "success", source = "system") => {
    const id = ++tid.current;
    const toastItem = createToast({
      id,
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      source,
    });

    setToasts((previous) => [...previous, toastItem]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const addNotif = useCallback((title, message, severity = "info", source = "bot") => {
    const notification = createNotification({
      id: ++nid.current,
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      source,
    });

    setNotifs((previous) => [...previous, notification]);
  }, []);

  const trackGrowth = useCallback(async (eventName, payload = {}) => {
    if (!eventName) {
      return;
    }

    setGrowthMetrics((previous) => {
      const safePrevious = normalizeGrowthMetrics(previous);

      return {
        ...safePrevious,
        [eventName]: Number(safePrevious?.[eventName] ?? 0) + 1,
      };
    });

    try {
      await trackGrowthEvent(eventName, payload);
    } catch {
      // Growth telemetry should not break operational flows.
    }
  }, [setGrowthMetrics]);

  const {
    feed,
    captured,
    rejected,
    pending,
    handleFeedItems,
    acceptPending,
    rejectPending,
    loadInitialShifts,
    clearAllHistory,
    resetProcessQueue,
    registerCapture,
  } = useShifts({
    prefs,
    monitorSessionIdRef,
    toast,
    addNotif,
    setConfetti,
    setTyping,
  });

  const {
    botOn,
    feedError,
    apiLoading,
    startBot: startMonitoringHook,
    stopBot: stopMonitoringHook,
    loadInitialStatus,
    startPolling,
  } = useMonitoring({
    groups,
    prefs,
    name,
    monitorSessionIdRef,
    onFeedItems: handleFeedItems,
    toast,
  });

  const loadBootData = useCallback(async () => {
    try {
      const [remotePrefs, remoteGroups] = await Promise.all([
        fetchPreferences(),
        fetchGroups(),
      ]);

      if (remotePrefs) {
        setPrefs(normalizePrefs(remotePrefs));
      }

      if (Array.isArray(remoteGroups) && remoteGroups.length > 0) {
        setGroups(remoteGroups);
      }

      await loadInitialShifts();
      const status = await loadInitialStatus();

      if (status.isBotActive) {
        startPolling();
      }
    } catch {
      toast("API indisponível", "Não foi possível carregar todas as configurações iniciais.", "warning", "system");
    } finally {
      prefsSyncReadyRef.current = true;
      groupsSyncReadyRef.current = true;
    }
  }, [setGroups, setPrefs, loadInitialShifts, loadInitialStatus, startPolling, toast]);

  useEffect(() => {
    loadBootData();
  }, [loadBootData]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 99999;
    }
  }, [feed]);

  useEffect(() => {
    const normalized = normalizeGrowthMetrics(growthMetrics);
    if (isNormalizedGrowthMetrics(growthMetrics) && areGrowthMetricsEqual(growthMetrics, normalized)) {
      return;
    }

    setGrowthMetrics(normalized);
  }, [growthMetrics, setGrowthMetrics]);

  useEffect(() => {
    if (hasValidReferralCode(referralCode)) {
      return;
    }

    setReferralCode(createReferralCode(name));
  }, [name, referralCode, setReferralCode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const clearInviteParams = () => {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("ref");
      cleanUrl.searchParams.delete("ref_name");
      cleanUrl.searchParams.delete("utm_source");
      const nextPath = `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`;
      window.history.replaceState({}, "", nextPath);
    };

    const params = new URLSearchParams(window.location.search);
    if (!hasInviteQueryParams(params)) {
      return;
    }

    const sourceCode = normalizeReferralCode(params.get("ref"));
    const currentCode = normalizeReferralCode(referralCode);

    if (!sourceCode) {
      clearInviteParams();
      return;
    }

    if (sourceCode === currentCode || inviteSeenRef.current.has(sourceCode)) {
      clearInviteParams();
      return;
    }

    const dedupeKey = `pb_invite_seen_${sourceCode}`;
    try {
      if (window.localStorage.getItem(dedupeKey)) {
        clearInviteParams();
        return;
      }
      window.localStorage.setItem(dedupeKey, "1");
    } catch {
      // If storage is unavailable, continue and keep non-blocking behavior.
    }

    inviteSeenRef.current.add(sourceCode);

    void trackGrowth("invite_accepted", {
      ref: sourceCode,
      source: params.get("utm_source") || "direct",
    });

    const inviterName = params.get("ref_name");
    if (inviterName) {
      toast("Convite detectado", `Voce chegou por um convite de ${inviterName}.`, "info", "growth");
    }

    clearInviteParams();
  }, [referralCode, toast, trackGrowth]);

  useEffect(() => {
    setMonthly(buildMonthlySeries(captured));
  }, [captured]);

  useEffect(() => {
    if (!prefsSyncReadyRef.current) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        await savePreferences(prefs);
      } catch (error) {
        toast("Falha ao salvar filtros", error?.message || "Não foi possível persistir preferências.", "warning", "system");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [prefs, toast]);

  useEffect(() => {
    if (!groupsSyncReadyRef.current) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        await saveGroups(groups);
      } catch (error) {
        toast("Falha ao salvar grupos", error?.message || "Não foi possível persistir grupos ativos.", "warning", "system");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [groups, toast]);

  const startBot = useCallback(async () => {
    try {
      const whatsappStatus = await fetchWhatsappStatus();
      if (!whatsappStatus?.connected) {
        toast(
          "Conecte o WhatsApp",
          "Conecte seu WhatsApp em Configurações para iniciar o monitoramento em tempo real.",
          "warning",
          "system",
        );
        setTab("settings");
        return;
      }
    } catch {
      // If status endpoint is unavailable, keep previous start behavior.
    }

    resetProcessQueue();
    setTyping(null);
    await startMonitoringHook();
  }, [resetProcessQueue, setTab, startMonitoringHook, toast]);

  const stopBot = useCallback(async () => {
    setTyping(null);
    await stopMonitoringHook();
  }, [stopMonitoringHook]);

  const total = useMemo(() => captured.reduce((sum, shift) => sum + Number(shift.val ?? 0), 0), [captured]);

  const exportCSV = useCallback(() => {
    const header = [
      "Hospital",
      "Grupo",
      "Especialidade",
      "Valor (R$)",
      "Data",
      "Duracao",
      "Distancia (km)",
      "Score (%)",
      "Capturado as",
    ];
    const rows = captured.map((shift) => [
      shift.hospital,
      shift.group,
      shift.spec,
      shift.val,
      shift.date,
      shift.hours,
      shift.dist,
      shift.sc || "",
      shift.capturedAt || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plantoes_capturados.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [captured]);

  const shareCapturedSummary = useCallback(async () => {
    if (captured.length === 0) {
      toast("Sem capturas", "Capture pelo menos um plantao para compartilhar seu resultado.", "warning", "growth");
      return;
    }

    const activeCode = referralCode || createReferralCode(name);
    if (!referralCode) {
      setReferralCode(activeCode);
    }

    const inviteUrl = buildInviteUrl(activeCode, name);
    const avgTicket = Math.round(total / Math.max(captured.length, 1));
    const introName = name ? `${name} ` : "Eu ";
    const message = `${introName}capturei ${captured.length} plantoes (R$ ${fmt(total)}) com ticket medio de R$ ${fmt(avgTicket)} usando o PlantaoBot.`;
    const fullText = `${message}\nTeste aqui: ${inviteUrl}`;
    const trackPayload = {
      capturedCount: captured.length,
      totalValue: total,
      ref: activeCode,
    };

    void trackGrowth("share_intent", {
      ...trackPayload,
      trigger: "captured_tab",
    });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "PlantaoBot",
          text: message,
          url: inviteUrl,
        });

        setLastShareAt(new Date().toISOString());
        void trackGrowth("share_clicked", {
          ...trackPayload,
          channel: "native_share",
        });
        toast("Compartilhamento pronto", "Resumo compartilhado com sucesso.", "success", "growth");
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    const popup = typeof window !== "undefined" ? window.open(whatsappUrl, "_blank", "noopener,noreferrer") : null;

    if (popup) {
      setLastShareAt(new Date().toISOString());
      void trackGrowth("share_clicked", {
        ...trackPayload,
        channel: "whatsapp",
      });
      toast("Compartilhamento pronto", "Mensagem aberta no WhatsApp para voce enviar.", "success", "growth");
      return;
    }

    try {
      const copied = await copyTextToClipboard(fullText);
      if (!copied) {
        throw new Error("copy_failed");
      }
      setLastShareAt(new Date().toISOString());
      void trackGrowth("share_clicked", {
        ...trackPayload,
        channel: "copy",
      });
      toast("Link copiado", "Mensagem pronta para colar no WhatsApp.", "success", "growth");
    } catch {
      toast("Falha ao compartilhar", "Nao foi possivel abrir o WhatsApp nem copiar a mensagem.", "warning", "growth");
    }
  }, [captured, name, referralCode, setReferralCode, setLastShareAt, toast, total, trackGrowth]);

  const acceptFromModal = useCallback(async (shift) => {
    if (captured.some((item) => item.id === shift.id)) {
      return;
    }

    try {
      const persisted = await captureOffer(shift, {
        sessionId: monitorSessionIdRef.current,
        source: "manual",
      });
      registerCapture({ ...shift, ...persisted }, { fromAuto: false });
    } catch (error) {
      toast("Falha ao aceitar", error?.message || "Não foi possível capturar este plantão.", "error", "manual");
      throw error;
    }
  }, [captured, monitorSessionIdRef, registerCapture, toast]);

  const handleClearHistory = useCallback(async () => {
    await clearAllHistory();
  }, [clearAllHistory]);

  const actG = useMemo(() => groups.filter((group) => group.active), [groups]);
  const projM = useMemo(() => (prefs.minVal <= 2000 ? 18400 : prefs.minVal <= 3000 ? 14200 : 9800), [prefs.minVal]);

  const capturedVm = useMemo(() => normalizeShiftCollection(captured), [captured]);
  const rejectedVm = useMemo(() => normalizeShiftCollection(rejected), [rejected]);
  const pendingVm = useMemo(() => normalizeShiftCollection(pending), [pending]);
  const normalizedGrowthMetrics = useMemo(() => normalizeGrowthMetrics(growthMetrics), [growthMetrics]);
  const shareIntentCount = Number(normalizedGrowthMetrics?.share_intent ?? 0);
  const shareReadyCount = Number(normalizedGrowthMetrics?.share_clicked ?? 0);
  const inviteAcceptedCount = Number(normalizedGrowthMetrics?.invite_accepted ?? 0);
  const lastShareLabel = useMemo(() => {
    if (!lastShareAt) {
      return "";
    }

    const parsed = new Date(lastShareAt);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastShareAt]);

  const tabs = useMemo(
    () => [
      createNavItem({ key: "dashboard", icon: "D", label: "Dashboard", badgeCount: 0, route: "/dashboard" }),
      createNavItem({ key: "feed", icon: "F", label: "Feed", badgeCount: feed.length, route: "/feed" }),
      createNavItem({
        key: prefs.auto ? "captured" : "swipe",
        icon: prefs.auto ? "C" : "S",
        label: prefs.auto ? "Capturados" : "Swipe",
        badgeCount: prefs.auto ? captured.length : pending.length,
        route: prefs.auto ? "/captured" : "/swipe",
      }),
      createNavItem({ key: "insights", icon: "I", label: "Insights", badgeCount: 0, route: "/insights" }),
      createNavItem({ key: "ai", icon: "AI", label: "Assistente", badgeCount: 0, route: "/ai" }),
      createNavItem({ key: "settings", icon: "CFG", label: "Configuracoes", badgeCount: 0, route: "/settings" }),
    ],
    [feed.length, prefs.auto, captured.length, pending.length],
  );

  const activeTab = tabs.some((item) => item.key === tab) ? tab : "dashboard";

  const tabContent = {
    dashboard: (
      <Dashboard
        uiV2={uiV2}
        setTab={setTab}
        botOn={botOn}
        startBot={startBot}
        stopBot={stopBot}
        captured={captured}
        rejected={rejected}
        pending={pending}
        actG={actG}
        total={total}
        prefs={prefs}
        typing={typing}
        setModal={setModal}
      />
    ),
    feed: (
      <FeedTab
        uiV2={uiV2}
        botOn={botOn}
        feed={feed}
        typing={typing}
        setModal={setModal}
        feedRef={feedRef}
        setTab={setTab}
      />
    ),
    swipe: (
      <SwipeTab
        uiV2={uiV2}
        botOn={botOn}
        pending={pending}
        captured={captured}
        prefs={prefs}
        acceptPending={acceptPending}
        rejectPending={rejectPending}
        setModal={setModal}
      />
    ),
    captured: (
      <CapturedTab
        uiV2={uiV2}
        captured={captured}
        rejected={rejected}
        total={total}
        exportCSV={exportCSV}
        onShareCaptured={shareCapturedSummary}
        shareClicked={shareIntentCount}
        shareReady={shareReadyCount}
        inviteAccepted={inviteAcceptedCount}
        lastShareLabel={lastShareLabel}
        setModal={setModal}
      />
    ),
    insights: (
      <InsightsTab
        uiV2={uiV2}
        captured={captured}
        rejected={rejected}
        prefs={prefs}
        monthly={monthly}
        projM={projM}
      />
    ),
    ai: (
      <Card style={{ minHeight: "calc(100vh - 220px)", display: "flex", flexDirection: "column" }}>
        <AIChat prefs={prefs} name={name} captured={captured} rejected={rejected} showHeader={!uiV2} />
      </Card>
    ),
    settings: (
      <SettingsTab
        uiV2={uiV2}
        groups={groups}
        setGroups={setGroups}
        prefs={prefs}
        setPrefs={setPrefs}
        name={name}
        actG={actG}
        setScreen={setScreen}
        setObStep={setObStep}
        onClearHistory={handleClearHistory}
        onLogout={onLogout}
      />
    ),
  };

  const selectedContent = tabContent[activeTab] || tabContent.dashboard;

  if (screen === "onboard") {
    return (
      <Onboarding
        obStep={obStep}
        setObStep={setObStep}
        name={name}
        setName={setName}
        prefs={prefs}
        setPrefs={setPrefs}
        projM={projM}
        onDone={() => setScreen("app")}
      />
    );
  }

  const kpis = [
    { label: "Capturados", value: capturedVm.length, tone: "success" },
    { label: "Pendentes", value: pendingVm.length, tone: "warning" },
    { label: "Descartados", value: rejectedVm.length, tone: "error" },
    { label: "Total", value: `R$ ${fmt(total)}`, tone: "primary" },
  ];

  return (
    <>
      <style>{CSS}</style>
      {!uiV2 ? <BgOrbs /> : null}
      <Confetti active={confetti} />
      {uiV2 ? <ToastViewport items={toasts} /> : <Toasts items={toasts} />}
      <NotifDrawer open={notifOpen} notifs={notifs} onClose={() => setNotifOpen(false)} />
      {modal ? (
        <ShiftModal
          shift={modal}
          prefs={prefs}
          captured={captured}
          onClose={() => setModal(null)}
          onAccept={acceptFromModal}
        />
      ) : null}

      {uiV2 ? (
        <AppShell
          title="PlantaoBot"
          subtitle="Operacao Clinica"
          userName={name}
          botOn={botOn}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setTab}
          onStartBot={startBot}
          onStopBot={stopBot}
          onOpenNotifications={() => setNotifOpen(true)}
          notificationCount={notifs.length}
        >
          <div className="pb-tab-panels" style={{ animation: "fadeUp .25s both" }}>
            <PageHeader
              title={tabs.find((item) => item.key === activeTab)?.label || "Dashboard"}
              subtitle={botOn ? "Monitoramento em execução" : "Monitoramento pausado"}
              action={
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge tone={botOn ? "success" : "warning"}>{botOn ? "Ativo" : "Inativo"}</Badge>
                  <Button type="button" variant="secondary" onClick={() => setNotifOpen(true)}>
                    Notificacoes
                  </Button>
                </div>
              }
            />

            <Card>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 8,
                }}
              >
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: C.surface2,
                    }}
                  >
                    <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{kpi.label}</div>
                    <div className="pb-mono" style={{ fontSize: 18, fontWeight: 700, color: C.text0 }}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {feedError ? (
              <Card>
                <EmptyState
                  icon="!"
                  title="Erro de monitoramento"
                  description={feedError}
                  action={
                    <Button
                      type="button"
                      onClick={() => {
                        startBot();
                      }}
                    >
                      Reiniciar
                    </Button>
                  }
                />
              </Card>
            ) : null}

            {apiLoading ? (
              <Card>
                <EmptyState
                  icon="?"
                  title="Sincronizando dados reais"
                  description="Carregando estado atual do backend..."
                />
              </Card>
            ) : null}

            {selectedContent}
          </div>
        </AppShell>
      ) : (
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            background: C.bg0,
            minHeight: "100vh",
            color: C.tx0,
            padding: 14,
          }}
        >
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>PlantaoBot</div>
                <div style={{ fontSize: 12, color: C.text1 }}>Dr(a). {(name || "Medico").toUpperCase()}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setNotifOpen(true)}>
                  Alertas {notifs.length > 0 ? `(${notifs.length})` : ""}
                </Button>
                <Button type="button" variant={botOn ? "danger" : "primary"} onClick={botOn ? stopBot : startBot}>
                  {botOn ? "Parar" : "Iniciar"}
                </Button>
              </div>
            </div>
          </Card>

          {selectedContent}

          <nav
            role="navigation"
            aria-label="Navegacao principal"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 400,
              background: "rgba(255,255,255,0.96)",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-around",
              padding: "8px 4px 12px",
            }}
          >
            {tabs.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    background: active ? C.primarySoft : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px 12px",
                    borderRadius: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.primary : C.text2 }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}





