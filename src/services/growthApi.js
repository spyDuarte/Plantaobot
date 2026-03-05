import { apiRequestOrNull } from "./apiClient.js";

export async function trackGrowthEvent(name, payload = {}) {
  if (!name) {
    return;
  }

  await apiRequestOrNull("/events", {
    method: "POST",
    body: {
      name,
      payload,
      timestamp: new Date().toISOString(),
    },
  });
}
