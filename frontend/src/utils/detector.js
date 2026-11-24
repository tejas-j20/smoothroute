// Automatic bump detection, one reading at a time (works live while recording).
//
// Steps for every reading (the same ideas as the research papers):
//   1. BASELINE   the middle value (median) of the last second of readings.
//                 This is the normal background shaking (and gravity, if included).
//   2. JOLT       how far this reading is from the baseline.
//   3. SPEED      ignore readings when the vehicle is slow or the speed is unknown.
//   4. NORMALISE  (optional) divide the jolt by the speed, so fast and slow rides compare fairly.
//   5. THRESHOLD  above the threshold = a bump starts. We then watch a short window
//                 (0.3 s) and keep the BIGGEST value as the bump's strength and place.
//   6. PAUSE      after a bump, ignore new ones for `pause` seconds (the phone keeps
//                 wobbling after a hit, and we must not count one pothole several times).
const BASELINE_S = 1.0 // length of the "recent readings" used for the baseline
const WINDOW_S = 0.3   // how long we look for the peak after a bump starts
const MIN_BASELINE_READINGS = 5

export function severityOf(value, threshold) {
  const ratio = value / threshold
  if (ratio >= 2.5) return 'severe'
  if (ratio >= 1.5) return 'moderate'
  return 'minor'
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Sample shape: { t (ms), strength, speed (m/s or null), lat, lng, acc }
// Detection shape: { t (ms of the peak), value, jolt, speed, lat, lng, acc, severity }
export function createDetector(settings) {
  const normalised = settings.mode === 'normalised'
  const threshold = normalised ? settings.thresholdNorm : settings.threshold
  const recent = [] // { t (s), v }
  let lastStart = -Infinity
  let pending = null

  const finish = () => {
    const p = pending
    pending = null
    return {
      t: p.t,
      value: p.value,
      jolt: p.jolt,
      speed: p.speed,
      lat: p.lat,
      lng: p.lng,
      acc: p.acc,
      severity: severityOf(p.value, threshold),
    }
  }

  return {
    push(s) {
      const out = []
      if (typeof s.strength !== 'number' || Number.isNaN(s.strength)) return out
      const t = s.t / 1000

      recent.push({ t, v: s.strength })
      while (recent.length > 0 && t - recent[0].t > BASELINE_S) recent.shift()

      const baseline = recent.length >= MIN_BASELINE_READINGS ? median(recent.map((r) => r.v)) : s.strength
      const jolt = Math.abs(s.strength - baseline)

      const speedOk = s.speed != null && s.speed >= settings.minSpeed
      let value = 0
      if (speedOk) {
        value = normalised ? jolt / Math.max(s.speed, settings.minSpeed || 0.1) : jolt
      }

      if (pending) {
        if (value > pending.value) {
          Object.assign(pending, { t: s.t, value, jolt, speed: s.speed, lat: s.lat, lng: s.lng, acc: s.acc })
        }
        if (t - pending.start >= WINDOW_S) out.push(finish())
      } else if (speedOk && value > threshold && t - lastStart >= settings.pause) {
        lastStart = t
        pending = { start: t, t: s.t, value, jolt, speed: s.speed, lat: s.lat, lng: s.lng, acc: s.acc }
      }
      return out
    },

    // Call when recording stops, to close a bump that is still being measured.
    flush() {
      return pending ? [finish()] : []
    },
  }
}
