import { useCallback, useRef, useState } from 'react'
import { distanceMeters } from '../utils/geo'

// Asks for location permission (shows the browser prompt).
export function requestLocationPermission() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve('unsupported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
}

// Keeps the newest GPS fix in a ref (not state) so fast sensor code can read it
// without re-rendering the page.
export function useGeolocation() {
  const latest = useRef(null) // { t, lat, lng, acc, speed, speedSource }
  const watchId = useRef(null)
  const [status, setStatus] = useState('idle')

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (watchId.current != null) return
    setStatus('waiting')
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords
        const t = pos.timestamp
        const prev = latest.current
        let spd = speed
        let speedSource = 'gps'
        // Some phones give no speed: work it out from the last two fixes.
        if (spd == null || Number.isNaN(spd)) {
          spd = null
          speedSource = 'none'
          if (prev) {
            const dt = (t - prev.t) / 1000
            if (dt > 0) {
              spd = distanceMeters(prev.lat, prev.lng, latitude, longitude) / dt
              speedSource = 'derived'
            }
          }
        }
        latest.current = { t, lat: latitude, lng: longitude, acc: accuracy, speed: spd, speedSource }
        setStatus('ok')
      },
      (err) => setStatus(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )
  }, [])

  const stop = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    latest.current = null
    setStatus('idle')
  }, [])

  return { latest, status, start, stop }
}
