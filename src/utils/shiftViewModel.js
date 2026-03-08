export function toShiftViewModel(shift) {
  if (!shift) {
    return null;
  }

  return {
    id: shift.id,
    hospital: shift.hospital,
    group: shift.group,
    sender: shift.sender,
    avatar: shift.av,
    specialty: shift.spec,
    value: shift.val,
    dateLabel: shift.date,
    hours: shift.hours,
    location: shift.loc,
    distanceKm: shift.dist,
    rawMessage: shift.rawMsg,
    rivals: shift.rivals || [],
    score: shift.sc ?? null,
    accepted: shift.ok === true,
    rejected: shift.ok === false,
    state: shift.state || null,
    timestamp: shift.ts || null,
    isOffer: Boolean(shift.isOffer),
    source: 'mock',
    original: shift,
  };
}

export function fromShiftViewModel(viewModel) {
  if (!viewModel) {
    return null;
  }

  if (viewModel.original) {
    return {
      ...viewModel.original,
      sc: viewModel.score ?? viewModel.original.sc,
      ok: viewModel.accepted ? true : viewModel.rejected ? false : viewModel.original.ok,
      state: viewModel.state ?? viewModel.original.state,
      ts: viewModel.timestamp ?? viewModel.original.ts,
    };
  }

  return {
    id: viewModel.id,
    hospital: viewModel.hospital,
    group: viewModel.group,
    sender: viewModel.sender,
    av: viewModel.avatar,
    spec: viewModel.specialty,
    val: viewModel.value,
    date: viewModel.dateLabel,
    hours: viewModel.hours,
    loc: viewModel.location,
    dist: viewModel.distanceKm,
    rawMsg: viewModel.rawMessage,
    rivals: viewModel.rivals || [],
    sc: viewModel.score,
    ok: viewModel.accepted ? true : viewModel.rejected ? false : undefined,
    state: viewModel.state,
    ts: viewModel.timestamp,
    isOffer: viewModel.isOffer,
  };
}

export function normalizeShiftCollection(collection = []) {
  return collection.map((item) => toShiftViewModel(item));
}
