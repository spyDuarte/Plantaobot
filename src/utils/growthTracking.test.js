import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GROWTH_METRICS,
  areGrowthMetricsEqual,
  hasInviteQueryParams,
  hasValidReferralCode,
  normalizeGrowthMetrics,
  normalizeReferralCode,
} from './growthTracking';

describe('growthTracking utils', () => {
  it('normalizeGrowthMetrics retorna default para input inválido', () => {
    expect(normalizeGrowthMetrics(null)).toEqual(DEFAULT_GROWTH_METRICS);
    expect(normalizeGrowthMetrics([])).toEqual(DEFAULT_GROWTH_METRICS);
  });

  it('migra shape antigo (v1) com share_clicked para intent e ready', () => {
    const result = normalizeGrowthMetrics({ share_clicked: 4, invite_accepted: 1 });

    expect(result).toEqual({
      schemaVersion: 3,
      share_intent: 4,
      share_clicked: 4,
      invite_accepted: 1,
    });
  });

  it('migra shape intermediário (v2) com share_ready', () => {
    const result = normalizeGrowthMetrics({ share_clicked: 7, share_ready: 5, invite_accepted: 2 });

    expect(result).toEqual({
      schemaVersion: 3,
      share_intent: 7,
      share_clicked: 5,
      invite_accepted: 2,
    });
  });

  it('preserva shape atual (v3)', () => {
    const result = normalizeGrowthMetrics({
      schemaVersion: 3,
      share_intent: 8,
      share_clicked: 6,
      invite_accepted: 3,
    });

    expect(result).toEqual({
      schemaVersion: 3,
      share_intent: 8,
      share_clicked: 6,
      invite_accepted: 3,
    });
  });

  it('normaliza referral code e validade mínima', () => {
    expect(normalizeReferralCode('  Dr-Ana  ')).toBe('dr-ana');
    expect(hasValidReferralCode('abc12')).toBe(false);
    expect(hasValidReferralCode(' abc123 ')).toBe(true);
  });

  it('identifica params de convite mesmo sem ref', () => {
    expect(hasInviteQueryParams(new URLSearchParams('utm_source=captured_share'))).toBe(true);
    expect(hasInviteQueryParams(new URLSearchParams('ref_name=Joao'))).toBe(true);
    expect(hasInviteQueryParams(new URLSearchParams('a=1&b=2'))).toBe(false);
  });

  it('compara métricas por shape normalizado', () => {
    expect(
      areGrowthMetricsEqual(
        { share_clicked: 5, share_ready: 3, invite_accepted: 1 },
        { schemaVersion: 3, share_intent: 5, share_clicked: 3, invite_accepted: 1 },
      ),
    ).toBe(true);
  });
});
