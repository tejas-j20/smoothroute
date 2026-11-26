// Turns the bumps detected during a ride into the messages the backend expects.
// Backend contract (POST /api/readings/batch):
//   [{ lat, lng, speed (m/s), value, mode ('plain'|'normalised'), accuracy, time (ms), deviceId }]
export const MAX_ACCURACY_M = 50 // a bump found with a worse GPS fix is not uploaded

const round = (v, digits) => Number(Number(v).toFixed(digits))

export function buildUploadItems(result, deviceId) {
  const mode = result.settings && result.settings.mode === 'normalised' ? 'normalised' : 'plain'
  const items = []
  let skipped = 0
  for (const d of result.detections || []) {
    const noPlace = d.lat == null || d.lng == null
    const noSpeed = d.speed == null || !Number.isFinite(d.speed)
    const badValue = !Number.isFinite(d.value)
    const poorGps = d.acc != null && d.acc > MAX_ACCURACY_M
    if (noPlace || noSpeed || badValue || poorGps) {
      skipped += 1
      continue
    }
    items.push({
      lat: d.lat,
      lng: d.lng,
      speed: round(d.speed, 3),
      value: round(d.value, 4),
      mode,
      accuracy: d.acc == null ? null : round(d.acc, 1),
      time: d.t,
      deviceId,
    })
  }
  return { items, skipped }
}

// Splits a list into pieces of at most `size` items.
export function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
