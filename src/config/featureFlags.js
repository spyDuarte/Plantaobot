const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isUiV2Enabled() {
  if (typeof window !== "undefined") {
    const localOverride = window.localStorage.getItem("pb_feature_ui_v2");
    if (localOverride != null) {
      return TRUE_VALUES.has(localOverride.toLowerCase());
    }
  }

  const envValue = import.meta.env.VITE_UI_V2;
  if (envValue == null) {
    return true;
  }

  return TRUE_VALUES.has(String(envValue).toLowerCase());
}

export function getFeatureFlags() {
  return {
    ui_v2: isUiV2Enabled(),
  };
}
