import { useEffect, useState } from 'react'
import { listSessions } from '../utils/storage'

// List of rides autosaved on this phone, for this website address.
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
    <div className="card saved">
      <h2>Saved rides on this phone</h2>
      {rides.map((r) => (
        <div className="ride" key={r.id}>
          <div>
            <b>{new Date(r.startedAt).toLocaleString()}</b>
            {r.status !== 'finished' && <span className="badge">interrupted</span>}
            {r.uploaded && <span className="badge good">uploaded</span>}
            <br />
            <small>
              {r.sampleCount} readings, {(r.marks || []).length} marks, {(r.detections || []).length} detected
              {r.meta && r.meta.vehicle ? `, ${r.meta.vehicle}` : ''}
            </small>
          </div>
          <div className="ride-actions">
            <button className="small" onClick={() => onOpen(r.id)}>Map</button>
            <button className="small" onClick={() => onDownload(r.id)}>CSV</button>
            <button className="small danger" onClick={() => onDelete(r.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
