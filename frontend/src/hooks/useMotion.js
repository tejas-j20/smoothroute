import { useEffect } from 'react'

// iPhones (iOS 13+) only give motion data after the user allows it, and the
// request must run directly inside a tap. Other browsers return 'granted'.
export async function requestMotionPermission() {
  const DME = window.DeviceMotionEvent
  if (!DME) return 'unsupported'
  if (typeof DME.requestPermission === 'function') {
    try {
      const result = await DME.requestPermission()
      return result === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }
  return 'granted'
}

// Listens to the phone's motion sensor while `active` is true and calls
// onSample() with one reading each time the sensor fires.
export function useMotion(active, onSample) {
  useEffect(() => {
    if (!active) return undefined

    const handler = (e) => {
      // Prefer acceleration WITHOUT gravity; fall back to the version with gravity.
      const linear = e.acceleration
      const withGravity = e.accelerationIncludingGravity
      const hasLinear =
        linear && linear.x != null && linear.y != null && linear.z != null
      const src = hasLinear ? linear : withGravity
      if (!src || src.x == null || src.y == null || src.z == null) return

      const { x, y, z } = src
      onSample({
        t: Date.now(),
        ax: x,
        ay: y,
        az: z,
        strength: Math.sqrt(x * x + y * y + z * z), // one number, any phone angle
        gravity: !hasLinear, // true means the value includes gravity (about 9.8)
      })
    }

    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [active, onSample])
}
