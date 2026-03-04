import { apiRequest, apiRequestOrNull } from "./apiClient.js";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInstance(input) {
  if (!input) {
    return null;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildDateLabel(date) {
  const instance = toDateInstance(date);
  if (!instance) {
    return "";
  }

  const dayName = DAY_LABELS[instance.getDay()];
  return `${dayName} ${pad(instance.getDate())}/${pad(instance.getMonth() + 1)}`;
}

function buildHourLabel(startAt, endAt, durationHours) {
  if (durationHours) {
    return `${durationHours}h`;
  }

  const start = toDateInstance(startAt);
  const end = toDateInstance(endAt);
  if (start && end) {
    const diffHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    return `${diffHours}h`;
  }

  return "-";
}

function formatTimeLabel(input) {
  const instance = toDateInstance(input);
  if (!instance) {
    return "";
  }

  return instance.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function normalizeShift(raw, { isOffer = true } = {}) {
  if (!raw) {
    return null;
  }

  const id = raw.id ?? raw.offerId ?? raw.shiftId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sender = raw.sender ?? raw.senderName ?? raw.origin ?? "Sistema";

  return {
    id,
    group: raw.group ?? raw.groupName ?? "Grupo não informado",
    sender,
    av: raw.av ?? raw.avatar ?? (sender.charAt(0).toUpperCase() || "S"),
    hospital: raw.hospital ?? raw.facility ?? raw.locationName ?? "Unidade não informada",
    spec: raw.spec ?? raw.specialty ?? "Clínica Geral",
    val: Number(raw.val ?? raw.value ?? raw.price ?? 0),
    date: raw.date ?? raw.dateLabel ?? buildDateLabel(raw.startAt ?? raw.datetime),
    hours: raw.hours ?? buildHourLabel(raw.startAt, raw.endAt, raw.durationHours),
    loc: raw.loc ?? raw.location ?? raw.city ?? "Local não informado",
    dist: Number(raw.dist ?? raw.distanceKm ?? raw.distance ?? 0),
    rawMsg: raw.rawMsg ?? raw.message ?? raw.description ?? "",
    rivals: raw.rivals ?? [],
    ts: (raw.ts ?? formatTimeLabel(raw.createdAt ?? raw.timestamp ?? raw.receivedAt)) || formatTimeLabel(new Date()),
    state: raw.state ?? "done",
    sc: raw.sc ?? raw.score,
    ok: raw.ok,
    isOffer,
    capturedAt: raw.capturedAt ? formatTimeLabel(raw.capturedAt) : raw.capturedAt,
    capturedAtISO: raw.capturedAt ?? raw.createdAt ?? raw.timestamp ?? null,
  };
}

function normalizeList(payload, normalizer) {
  if (!payload) {
    return [];
  }

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : [];

  return list.map((item) => normalizer(item)).filter(Boolean);
}

export async function fetchMonitorStatus() {
  const data = await apiRequestOrNull("/monitor/status");
  if (!data) {
    return { active: false, sessionId: null };
  }

  return {
    active: Boolean(data.active ?? data.running),
    sessionId: data.sessionId ?? data.id ?? null,
  };
}

export async function startMonitoring({ groups, prefs, operatorName }) {
  const payload = {
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      active: group.active,
    })),
    preferences: prefs,
    operatorName,
  };

  const data = await apiRequest("/monitor/start", {
    method: "POST",
    body: payload,
  });

  return {
    sessionId: data?.sessionId ?? data?.id ?? null,
  };
}

export async function stopMonitoring(sessionId) {
  await apiRequest("/monitor/stop", {
    method: "POST",
    body: { sessionId },
  });
}

export async function fetchFeed({ cursor, sessionId, groupIds }) {
  const data = await apiRequest("/monitor/feed", {
    query: {
      cursor,
      sessionId,
      groupId: groupIds,
    },
  });

  const items = normalizeList(data, (item) =>
    normalizeShift(item, {
      isOffer: item.isOffer ?? true,
    }),
  );

  return {
    items,
    cursor: data?.nextCursor ?? data?.cursor ?? null,
  };
}

export async function fetchCapturedOffers() {
  const data = await apiRequestOrNull("/captures");
  return normalizeList(data, (item) => normalizeShift(item, { isOffer: true }));
}

export async function fetchRejectedOffers() {
  const data = await apiRequestOrNull("/rejections");
  return normalizeList(data, (item) => normalizeShift(item, { isOffer: true }));
}

export async function captureOffer(shift, { sessionId, source = "manual" } = {}) {
  const data = await apiRequest("/captures", {
    method: "POST",
    body: {
      sessionId,
      source,
      offer: {
        id: shift.id,
        hospital: shift.hospital,
        group: shift.group,
        spec: shift.spec,
        val: shift.val,
        date: shift.date,
        hours: shift.hours,
        loc: shift.loc,
        dist: shift.dist,
        rawMsg: shift.rawMsg,
        score: shift.sc,
      },
    },
  });

  return normalizeShift(data?.item ?? data, { isOffer: true }) || shift;
}

export async function rejectOffer(shift, { sessionId, reason = "not_match" } = {}) {
  const data = await apiRequestOrNull("/rejections", {
    method: "POST",
    body: {
      sessionId,
      reason,
      offer: {
        id: shift.id,
        hospital: shift.hospital,
        group: shift.group,
        spec: shift.spec,
        val: shift.val,
        date: shift.date,
        hours: shift.hours,
        loc: shift.loc,
        dist: shift.dist,
        rawMsg: shift.rawMsg,
        score: shift.sc,
      },
    },
  });

  return normalizeShift(data?.item ?? data, { isOffer: true }) || shift;
}

export async function fetchPreferences() {
  const data = await apiRequestOrNull("/preferences");
  if (!data) {
    return null;
  }

  return data.preferences ?? data;
}

export async function savePreferences(preferences) {
  await apiRequest("/preferences", {
    method: "PUT",
    body: { preferences },
  });
}

export async function fetchGroups() {
  const data = await apiRequestOrNull("/groups");
  if (!data) {
    return null;
  }

  const groups = Array.isArray(data) ? data : data.groups;
  if (!Array.isArray(groups)) {
    return null;
  }

  return groups.map((group, index) => ({
    id: group.id ?? index + 1,
    name: group.name ?? "Grupo",
    members: Number(group.members ?? group.membersCount ?? 0),
    active: Boolean(group.active),
    emoji: group.emoji ?? "??",
  }));
}

export async function saveGroups(groups) {
  await apiRequest("/groups", {
    method: "PUT",
    body: {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        members: group.members,
        active: group.active,
        emoji: group.emoji,
      })),
    },
  });
}

export async function clearHistory() {
  const result = await apiRequestOrNull("/history", {
    method: "DELETE",
  });

  if (result !== null) {
    return;
  }

  await Promise.all([
    apiRequestOrNull("/captures", { method: "DELETE" }),
    apiRequestOrNull("/rejections", { method: "DELETE" }),
  ]);
}


