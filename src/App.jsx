import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "./constants/colors.js";
import { SHIFTS, NOISE, MONTHLY, GROUPS } from "./data/mockData.js";
import { fmt, nowT, calcScore } from "./utils/index.js";
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

export default function App() {
  const [screen, setScreen] = useLocalStorage("pb_screen", "onboard");
  const [obStep, setObStep] = useState(0);
  const [tab, setTab] = useState("dashboard");
  const [name, setName] = useLocalStorage("pb_name", "");
  const [botOn, setBotOn] = useState(false);
  const [feed, setFeed] = useState([]);
  const [typing, setTyping] = useState(null);
  const [captured, setCaptured] = useLocalStorage("pb_captured", []);
  const [rejected, setRejected] = useState([]);
  const [pending, setPending] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [modal, setModal] = useState(null);
  const [groups, setGroups] = useLocalStorage("pb_groups", GROUPS);
  const [monthly, setMonthly] = useState(MONTHLY);
  const [feedError, setFeedError] = useState(null);
  const [prefs, setPrefs] = useLocalStorage("pb_prefs", {
    minVal: 1500,
    maxDist: 20,
    days: ["Sex", "Sáb", "Dom"],
    specs: ["Emergência", "UTI", "Clínica Geral"],
    auto: true,
  });

  const flags = getFeatureFlags();
  const uiV2 = flags.ui_v2;

  const timers = useRef([]);
  const feedRef = useRef(null);
  const tid = useRef(0);
  const nid = useRef(0);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

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

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 99999;
    }
  }, [feed]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  function startBot() {
    setFeedError(null);
    setBotOn(true);
    setFeed([]);
    setCaptured([]);
    setRejected([]);
    setPending([]);
    setMonthly(MONTHLY);
    clearAllTimers();

    const allMessages = [
      ...SHIFTS.map((shift) => ({ ...shift, isOffer: true, delay: shift.delay })),
      ...NOISE.map((message) => ({ ...message, isOffer: false })),
    ].sort((a, b) => a.delay - b.delay);

    allMessages.forEach((message) => {
      const typingTimer = setTimeout(() => {
        setTyping(message.group);
        setTimeout(() => setTyping(null), 900);
      }, Math.max(0, message.delay - 1000));
      timers.current.push(typingTimer);

      const feedTimer = setTimeout(() => {
        setFeed((previous) => [
          ...previous,
          {
            ...message,
            ts: nowT(),
            state: message.isOffer ? "scanning" : "done",
          },
        ]);

        if (!message.isOffer) {
          return;
        }

        const scoreTimer = setTimeout(() => {
          try {
            const result = calcScore(message, prefs);
            const score = result.s;
            const ok = score >= 60;

            setFeed((previous) =>
              previous.map((item) =>
                item.id === message.id
                  ? {
                      ...item,
                      state: "done",
                      sc: score,
                      ok,
                    }
                  : item,
              ),
            );

            if (prefs.auto) {
              if (ok) {
                setCaptured((previous) => [
                  ...previous,
                  {
                    ...message,
                    sc: score,
                    capturedAt: nowT(),
                  },
                ]);
                setMonthly((previous) => previous.map((entry) => (entry.m === "Mar" ? { ...entry, v: entry.v + message.val } : entry)));
                toast("Plantao garantido", `${message.hospital} - R$ ${fmt(message.val)}`, "success", "bot");
                addNotif(
                  "Plantao capturado",
                  `${message.hospital} - ${message.date} - R$ ${fmt(message.val)}`,
                  "success",
                  "bot",
                );
                if (message.val >= 3000) {
                  setConfetti(true);
                  setTimeout(() => setConfetti(false), 2500);
                }
              } else {
                setRejected((previous) => [...previous, { ...message, sc: score }]);
                addNotif("Vaga descartada", `${message.hospital} - score ${score}%`, "info", "bot");
              }
            } else if (ok) {
              setPending((previous) => [...previous, { ...message, sc: score }]);
            } else {
              setRejected((previous) => [...previous, { ...message, sc: score }]);
            }
          } catch {
            setFeedError("Falha ao processar feed em tempo real.");
            toast("Erro no monitoramento", "Nao foi possivel processar o feed. Tente reiniciar o bot.", "error", "system");
          }
        }, 1700);

        timers.current.push(scoreTimer);
      }, message.delay);

      timers.current.push(feedTimer);
    });

    timers.current.push(
      setTimeout(() => {
        setBotOn(false);
      }, 30000),
    );
  }

  function stopBot() {
    setBotOn(false);
    setTyping(null);
    clearAllTimers();
  }

  function acceptPending(shift) {
    setPending((previous) => previous.filter((item) => item.id !== shift.id));
    setCaptured((previous) => [...previous, { ...shift, capturedAt: nowT() }]);
    setMonthly((previous) => previous.map((item) => (item.m === "Mar" ? { ...item, v: item.v + shift.val } : item)));
    toast("Aceito", `${shift.hospital} - R$ ${fmt(shift.val)}`, "success", "manual");
    if (shift.val >= 3000) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    }
  }

  function rejectPending(shift) {
    setPending((previous) => previous.filter((item) => item.id !== shift.id));
    setRejected((previous) => [...previous, shift]);
  }

  function exportCSV() {
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
  }

  function acceptFromModal(shift) {
    if (captured.some((item) => item.id === shift.id)) {
      return;
    }

    setCaptured((previous) => [...previous, { ...shift, capturedAt: nowT() }]);
    setMonthly((previous) => previous.map((item) => (item.m === "Mar" ? { ...item, v: item.v + shift.val } : item)));
    setPending((previous) => previous.filter((item) => item.id !== shift.id));

    if (shift.val >= 3000) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    }

    toast("Plantao aceito", `${shift.hospital} - R$ ${fmt(shift.val)}`, "success", "manual");
    addNotif("Plantao capturado", `${shift.hospital} - ${shift.date} - R$ ${fmt(shift.val)}`, "success", "bot");
  }

  const total = useMemo(() => captured.reduce((sum, shift) => sum + shift.val, 0), [captured]);
  const actG = useMemo(() => groups.filter((group) => group.active), [groups]);
  const projM = useMemo(() => (prefs.minVal <= 2000 ? 18400 : prefs.minVal <= 3000 ? 14200 : 9800), [prefs.minVal]);

  const capturedVm = useMemo(() => normalizeShiftCollection(captured), [captured]);
  const rejectedVm = useMemo(() => normalizeShiftCollection(rejected), [rejected]);
  const pendingVm = useMemo(() => normalizeShiftCollection(pending), [pending]);

  const tabs = useMemo(
    () => [
      createNavItem({
        key: "dashboard",
        icon: "D",
        label: "Dashboard",
        badgeCount: 0,
        route: "/dashboard",
      }),
      createNavItem({
        key: "feed",
        icon: "F",
        label: "Feed",
        badgeCount: feed.length,
        route: "/feed",
      }),
      createNavItem({
        key: prefs.auto ? "captured" : "swipe",
        icon: prefs.auto ? "C" : "S",
        label: prefs.auto ? "Capturados" : "Swipe",
        badgeCount: prefs.auto ? captured.length : pending.length,
        route: prefs.auto ? "/captured" : "/swipe",
      }),
      createNavItem({
        key: "insights",
        icon: "I",
        label: "Insights",
        badgeCount: 0,
        route: "/insights",
      }),
      createNavItem({
        key: "ai",
        icon: "AI",
        label: "Assistente",
        badgeCount: 0,
        route: "/ai",
      }),
      createNavItem({
        key: "settings",
        icon: "CFG",
        label: "Configuracoes",
        badgeCount: 0,
        route: "/settings",
      }),
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
        setCaptured={setCaptured}
        setMonthly={setMonthly}
        setRejected={setRejected}
        toast={toast}
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
      {modal ? <ShiftModal shift={modal} prefs={prefs} captured={captured} onClose={() => setModal(null)} onAccept={acceptFromModal} /> : null}

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
              subtitle={botOn ? "Monitoramento em execucao" : "Monitoramento pausado"}
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
                    <Button type="button" onClick={() => { setFeedError(null); startBot(); }}>
                      Reiniciar bot
                    </Button>
                  }
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


