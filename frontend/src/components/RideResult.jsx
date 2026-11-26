import { useEffect, useState } from 'react'
import SessionMap from './SessionMap'
import UploadPanel from './UploadPanel'
import { MARK_TYPES, SEVERITY_COLORS } from '../utils/marks'
import { routePoints } from '../utils/route'
import { matchByTime, matchByDistance } from '../utils/matching'
import { listSessions } from '../utils/storage'

const pct = (x) => `${Math.round(x * 100)}%`

function describeSettings(s) {
  if (!s) return 'Settings were not recorded for this ride.'
  const norm = s.mode === 'normalised'
  return `${norm ? 'Jolt divided by speed' : 'Plain jolt'}, threshold ${
    norm ? s.thresholdNorm : s.threshold
  }${norm ? '' : ' m/s²'}, minimum speed ${Math.round(s.minSpeed * 3.6)} km/h, pause ${s.pause} s`
}

// Shown after a ride finishes, and when you open a saved ride.
export default function RideResult({ result, apiBase, deviceId, onUploaded, onDownload, onClose }) {
  const { samples, marks, detections, startedAt, endedAt } = result
  const seconds = Math.max(0, (endedAt - startedAt) / 1000)
  const perSecond = seconds > 0 ? Math.round(samples.length / seconds) : 0
  const hasPosition =
    routePoints(samples).length > 0 ||
    marks.some((m) => m.lat != null && m.lng != null) ||
    detections.some((d) => d.lat != null && d.lng != null)
  const interrupted = result.status !== 'finished'

  // Other saved rides that have marks: they can act as the "answer key" (for example a survey walk).
  const [references, setReferences] = useState([])
  const [refId, setRefId] = useState('')
  useEffect(() => {
    if (marks.length > 0) return undefined
    let cancelled = false
    listSessions()
      .then((list) => {
        if (!cancelled) setReferences(list.filter((r) => r.id !== result.id && (r.marks || []).length > 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [marks.length, result.id])

  let comparison = null
  let how = ''
  if (marks.length > 0) {
    comparison = matchByTime(detections, marks)
    how = 'Matched by time: a detection counts if it happened up to 2 s before the tap or 0.5 s after.'
  } else {
    const ref = references.find((r) => String(r.id) === refId)
    if (ref) {
      comparison = matchByDistance(detections, ref.marks, 20)
      how = 'Matched by place: a detection counts if it is within 20 m of a bump marked in the other ride.'
    }
  }

  const bySeverity = ['minor', 'moderate', 'severe'].map((k) => ({
    k,
    n: detections.filter((d) => d.severity === k).length,
  }))

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
        <li>Bumps marked by hand: <b>{marks.length}</b></li>
        <li>
          Bumps detected automatically: <b>{detections.length}</b>
          {detections.length > 0 &&
            ` (${bySeverity.map((s) => `${s.n} ${s.k}`).join(', ')})`}
        </li>
      </ul>

      <h2>Automatic detection check</h2>
      <p className="hint">{describeSettings(result.settings)}</p>

      {marks.length === 0 && (
        <label>Compare with marks from another saved ride (for example a survey walk)
          <select value={refId} onChange={(e) => setRefId(e.target.value)}>
            <option value="">Choose a ride...</option>
            {references.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.startedAt).toLocaleString()} ({(r.marks || []).length} marks)
              </option>
            ))}
          </select>
        </label>
      )}

      {comparison ? (
        <>
          <div className="grid">
            <div className="stat">
              <span>Marks found</span>
              <b>{comparison.found}/{comparison.total}</b>
              <small>{comparison.rate == null ? '' : pct(comparison.rate)} detection rate</small>
            </div>
            <div className="stat">
              <span>False alarms</span>
              <b>{comparison.falseAlarms.length}</b>
              <small>detected, but not marked</small>
            </div>
          </div>
          <p className="hint">
            Missed: {comparison.missed.length}. {how} A false alarm can also be a real
            bump you forgot to mark.
          </p>
        </>
      ) : (
        marks.length === 0 && (
          <p className="hint">
            No marks in this ride, so there is nothing to compare with yet. Choose another ride above.
          </p>
        )
      )}

      <UploadPanel result={result} apiBase={apiBase} deviceId={deviceId} onUploaded={onUploaded} />

      {hasPosition ? (
        <>
          <SessionMap samples={samples} marks={marks} detections={detections} />
          <div className="legend">
            {MARK_TYPES.map((t) => (
              <span key={t.key}>
                <i style={{ background: t.color }} />
                {t.label} ({marks.filter((m) => m.type === t.key).length})
              </span>
            ))}
          </div>
          <div className="legend">
            {Object.entries(SEVERITY_COLORS).map(([k, c]) => (
              <span key={k}>
                <i className="ring" style={{ borderColor: c }} />
                detected {k}
              </span>
            ))}
          </div>
          <p className="hint">Filled dots = marked by hand. Rings = found by the app. The map needs internet.</p>
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
