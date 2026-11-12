import { msToKmh } from '../utils/geo'

const show = (v, digits = 1, unit = '') =>
  v == null || Number.isNaN(v) ? '-' : `${v.toFixed(digits)}${unit}`

export default function LiveReadout({ live, marksCount, recording }) {
  const l = live || {}
  const mins = Math.floor((l.elapsed || 0) / 60)
  const secs = Math.floor((l.elapsed || 0) % 60)
  return (
    <div className="grid">
      <div className="stat">
        <span>Shake strength</span>
        <b>{show(l.strength, 2)}</b>
        <small>m/s&sup2;{l.gravity ? ' (includes gravity)' : ''}</small>
      </div>
      <div className="stat">
        <span>Speed</span>
        <b>{show(msToKmh(l.speed), 0)}</b>
        <small>km/h</small>
      </div>
      <div className="stat">
        <span>GPS accuracy</span>
        <b>{show(l.acc, 0)}</b>
        <small>metres (lower is better)</small>
      </div>
      <div className="stat">
        <span>Sensor rate</span>
        <b>{show(l.rate, 0)}</b>
        <small>readings per second</small>
      </div>
      <div className="stat">
        <span>Readings</span>
        <b>{recording ? l.count ?? 0 : '-'}</b>
        <small>{recording ? `${mins}:${String(secs).padStart(2, '0')}` : 'not recording'}</small>
      </div>
      <div className="stat">
        <span>Bumps marked</span>
        <b>{marksCount}</b>
        <small>by hand</small>
      </div>
    </div>
  )
}
