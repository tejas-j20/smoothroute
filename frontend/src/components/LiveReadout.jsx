import { Row } from './ui'
import { msToKmh } from '../utils/geo'

const none = 'no data'

// The numbers behind the live trace.
export default function LiveReadout({ live, recording = false, marksCount = 0 }) {
  const l = live || {}
  const mins = Math.floor((l.elapsed || 0) / 60)
  const secs = Math.floor((l.elapsed || 0) % 60)
  const speed = msToKmh(l.speed)
  const strength = l.strength == null ? none : `${l.strength.toFixed(2)} m/s²${l.gravity ? ' with gravity' : ''}`
  return (
    <dl className="rows">
      <Row label="Speed" value={speed == null ? none : `${Math.round(speed)} km/h`} />
      <Row label="Shake strength" value={strength} />
      <Row label="GPS accuracy" value={l.acc == null ? none : `${Math.round(l.acc)} m`} />
      <Row label="Sensor rate" value={l.rate == null || Number.isNaN(l.rate) ? none : `${Math.round(l.rate)} per second`} />
      {recording && <Row label="Bumps detected" value={`${l.detected ?? 0}${l.lastSeverity ? `, last ${l.lastSeverity}` : ''}`} />}
      {recording && <Row label="Bumps marked" value={marksCount} />}
      {recording && <Row label="Recording time" value={`${mins}:${String(secs).padStart(2, '0')}`} />}
      {recording && <Row label="Readings" value={l.count ?? 0} />}
    </dl>
  )
}
