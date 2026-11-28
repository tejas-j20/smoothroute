import { useEffect, useState } from 'react'
import SpotsMap from './SpotsMap'
import ServerSettings from './ServerSettings'
import { Alert } from './ui'
import { fetchClusters } from '../utils/api'
import { SEVERITY_COLORS } from '../utils/marks'

// Every rough spot reported by everyone, from the backend.
export default function MapPage({ apiBase, onApiBaseChange }) {
  const [filters, setFilters] = useState({ confirmedOnly: false, minSeverity: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [state, setState] = useState({ status: 'loading', spots: [], error: '', at: null })

  useEffect(() => {
    if (!apiBase) return undefined
    let cancelled = false
    fetchClusters(apiBase, {
      minReports: filters.confirmedOnly ? 2 : 1,
      minSeverity: filters.minSeverity,
    })
      .then((spots) => {
        if (!cancelled) setState({ status: 'ok', spots, error: '', at: Date.now() })
      })
      .catch((e) => {
        if (!cancelled) setState((s) => ({ ...s, status: 'error', error: e.message }))
      })
    return () => {
      cancelled = true
    }
  }, [apiBase, filters, refreshKey])

  const count = (severity) => state.spots.filter((s) => s.severity === severity).length
  const confirmed = state.spots.filter((s) => s.confirmed).length

  return (
    <main className="page">
      <section>
        <h1>Roughness map</h1>

        {!apiBase ? (
          <Alert>Set the server address below to load the map.</Alert>
        ) : (
          <>
            {state.status === 'error' && <Alert bad>{state.error}</Alert>}
            {state.status === 'loading' && <p>Loading. A sleeping free server can take a minute.</p>}
            {state.status === 'ok' && (
              <p>
                {state.spots.length} {state.spots.length === 1 ? 'spot' : 'spots'}, {confirmed} confirmed.
                Updated {new Date(state.at).toLocaleTimeString()}.
                {state.spots.length === 0 && ' Nothing here yet. Upload a ride first.'}
              </p>
            )}

            <SpotsMap spots={state.spots} />

            <div className="legend">
              {Object.entries(SEVERITY_COLORS).map(([k, c]) => (
                <span key={k} style={{ '--c': c }}>{k} ({count(k)})</span>
              ))}
            </div>
            <p className="muted small">
              A bigger circle means more reports. A solid circle is confirmed by 2 or more reports, a
              light one was reported once. Tap a circle for details. The map needs internet.
            </p>

            <div className="fields">
              <label className="check">
                <input
                  type="checkbox"
                  checked={filters.confirmedOnly}
                  onChange={(e) => setFilters({ ...filters, confirmedOnly: e.target.checked })}
                />
                Confirmed spots only
              </label>
              <label className="field">Show
                <select
                  value={filters.minSeverity}
                  onChange={(e) => setFilters({ ...filters, minSeverity: e.target.value })}
                >
                  <option value="">All severities</option>
                  <option value="moderate">Moderate and severe</option>
                  <option value="severe">Severe only</option>
                </select>
              </label>
            </div>
            <div className="inline-actions">
              <button className="textbtn" onClick={() => setRefreshKey((k) => k + 1)}>Refresh the map</button>
            </div>
          </>
        )}
      </section>

      <ServerSettings apiBase={apiBase} onChange={onApiBaseChange} />
    </main>
  )
}
