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
      date: '2025-01-20 07:00',
      spec: 'clínica médica',
    };

    const preferences = {
      minVal: 1000,
      maxDist: 10,
      days: ['2025-01-20'],
      specs: ['clínica médica'],
    };

    const { s, r } = calcScore(shift, preferences);

    expect(s).toBe(100);
    expect(r).toHaveLength(4);
    expect(r.every(item => item.ok)).toBe(true);
  });

  it('calcScore não soma pontos para critérios que falham', () => {
    const shift = {
      val: 600,
      dist: 30,
      date: '2025-01-21 07:00',
      spec: 'pediatria',
    };

    const preferences = {
      minVal: 1000,
      maxDist: 10,
      days: ['2025-01-20'],
      specs: ['clínica médica'],
    };

    const { s, r } = calcScore(shift, preferences);

    expect(s).toBe(0);
    expect(r).toHaveLength(4);
    expect(r.every(item => !item.ok)).toBe(true);
  });
});
