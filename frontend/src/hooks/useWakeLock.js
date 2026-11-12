import { useEffect } from 'react'

// Keeps the screen on while `active` is true. Without this the phone sleeps
// and the browser stops the sensors. The browser drops the lock whenever the
// page is hidden, so we ask for it again when the page becomes visible.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined

    let lock = null
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // e.g. low battery mode: nothing we can do, keep going
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (lock) lock.release().catch(() => {})
    }
  }, [active])
}
