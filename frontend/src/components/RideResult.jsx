import SessionMap from './SessionMap'
import { MARK_TYPES } from '../utils/marks'
import { routePoints } from '../utils/route'

// Shown after a ride finishes, and when you open a saved ride.
export default function RideResult({ result, onDownload, onClose }) {
  const { samples, marks, startedAt, endedAt } = result
  const seconds = Math.max(0, (endedAt - startedAt) / 1000)
  const perSecond = seconds > 0 ? Math.round(samples.length / seconds) : 0
  const hasPosition =
    routePoints(samples).length > 0 || marks.some((m) => m.lat != null && m.lng != null)
  const interrupted = result.status !== 'finished'

  return (
    <div className="card">
      <h1>{interrupted ? 'Recovered ride' : 'Ride summary'}</h1>
      {interrupted && (
        <p className="hint">
          This ride was interrupted (the page was reloaded or closed). It shows
          everything saved up to the last autosave.
        </p>
      )}
      <ul>
        <li>Started: <b>{new Date(startedAt).toLocaleString()}</b></li>
        <li>Duration: <b>{Math.round(seconds)} s</b></li>
        <li>Readings: <b>{samples.length}</b> (about {perSecond} per second)</li>
        <li>Bumps marked: <b>{marks.length}</b></li>
      </ul>

      {hasPosition ? (
        <>
          <SessionMap samples={samples} marks={marks} />
          <div className="legend">
            {MARK_TYPES.map((t) => (
              <span key={t.key}>
                <i style={{ background: t.color }} />
                {t.label} ({marks.filter((m) => m.type === t.key).length})
              </span>
            ))}
          </div>
          <p className="hint">The map needs internet to load. The blue line is your route.</p>
        </>
      ) : (
        <p className="warn">
          No GPS positions were recorded, so there is no route to draw (this
          happens on a laptop or before GPS gets a fix).
        </p>
      )}

      <button className="primary" onClick={onDownload}>Download CSV</button>
      <button className="link" onClick={onClose}>Back</button>
    </div>
  )
}
