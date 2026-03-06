import { useState, useEffect, useCallback } from "react";
import { C } from "../../constants/colors.js";
import { DAYS, SPECS } from "../../data/mockData.js";
import { fmt } from "../../utils/index.js";
import { Badge, Button, Card, PageHeader, Toggle } from "../ui/index.jsx";
import { S } from "../../styles/index.js";
import { fetchWhatsappConfig, resetWhatsappToken, buildWebhookUrl } from "../../services/whatsappApi.js";

export default function SettingsTab({
  uiV2,
  groups,
  setGroups,
  prefs,
  setPrefs,
  name,
  actG,
  setScreen,
  setObStep,
  onClearHistory,
  onLogout,
}) {
  const [waConfig, setWaConfig] = useState(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waCopied, setWaCopied] = useState(false);
  const [waResetting, setWaResetting] = useState(false);

  const loadWaConfig = useCallback(async () => {
    setWaLoading(true);
    try {
      const config = await fetchWhatsappConfig();
      setWaConfig(config);
    } catch {
      setWaConfig(null);
    } finally {
      setWaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWaConfig();
  }, [loadWaConfig]);

  async function handleCopyWebhook() {
    if (!waConfig) return;
    const url = buildWebhookUrl(waConfig.userId, waConfig.webhookToken);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2000);
    } catch {
      // ignore copy failure
    }
  }

  async function handleResetToken() {
    if (!window.confirm("Gerar um novo token invalidará o webhook atual. Continuar?")) return;
    setWaResetting(true);
    try {
      const result = await resetWhatsappToken();
      setWaConfig((prev) => prev ? { ...prev, webhookToken: result.webhookToken } : prev);
    } catch {
      // ignore
    } finally {
      setWaResetting(false);
    }
  }

  const webhookUrl = waConfig ? buildWebhookUrl(waConfig.userId, waConfig.webhookToken) : "";

  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Configurações"
          subtitle="Preferências operacionais, filtros e perfil"
          action={<Badge tone="info">{actG.length} grupos ativos</Badge>}
        />
      ) : null}

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Grupos monitorados</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "9px 11px",
                background: C.surface2,
              }}
            >
              <span style={{ fontSize: 18 }}>{group.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{group.name}</div>
                <div style={{ marginTop: 1, fontSize: 11, color: C.text2 }}>{group.members} membros</div>
              </div>
              <Toggle
                on={group.active}
                onChange={() =>
                  setGroups((previous) => previous.map((item) => (item.id === group.id ? { ...item, active: !item.active } : item)))
                }
                label={`${group.active ? "Desativar" : "Ativar"} ${group.name}`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Integração WhatsApp</div>

        {waLoading ? (
          <div style={{ fontSize: 12, color: C.text2 }}>Carregando configuração...</div>
        ) : !waConfig ? (
          <div style={{ fontSize: 12, color: C.text2 }}>
            Não foi possível carregar a configuração. Verifique a conexão com o backend.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: waConfig.connected ? C.success : C.text2,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: waConfig.connected ? C.success : C.text2 }}>
                {waConfig.connected ? "Conectado" : "Não conectado"}
              </span>
              {waConfig.messageCount > 0 && (
                <Badge tone="info">{waConfig.messageCount} mensagens recebidas</Badge>
              )}
            </div>

            <div>
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>
                Configure seu bridge WhatsApp (Evolution API, WPPConnect ou Cloud API) com esta URL:
              </div>
              <div
                style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 10,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  color: C.text1,
                  marginBottom: 8,
                }}
              >
                {webhookUrl || "Carregando..."}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button type="button" variant="primary" onClick={handleCopyWebhook} disabled={!webhookUrl}>
                  {waCopied ? "Copiado!" : "Copiar URL"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleResetToken} disabled={waResetting}>
                  {waResetting ? "Gerando..." : "Novo token"}
                </Button>
              </div>
            </div>

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 11,
                color: "#92400e",
              }}
            >
              <strong>Como configurar:</strong> Cole a URL acima nas configurações de webhook do seu bridge
              WhatsApp. Compatível com Evolution API, WPPConnect e WhatsApp Business Cloud API. Mensagens
              contendo palavras-chave de plantão (ex.: &quot;plantão disponível&quot;, &quot;valor R$&quot;)
              serão detectadas automaticamente e aparecerão no Feed.
            </div>
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 10, fontSize: 12, color: C.text2, fontWeight: 700 }}>Filtros</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <label htmlFor="sliderMinVal" style={S.lbl}>
              Valor mínimo
            </label>
            <span className="pb-mono" style={{ color: C.success, fontWeight: 700 }}>
              R$ {fmt(prefs.minVal)}
            </span>
          </div>
          <input
            id="sliderMinVal"
            type="range"
            min={500}
            max={5000}
            step={100}
            value={prefs.minVal}
            style={S.range}
            onChange={(event) => setPrefs((previous) => ({ ...previous, minVal: Number(event.target.value) }))}
            aria-valuetext={`R$ ${fmt(prefs.minVal)}`}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <label htmlFor="sliderMaxDist" style={S.lbl}>
              Distância máxima
            </label>
            <span className="pb-mono" style={{ color: C.info, fontWeight: 700 }}>
              {prefs.maxDist} km
            </span>
          </div>
          <input
            id="sliderMaxDist"
            type="range"
            min={1}
            max={100}
            step={1}
            value={prefs.maxDist}
            style={S.range}
            onChange={(event) => setPrefs((previous) => ({ ...previous, maxDist: Number(event.target.value) }))}
            aria-valuetext={`${prefs.maxDist} km`}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={S.lbl}>Dias disponíveis</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {DAYS.map((day) => {
              const enabled = prefs.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setPrefs((previous) => ({
                      ...previous,
                      days: enabled ? previous.days.filter((item) => item !== day) : [...previous.days, day],
                    }))
                  }
                  style={{
                    padding: "6px 10px",
                    borderRadius: 9,
                    border: `1px solid ${enabled ? C.primary : C.border}`,
                    background: enabled ? C.primarySoft : "#fff",
                    color: enabled ? C.primary : C.text2,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={S.lbl}>Especialidades</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {SPECS.map((specialty) => {
              const enabled = prefs.specs.includes(specialty);
              return (
                <button
                  key={specialty}
                  type="button"
                  onClick={() =>
                    setPrefs((previous) => ({
                      ...previous,
                      specs: enabled ? previous.specs.filter((item) => item !== specialty) : [...previous.specs, specialty],
                    }))
                  }
                  style={{
                    padding: "5px 11px",
                    borderRadius: 9,
                    border: `1px solid ${enabled ? C.info : C.border}`,
                    background: enabled ? C.infoSoft : "#fff",
                    color: enabled ? C.info : C.text2,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {specialty}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Modo de aceite</div>
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          {[
            { value: true, title: "Automático", description: "Captura imediata sem confirmação" },
            { value: false, title: "Manual (swipe)", description: "Você decide cada oportunidade" },
          ].map((option) => {
            const active = prefs.auto === option.value;
            return (
              <button
                key={option.title}
                type="button"
                onClick={() => setPrefs((previous) => ({ ...previous, auto: option.value }))}
                style={{
                  border: `1px solid ${active ? C.primary : C.border}`,
                  borderRadius: 10,
                  background: active ? C.primarySoft : "#fff",
                  color: active ? C.primary : C.text1,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{option.title}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: C.text2 }}>{option.description}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Perfil</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{name || "Dr(a). Medico"}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: C.text2 }}>Plataforma ativa em {actG.length} grupos</div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setScreen("onboard");
              setObStep(0);
            }}
          >
            Editar
          </Button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button type="button" variant="danger" onClick={onClearHistory}>
            Limpar histórico de plantões
          </Button>
          {onLogout ? (
            <Button type="button" variant="secondary" onClick={onLogout}>
              Sair da conta
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}


