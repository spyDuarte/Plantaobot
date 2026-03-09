import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedTab from './FeedTab.jsx';

const makeMessage = (overrides = {}) => ({
  id: 'msg-1',
  sender: 'Dr. Silva',
  group: 'Grupo A',
  av: 'D',
  ts: '14:30',
  rawMsg: 'Mensagem de texto',
  isOffer: false,
  state: 'done',
  ...overrides,
});

const makeOffer = (overrides = {}) => ({
  id: 'offer-1',
  sender: 'Dr. Carlos',
  group: 'Grupo B',
  av: 'C',
  ts: '15:00',
  rawMsg: 'Plantão UTI - Sex - R$2.000',
  isOffer: true,
  state: 'done',
  sc: 85,
  ok: true,
  hospital: 'Hospital Central',
  val: 2000,
  date: 'Sex 07/03',
  hours: '12h',
  dist: 10,
  spec: 'UTI',
  ...overrides,
});

function renderFeedTab(overrides = {}) {
  const props = {
    uiV2: true,
    botOn: false,
    feed: [],
    typing: null,
    setModal: vi.fn(),
    feedRef: { current: null },
    setTab: vi.fn(),
    ...overrides,
  };

  return { ...render(<FeedTab {...props} />), props };
}

describe('FeedTab', () => {
  it('exibe estado vazio "Bot inativo" quando feed está vazio e bot está desligado', () => {
    renderFeedTab({ botOn: false, feed: [] });
    expect(screen.getByText('Bot inativo')).toBeInTheDocument();
  });

  it('exibe estado de espera quando bot está ativo mas feed vazio', () => {
    renderFeedTab({ botOn: true, feed: [] });
    expect(screen.getByText('Aguardando mensagens')).toBeInTheDocument();
  });

  it('exibe botão de configuração quando bot ativo e feed vazio', () => {
    const setTab = vi.fn();
    renderFeedTab({ botOn: true, feed: [], setTab });
    fireEvent.click(screen.getByRole('button', { name: 'Configurar WhatsApp' }));
    expect(setTab).toHaveBeenCalledWith('settings');
  });

  it('renderiza mensagens do feed', () => {
    const feed = [makeMessage({ rawMsg: 'Mensagem de teste grupo' })];
    renderFeedTab({ feed });
    expect(screen.getByText('Mensagem de teste grupo')).toBeInTheDocument();
    expect(screen.getByText('Dr. Silva')).toBeInTheDocument();
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
  });

  it('renderiza ofertas de plantão com score e botão de detalhes', () => {
    const feed = [makeOffer()];
    renderFeedTab({ feed });
    expect(screen.getByText('Dr. Carlos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detalhes' })).toBeInTheDocument();
  });

  it('abre modal ao clicar em "Detalhes" de uma oferta', () => {
    const setModal = vi.fn();
    const offer = makeOffer();
    renderFeedTab({ feed: [offer], setModal });

    fireEvent.click(screen.getByRole('button', { name: 'Detalhes' }));

    expect(setModal).toHaveBeenCalledTimes(1);
    expect(setModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'offer-1' }));
  });

  it('exibe badge "Analisando" para oferta com state=scanning', () => {
    const feed = [makeOffer({ state: 'scanning' })];
    renderFeedTab({ feed });
    expect(screen.getByText('Analisando')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Detalhes' })).not.toBeInTheDocument();
  });

  it('exibe indicador de digitação quando typing está definido', () => {
    renderFeedTab({ typing: 'Grupo A', feed: [] });
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('[digitando]')).toBeInTheDocument();
  });

  it('não exibe indicador de digitação quando typing é null', () => {
    renderFeedTab({ typing: null });
    expect(screen.queryByText('[digitando]')).not.toBeInTheDocument();
  });

  it('exibe badge "Ao vivo" quando bot está ativo', () => {
    renderFeedTab({ botOn: true, feed: [makeMessage()] });
    expect(screen.getByText('Ao vivo')).toBeInTheDocument();
  });

  it('exibe badge "Pausado" quando bot está inativo', () => {
    renderFeedTab({ botOn: false, feed: [makeMessage()] });
    expect(screen.getByText('Pausado')).toBeInTheDocument();
  });

  it('renderiza múltiplas mensagens em ordem', () => {
    const feed = [
      makeMessage({ id: 'msg-1', sender: 'Dr. A', rawMsg: 'Mensagem A' }),
      makeMessage({ id: 'msg-2', sender: 'Dr. B', rawMsg: 'Mensagem B' }),
    ];
    renderFeedTab({ feed });
    expect(screen.getByText('Dr. A')).toBeInTheDocument();
    expect(screen.getByText('Dr. B')).toBeInTheDocument();
    expect(screen.getByText('Mensagem A')).toBeInTheDocument();
    expect(screen.getByText('Mensagem B')).toBeInTheDocument();
  });
});
