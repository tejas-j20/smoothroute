// Detection settings: the numbers that decide what counts as a bump.
// These are STARTING VALUES taken from the research (about 0.2 g to 0.4 g, which is
// roughly 2 to 4 m/s^2). Tune them from your own rides.
export const DEFAULT_SETTINGS = {
  mode: 'plain',       // 'plain' = raw jolt, 'normalised' = jolt divided by speed
  threshold: 3.0,      // plain mode: jolt (m/s^2) above which a reading is a bump
  thresholdNorm: 0.5,  // normalised mode: jolt per m/s of speed (units: 1/s)
  minSpeed: 3.0,       // m/s (about 11 km/h): slower readings are ignored
  pause: 1.0,          // seconds to ignore new bumps after one is found
}

export const PRESETS = {
  ride: { ...DEFAULT_SETTINGS },
  walk: { ...DEFAULT_SETTINGS, minSpeed: 0.5 }, // for a walking test: allow slow speeds
}

const LIMITS = {
  threshold: [0.5, 30],
  thresholdNorm: [0.05, 10],
  minSpeed: [0, 30],
  pause: [0.5, 5],
}

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v))

// Turns anything (saved data, typed values) into a complete, valid settings object.
export function cleanSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw || {}) }
  const out = { mode: s.mode === 'normalised' ? 'normalised' : 'plain' }
  for (const key of Object.keys(LIMITS)) {
    const n = Number(s[key])
    out[key] = Number.isFinite(n) ? clamp(n, LIMITS[key]) : DEFAULT_SETTINGS[key]
  }
  return out
}

const KEY = 'smoothroute.settings'

export function loadSettings(storage = globalThis.localStorage) {
  try {
    const text = storage && storage.getItem(KEY)
    return cleanSettings(text ? JSON.parse(text) : null)
  } catch {
    return cleanSettings(null)
  }
}

export function saveSettings(settings, storage = globalThis.localStorage) {
  try {
    if (storage) storage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // private mode or storage full: the settings just won't be remembered
  }
}
