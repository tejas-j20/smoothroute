// A short rolling history of how hard the phone is shaking, for the live trace.
// It is for display only (the detector does its own, stricter calculation).
// Each reading is stored as its "jolt": the distance from the slow-moving average.
export function createTrace(size = 400) {
  return { size, values: new Float32Array(size), next: 0, filled: 0, baseline: null, lastT: null }
}

export function pushTrace(trace, strength, timeMs) {
  if (typeof strength !== 'number' || Number.isNaN(strength)) return
  if (trace.baseline === null) trace.baseline = strength
  const dt = trace.lastT == null ? 0 : Math.max(0, (timeMs - trace.lastT) / 1000)
  trace.baseline += (dt / (1 + dt)) * (strength - trace.baseline) // about one second of memory
  trace.lastT = timeMs
  trace.values[trace.next] = Math.abs(strength - trace.baseline)
  trace.next = (trace.next + 1) % trace.size
  if (trace.filled < trace.size) trace.filled += 1
}

// The stored jolts, oldest first.
export function traceValues(trace) {
  const out = []
  const start = trace.filled < trace.size ? 0 : trace.next
  for (let i = 0; i < trace.filled; i++) out.push(trace.values[(start + i) % trace.size])
  return out
}
