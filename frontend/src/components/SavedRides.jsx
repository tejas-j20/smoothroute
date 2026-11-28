import { useEffect, useState } from 'react'
import { listSessions } from '../utils/storage'

// Rides autosaved on this phone, for this website address.
export default function SavedRides({ refreshKey, onOpen, onDownload, onDelete }) {
  const [rides, setRides] = useState([])

  useEffect(() => {
    let cancelled = false
    listSessions()
      .then((list) => {
        if (!cancelled) setRides(list)
      })
      .catch(() => {
        if (!cancelled) setRides([])
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (rides.length === 0) return null

  return (
    <section>
      <h2>Saved rides</h2>
      <ul className="list">
        {rides.map((r) => (
          <li key={r.id}>
            <b>{new Date(r.startedAt).toLocaleString()}</b>
            <span className="muted small">
              {r.sampleCount} readings, {(r.marks || []).length} marked, {(r.detections || []).length} detected
              {r.meta && r.meta.vehicle ? `, ${r.meta.vehicle}` : ''}.
              {r.status !== 'finished' ? ' Interrupted.' : ''}
              {r.uploaded ? ' Uploaded.' : ''}
            </span>
            <span className="inline-actions">
              <button className="textbtn" onClick={() => onOpen(r.id)}>Open</button>
              <button className="textbtn" onClick={() => onDownload(r.id)}>Download CSV</button>
              <button className="textbtn bad" onClick={() => onDelete(r.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
