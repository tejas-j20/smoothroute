import { useEffect, useRef } from 'react'
import { traceValues } from '../utils/trace'
import { drawTrace } from '../utils/traceDraw'

const LIGHT = { line: '#2A3034', threshold: '#C62828' }
const DARK = { line: '#F2C200', threshold: '#FF8A80' }

// Live picture of how hard the phone is shaking over the last few seconds.
// The dashed line is your detection threshold: a spike that crosses it is counted as a bump.
export default function RoughnessTrace({ trace, threshold, dark = false }) {
  const canvas = useRef(null)
  const latest = useRef({ threshold, dark })

  // keep the newest props where the animation loop can read them
  useEffect(() => {
    latest.current = { threshold, dark }
  }, [threshold, dark])

  useEffect(() => {
    let frame = 0
    const draw = () => {
      const el = canvas.current
      if (el) {
        const ratio = window.devicePixelRatio || 1
        const w = el.clientWidth
        const h = el.clientHeight
        if (el.width !== Math.round(w * ratio) || el.height !== Math.round(h * ratio)) {
          el.width = Math.round(w * ratio)
          el.height = Math.round(h * ratio)
        }
        const ctx = el.getContext('2d')
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        const { threshold: t, dark: isDark } = latest.current
        drawTrace(ctx, w, h, traceValues(trace), t, isDark ? DARK : LIGHT)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [trace])

  return (
    <canvas
      ref={canvas}
      className="trace"
      role="img"
      aria-label="Live graph of how hard the phone is shaking. Spikes above the dashed line are counted as bumps."
    />
  )
}
