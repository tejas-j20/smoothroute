import { useEffect, useState } from 'react'
import SessionMap from './SessionMap'
import UploadPanel from './UploadPanel'
import { ActionBar, Alert, Row } from './ui'
import { MARK_TYPES, SEVERITY_COLORS } from '../utils/marks'
import { routePoints } from '../utils/route'
import { matchByTime, matchByDistance } from '../utils/matching'
import { listSessions } from '../utils/storage'

const pct = (x) => `${Math.round(x * 100)}%`

function describeSettings(s) {
  if (!s) return 'The detection settings were not recorded for this ride.'
  const norm = s.mode === 'normalised'
  return `Detection used ${norm ? 'jolt divided by speed' : 'plain jolt'}, threshold ${
    norm ? s.thresholdNorm : `${s.threshold} m/s²`
  }, minimum speed ${Math.round(s.minSpeed * 3.6)} km/h, pause ${s.pause} s.`
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

  // Other saved rides that have marks can act as the answer key (for example a survey walk).
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
    how = 'Matched by time: a detection counts if it happened up to 2 seconds before the tap or half a second after.'
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
    <main className="page">
      <section>
        <h1>{interrupted ? 'Recovered ride' : 'Ride summary'}</h1>
        {interrupted && (
          <Alert>
            This ride was interrupted because the page was reloaded or closed. It shows everything
            saved up to the last autosave.
          </Alert>
        )}
        <dl className="rows">
          <Row label="Started" value={new Date(startedAt).toLocaleString()} />
          <Row label="Duration" value={`${Math.round(seconds)} s`} />
          <Row label="Readings" value={`${samples.length}, about ${perSecond} per second`} />
          <Row label="Bumps marked by hand" value={marks.length} />
          <Row
            label="Bumps detected"
            value={
              detections.length === 0
                ? 0
                : `${detections.length} (${bySeverity.map((s) => `${s.n} ${s.k}`).join(', ')})`
            }
          />
        </dl>
      </section>

      <section>
        <h2>Detection check</h2>
        {marks.length === 0 && (
          <label className="field">
            Compare with the marks of another saved ride, such as a survey walk
            <select value={refId} onChange={(e) => setRefId(e.target.value)}>
              <option value="">Choose a ride</option>
              {references.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.startedAt).toLocaleString()}, {(r.marks || []).length} marks
                </option>
              ))}
            </select>
          </label>
        )}
        {comparison ? (
          <>
            <p className="verdict">
              <b>{comparison.found} of {comparison.total}</b> marked bumps were found
              {comparison.rate == null ? '' : ` (${pct(comparison.rate)})`}.{' '}
              <b>{comparison.falseAlarms.length}</b> false {comparison.falseAlarms.length === 1 ? 'alarm' : 'alarms'},{' '}
              <b>{comparison.missed.length}</b> missed.
            </p>
            <p className="muted small">
              {how} A false alarm can also be a real bump you did not mark.
            </p>
          </>
        ) : (
          marks.length === 0 && <p>This ride has no marks, so choose another ride above to compare with.</p>
        )}
        <p className="muted small">{describeSettings(result.settings)}</p>
      </section>

      <UploadPanel result={result} apiBase={apiBase} deviceId={deviceId} onUploaded={onUploaded} />

      <section>
        <h2>Route</h2>
        {hasPosition ? (
          <>
            <SessionMap samples={samples} marks={marks} detections={detections} />
            <div className="legend">
              {MARK_TYPES.map((t) => (
                <span key={t.key} style={{ '--c': t.color }}>
                  {t.label} marked ({marks.filter((m) => m.type === t.key).length})
                </span>
              ))}
              {Object.entries(SEVERITY_COLORS).map(([k, c]) => (
                <span key={k} className="ring" style={{ '--c': c }}>detected {k}</span>
              ))}
            </div>
            <p className="muted small">Filled dots are bumps you marked. Rings are bumps the app found. The map needs internet.</p>
          </>
        ) : (
          <Alert>
            No GPS positions were recorded, so there is no route to draw. This happens on a laptop,
            or before the GPS gets a fix.
          </Alert>
        )}
      </section>

      <ActionBar>
        <button className="secondary" onClick={onDownload}>Download CSV</button>
        <button className="secondary" onClick={onClose}>Done</button>
      </ActionBar>
    </main>
  )
}
