import { useState, useEffect, useCallback } from 'react';
import { C } from '../../constants/colors.js';
import { DAYS, SPECS } from '../../data/mockData.js';
import { fmt } from '../../utils/index.js';
import { Badge, Button, Card, PageHeader, Toggle } from '../ui/index.jsx';
import { S } from '../../styles/index.js';
import { ApiError } from '../../services/apiClient.js';
import {
  fetchWhatsappConfig,
  fetchWhatsappStatus,
  resetWhatsappToken,
  buildWebhookUrl,
  connectWhatsapp,
  fetchWhatsappGroups,
} from '../../services/whatsappApi.js';

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
  const [waConnecting, setWaConnecting] = useState(false);
  const [waSyncingGroups, setWaSyncingGroups] = useState(false);
  const [waConnectError, setWaConnectError] = useState('');
  const [waSyncGroupsError, setWaSyncGroupsError] = useState('');
  const [waQrCode, setWaQrCode] = useState('');

  function getFriendlyConnectError(error) {
    if (!(error instanceof ApiError)) {
      return 'Não foi possível conectar ao WhatsApp agora. Tente novamente em instantes.';
    }

    if (error.data?.error === 'EVOLUTION_TIMEOUT') {
      return 'A Evolution API demorou para responder. Tente novamente em alguns segundos.';
    }

    if (error.data?.error === 'EVOLUTION_INVALID_KEY') {
      return 'A chave da Evolution API parece inválida. Confira a configuração no backend.';
    }

    if (error.data?.error === 'EVOLUTION_INSTANCE_EXISTS') {
      return 'Esta instância já existe. Tentando reutilizar a conexão atual.';
    }

    return error.message || 'Falha ao iniciar conexão com WhatsApp.';
  }

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

  const refreshWaStatus = useCallback(async () => {
    try {
      const status = await fetchWhatsappStatus({ refresh: true });
      setWaConfig((previous) => {
        if (!previous) {
          return previous;
        }

        const next = {
          ...previous,
          connected: Boolean(status.connected),
          connectedAt: status.connectedAt || null,
          instanceId: status.instanceId || previous.instanceId || null,
          phoneNumber: status.phoneNumber || previous.phoneNumber || null,
        };

        if (next.connected) {
          setWaQrCode('');
        }

        return next;
      });
    } catch {
      // ignore polling errors to avoid UI flicker
    }
  }, []);

  useEffect(() => {
    loadWaConfig();
  }, [loadWaConfig]);

  useEffect(() => {
    if (!waConfig) {
      return undefined;
    }

    refreshWaStatus();
    const intervalId = setInterval(() => {
      refreshWaStatus();
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [waConfig, refreshWaStatus]);

  async function handleCopyWebhook() {
    if (!waConfig) return;
    const url = buildWebhookUrl(waConfig.userId, waConfig.webhookToken);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2000);
    } catch {
      // ignore copy failure
    }
  }

  async function handleResetToken() {
    if (!window.confirm('Gerar um novo token invalidará o webhook atual. Continuar?')) return;
    setWaResetting(true);
    try {
      const result = await resetWhatsappToken();
      setWaConfig((prev) => (prev ? { ...prev, webhookToken: result.webhookToken } : prev));
    } catch {
      // ignore
    } finally {
      setWaResetting(false);
    }
  }

  async function handleConnectWhatsapp() {
    setWaConnecting(true);
    setWaConnectError('');

    try {
      const result = await connectWhatsapp();
      setWaQrCode(result.qrCode || '');
      setWaConfig((prev) =>
        prev
          ? {
              ...prev,
              instanceId: result.instanceId || prev.instanceId,
              connected: Boolean(result.connected),
            }
          : prev,
      );
    } catch (error) {
      setWaConnectError(getFriendlyConnectError(error));
    } finally {
      setWaConnecting(false);
    }
  }

  async function handleSyncWhatsappGroups() {
    setWaSyncingGroups(true);
    setWaSyncGroupsError('');

    try {
      const result = await fetchWhatsappGroups();
      if (Array.isArray(result?.groups)) {
        setGroups(result.groups);
      }
    } catch (error) {
      setWaSyncGroupsError(error?.message || 'Não foi possível sincronizar os grupos do WhatsApp.');
    } finally {
      setWaSyncingGroups(false);
    }
  }

  const webhookUrl = waConfig ? buildWebhookUrl(waConfig.userId, waConfig.webhookToken) : '';

  return (
    <div style={{ animation: 'fadeUp .25s ease-out' }}>
      {uiV2 ? (
        <PageHeader
          title="Configurações"
          subtitle="Ajuste suas preferências operacionais e dados de perfil"
        />
      ) : null}

      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, color: C.text0, fontWeight: 600, marginBottom: 16 }}>
          Integração WhatsApp
        </div>

        {waLoading ? (
          <div style={{ fontSize: 13, color: C.text2 }}>Carregando configuração...</div>
        ) : !waConfig ? (
          <div style={{ fontSize: 13, color: C.error }}>
            Não foi possível carregar a configuração. Verifique a conexão com o backend.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: C.surface2,
                padding: '12px 16px',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: waConfig.connected ? C.success : C.warning,
                  flexShrink: 0,
                  boxShadow: waConfig.connected ? `0 0 8px ${C.success}` : 'none',
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text0 }}>
                {waConfig.connected ? 'Conectado' : 'Não conectado'}
              </span>
              {waConfig.connectedAt ? (
                <span style={{ fontSize: 12, color: C.text2, marginLeft: 8 }}>
                  desde {new Date(waConfig.connectedAt).toLocaleDateString('pt-BR')}
                </span>
              ) : null}
              {waConfig.messageCount > 0 && (
                <Badge tone="info" style={{ marginLeft: 'auto' }}>
                  {waConfig.messageCount} mensagens
                </Badge>
              )}
            </div>

            {waConfig.instanceId || waConfig.phoneNumber ? (
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  fontSize: 13,
                  color: C.text2,
                  background: C.surface1,
                  padding: '12px 16px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                }}
              >
                {waConfig.instanceId ? (
                  <div>
                    <strong>Instância:</strong> {waConfig.instanceId}
                  </div>
                ) : null}
                {waConfig.phoneNumber ? (
                  <div>
                    <strong>Número:</strong> {waConfig.phoneNumber}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div>
              <div style={S.lbl}>URL do Webhook (Evolution API, WPPConnect, Cloud API)</div>
              <div
                className="pb-mono"
                style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '12px 16px',
                  fontSize: 13,
                  wordBreak: 'break-all',
                  color: C.text0,
                  marginBottom: 12,
                }}
              >
                {webhookUrl || 'Carregando...'}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCopyWebhook}
                  disabled={!webhookUrl}
                >
                  {waCopied ? 'Copiado!' : 'Copiar Webhook'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetToken}
                  disabled={waResetting}
                >
                  {waResetting ? 'Gerando...' : 'Novo Token'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleConnectWhatsapp}
                  disabled={waConnecting}
                >
                  {waConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSyncWhatsappGroups}
                  disabled={waSyncingGroups}
                >
                  {waSyncingGroups ? 'Sincronizando...' : 'Sincronizar Grupos'}
                </Button>
              </div>
            </div>

            {waConnectError ? (
              <div
                style={{
                  background: C.errorSoft,
                  border: `1px solid ${C.error}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: C.error,
                }}
              >
                {waConnectError}
              </div>
            ) : null}

            {waSyncGroupsError ? (
              <div
                style={{
                  background: C.errorSoft,
                  border: `1px solid ${C.error}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: C.error,
                }}
              >
                {waSyncGroupsError}
              </div>
            ) : null}

            {waQrCode ? (
              <div
                style={{
                  background: C.surface1,
                  border: `1px dashed ${C.borderStrong}`,
                  borderRadius: 8,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text0 }}>
                  Escaneie o QR code no WhatsApp
                </div>
                <img
                  src={waQrCode}
                  alt="QR code"
                  style={{
                    width: 240,
                    height: 240,
                    background: '#fff',
                    padding: 8,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 18, color: C.text0, fontWeight: 600 }}>Grupos Monitorados</div>
          <Badge tone="info">{actG.length} ativos</Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: `1px solid ${group.active ? C.primarySoft : C.border}`,
                borderRadius: 8,
                padding: '12px 16px',
                background: group.active ? C.surface1 : C.surface2,
                transition: 'all .2s ease',
              }}
            >
              <span style={{ fontSize: 20 }}>{group.emoji}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.text0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {group.name}
                </div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>
                  {group.members} membros
                </div>
              </div>
              <Toggle
                on={group.active}
                onChange={() =>
                  setGroups((previous) =>
                    previous.map((item) =>
                      item.id === group.id ? { ...item, active: !item.active } : item,
                    ),
                  )
                }
                label={`${group.active ? 'Desativar' : 'Ativar'} ${group.name}`}
              />
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <Card>
          <div style={{ fontSize: 18, color: C.text0, fontWeight: 600, marginBottom: 20 }}>
            Filtros de Captura
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label
                htmlFor="sliderMinVal"
                style={{ fontSize: 13, fontWeight: 600, color: C.text0 }}
              >
                Valor Mínimo (R$)
              </label>
              <span className="pb-mono" style={{ color: C.primary, fontWeight: 700, fontSize: 14 }}>
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
              onChange={(event) =>
                setPrefs((previous) => ({ ...previous, minVal: Number(event.target.value) }))
              }
              aria-valuetext={`R$ ${fmt(prefs.minVal)}`}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label
                htmlFor="sliderMaxDist"
                style={{ fontSize: 13, fontWeight: 600, color: C.text0 }}
              >
                Distância Máxima
              </label>
              <span className="pb-mono" style={{ color: C.text0, fontWeight: 700, fontSize: 14 }}>
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
              onChange={(event) =>
                setPrefs((previous) => ({ ...previous, maxDist: Number(event.target.value) }))
              }
              aria-valuetext={`${prefs.maxDist} km`}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text0, marginBottom: 12 }}>
              Dias Disponíveis
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DAYS.map((day) => {
                const enabled = prefs.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setPrefs((previous) => ({
                        ...previous,
                        days: enabled
                          ? previous.days.filter((item) => item !== day)
                          : [...previous.days, day],
                      }))
                    }
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: `1px solid ${enabled ? C.primary : C.border}`,
                      background: enabled ? C.primarySoft : C.surface1,
                      color: enabled ? C.primary : C.text2,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text0, marginBottom: 12 }}>
              Especialidades
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SPECS.map((specialty) => {
                const enabled = prefs.specs.includes(specialty);
                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() =>
                      setPrefs((previous) => ({
                        ...previous,
                        specs: enabled
                          ? previous.specs.filter((item) => item !== specialty)
                          : [...previous.specs, specialty],
                      }))
                    }
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: `1px solid ${enabled ? C.info : C.border}`,
                      background: enabled ? C.infoSoft : C.surface1,
                      color: enabled ? C.info : C.text2,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                  >
                    {specialty}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ fontSize: 18, color: C.text0, fontWeight: 600, marginBottom: 16 }}>
              Modo de Captura
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  value: true,
                  title: 'Automático',
                  description: 'O bot aceita e responde os plantões qualificados imediatamente.',
                },
                {
                  value: false,
                  title: 'Manual (Swipe)',
                  description: 'O bot pausa as oportunidades para sua revisão visual.',
                },
              ].map((option) => {
                const active = prefs.auto === option.value;
                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => setPrefs((previous) => ({ ...previous, auto: option.value }))}
                    style={{
                      border: `1px solid ${active ? C.primary : C.border}`,
                      borderRadius: 8,
                      background: active ? C.primarySoft : C.surface1,
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      transition: 'all .15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${active ? C.primary : C.borderStrong}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {active && (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: C.primary,
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: active ? C.primary : C.text0,
                        }}
                      >
                        {option.title}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: active ? C.primary : C.text2,
                          opacity: 0.8,
                        }}
                      >
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 18, color: C.text0, fontWeight: 600, marginBottom: 16 }}>
              Conta & Perfil
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
                paddingBottom: 20,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: C.surface2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 600,
                  color: C.text1,
                }}
              >
                {(name || 'M')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text0 }}>
                  {name || 'Dr(a). Médico'}
                </div>
                <div style={{ fontSize: 13, color: C.text2 }}>Plataforma configurada e pronta</div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setScreen('onboard');
                  setObStep(0);
                }}
              >
                Editar
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                type="button"
                variant="danger"
                onClick={onClearHistory}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Limpar Histórico Local
              </Button>
              {onLogout ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onLogout}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Sair da Conta
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
