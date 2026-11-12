// Distance between two GPS points using the Haversine formula (result in metres).
const EARTH_RADIUS_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

// metres per second -> kilometres per hour (null stays null)
export const msToKmh = (v) => (v == null ? null : v * 3.6)
