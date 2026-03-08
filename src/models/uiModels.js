function normalizeSeverity(severity) {
  if (!severity) {
    return 'info';
  }

  const normalized = String(severity).toLowerCase();
  if (['success', 'info', 'warning', 'error'].includes(normalized)) {
    return normalized;
  }

  if (normalized === 'win') {
    return 'success';
  }

  return 'info';
}

function legacyType(severity) {
  if (severity === 'success') {
    return 'win';
  }
  if (severity === 'error') {
    return 'error';
  }
  return 'info';
}

export function createToast({
  id,
  title,
  message,
  severity = 'info',
  timestamp,
  source = 'system',
}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const resolvedTimestamp = timestamp || new Date().toISOString();

  return {
    id,
    title,
    message,
    severity: normalizedSeverity,
    timestamp: resolvedTimestamp,
    source,
    body: message,
    type: legacyType(normalizedSeverity),
    time: resolvedTimestamp,
  };
}

export function createNotification({
  id,
  title,
  message,
  severity = 'info',
  timestamp,
  source = 'bot',
}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const resolvedTimestamp = timestamp || new Date().toISOString();

  return {
    id,
    title,
    message,
    severity: normalizedSeverity,
    timestamp: resolvedTimestamp,
    source,
    body: message,
    type: legacyType(normalizedSeverity),
    time: resolvedTimestamp,
  };
}

export function createNavItem({
  key,
  label,
  icon,
  badgeCount = 0,
  route,
  mobileVisible = true,
  desktopVisible = true,
}) {
  return {
    key,
    label,
    icon,
    badgeCount,
    route,
    mobileVisible,
    desktopVisible,
  };
}
