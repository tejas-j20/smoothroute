// Where the backend lives, and this phone's anonymous id.
// The address can come from the app (typed in, remembered on the phone) or from the
// VITE_API_URL environment variable set when the site is built (for example on Vercel).
const API_KEY = 'smoothroute.apiBase'
const DEVICE_KEY = 'smoothroute.deviceId'

// "https://my-server.com/" -> "https://my-server.com". Returns '' for anything that is not an http(s) address.
export function normalizeBase(text) {
  const trimmed = String(text ?? '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\/[^\s/]+/i.test(trimmed)) return ''
  return trimmed
}

// A phone cannot use plain http:// for another computer (browsers block it from an https page).
export function isInsecure(base) {
  return /^http:\/\//i.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(base)
}

export function loadApiBase(storage = globalThis.localStorage, envValue = readEnv()) {
  try {
    const saved = storage && storage.getItem(API_KEY)
    if (saved) return normalizeBase(saved)
  } catch {
    // storage blocked: fall through to the built-in address
  }
  return normalizeBase(envValue)
}

export function saveApiBase(base, storage = globalThis.localStorage) {
  try {
    if (!storage) return
    if (base) storage.setItem(API_KEY, base)
    else storage.removeItem(API_KEY)
  } catch {
    // not remembered
  }
}

function readEnv() {
  try {
    return import.meta.env ? import.meta.env.VITE_API_URL : ''
  } catch {
    return ''
  }
}

// A random id made once per phone. It is NOT linked to a name or number; the server uses it to
// recognise a bump that was sent twice.
export function getDeviceId(storage = globalThis.localStorage, makeId = randomId) {
  try {
    const saved = storage && storage.getItem(DEVICE_KEY)
    if (saved) return saved
    const fresh = makeId()
    if (storage) storage.setItem(DEVICE_KEY, fresh)
    return fresh
  } catch {
    return makeId()
  }
}

function randomId() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
