const DEFAULT_GROWTH_METRICS = {
  schemaVersion: 3,
  share_intent: 0,
  share_clicked: 0,
  invite_accepted: 0,
};

function toMetric(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isNormalizedMetricField(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Math.round(value) === value;
}

export function normalizeReferralCode(value) {
  return String(value || "").trim().toLowerCase();
}

export function hasValidReferralCode(value) {
  return normalizeReferralCode(value).length >= 6;
}

export function hasInviteQueryParams(searchParams) {
  if (!searchParams) {
    return false;
  }

  return searchParams.has("ref") || searchParams.has("ref_name") || searchParams.has("utm_source");
}

export function normalizeGrowthMetrics(input) {
  if (!isRecord(input)) {
    return { ...DEFAULT_GROWTH_METRICS };
  }

  const schemaVersion = Number(input.schemaVersion || 0);
  const inviteAccepted = toMetric(input.invite_accepted);

  if (schemaVersion >= 3) {
    return {
      ...DEFAULT_GROWTH_METRICS,
      schemaVersion: 3,
      share_intent: toMetric(input.share_intent),
      share_clicked: toMetric(input.share_clicked),
      invite_accepted: inviteAccepted,
    };
  }

  if (input.share_ready != null) {
    return {
      ...DEFAULT_GROWTH_METRICS,
      share_intent: toMetric(input.share_clicked),
      share_clicked: toMetric(input.share_ready),
      invite_accepted: inviteAccepted,
    };
  }

  const legacyReady = toMetric(input.share_clicked);
  return {
    ...DEFAULT_GROWTH_METRICS,
    share_intent: legacyReady,
    share_clicked: legacyReady,
    invite_accepted: inviteAccepted,
  };
}

export function isNormalizedGrowthMetrics(input) {
  if (!isRecord(input) || Number(input.schemaVersion) !== 3) {
    return false;
  }

  return (
    isNormalizedMetricField(input.share_intent)
    && isNormalizedMetricField(input.share_clicked)
    && isNormalizedMetricField(input.invite_accepted)
  );
}

export function areGrowthMetricsEqual(left, right) {
  const normalizedLeft = normalizeGrowthMetrics(left);
  const normalizedRight = normalizeGrowthMetrics(right);

  return (
    normalizedLeft.schemaVersion === normalizedRight.schemaVersion
    && normalizedLeft.share_intent === normalizedRight.share_intent
    && normalizedLeft.share_clicked === normalizedRight.share_clicked
    && normalizedLeft.invite_accepted === normalizedRight.invite_accepted
  );
}

export { DEFAULT_GROWTH_METRICS };
