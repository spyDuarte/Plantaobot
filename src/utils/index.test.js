import { describe, expect, it, vi, afterEach } from 'vitest';
import { calcScore, fmt, nowT } from './index';

describe('utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fmt deve formatar número no padrão pt-BR', () => {
    expect(fmt(1234567.89)).toBe('1.234.567,89');
  });

  it('nowT deve retornar hora e minuto no formato HH:mm', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-20T14:05:00'));

    expect(nowT()).toMatch(/^\d{2}:\d{2}$/);
  });

  it('calcScore soma pontos e retorna razões quando tudo bate', () => {
    const shift = {
      val: 1500,
      dist: 8,
      date: 'Seg 20/01',
      spec: 'clínica médica',
    };

    const preferences = {
      minVal: 1000,
      maxDist: 10,
      days: ['Seg'],
      specs: ['clínica médica'],
    };

    const { s, r } = calcScore(shift, preferences);

    expect(s).toBe(100);
    expect(r).toHaveLength(4);
    expect(r.every((item) => item.ok)).toBe(true);
  });

  it('calcScore suporta data ISO para identificar dia da semana', () => {
    const shift = {
      val: 1800,
      dist: 5,
      dateISO: '2025-01-20T07:00:00Z',
      spec: 'clínica médica',
    };

    const preferences = {
      minVal: 1000,
      maxDist: 10,
      days: ['Seg'],
      specs: ['clínica médica'],
    };

    const { s } = calcScore(shift, preferences);

    expect(s).toBe(100);
  });

  it('calcScore não soma pontos para critérios que falham', () => {
    const shift = {
      val: 600,
      dist: 30,
      date: 'Ter 21/01',
      spec: 'pediatria',
    };

    const preferences = {
      minVal: 1000,
      maxDist: 10,
      days: ['Seg'],
      specs: ['clínica médica'],
    };

    const { s, r } = calcScore(shift, preferences);

    expect(s).toBe(0);
    expect(r).toHaveLength(4);
    expect(r.every((item) => !item.ok)).toBe(true);
  });
});
