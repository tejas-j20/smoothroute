// Turns the recorded readings into the list of GPS points for the route line.
// Every motion reading carries the newest GPS fix, so the same position repeats
// dozens of times; we keep a point only when it changes. Readings without a
// position (GPS not ready yet) are skipped.
export function routePoints(samples) {
  const points = []
  for (const s of samples) {
    if (s.lat == null || s.lng == null) continue
    const last = points[points.length - 1]
    if (last && last[0] === s.lat && last[1] === s.lng) continue
    points.push([s.lat, s.lng])
  }
  return points
}
