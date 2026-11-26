import { useEffect, useState } from 'react'
import SpotsMap from './SpotsMap'
import ServerSettings from './ServerSettings'
import { fetchClusters } from '../utils/api'
import { SEVERITY_COLORS } from '../utils/marks'

// The public map screen: all rough spots reported by everyone, from the backend.
export default function MapPage({ apiBase, onBack, onApiBaseChange }) {
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
    <>
      <div className="card">
        <h1>Road roughness map</h1>

        {!apiBase ? (
          <p className="warn">Set the server address below to load the map.</p>
        ) : (
          <>
            <div className="filters">
              <label className="inline">
                <input
                  type="checkbox"
                  checked={filters.confirmedOnly}
                  onChange={(e) => setFilters({ ...filters, confirmedOnly: e.target.checked })}
                />
                Confirmed only (2 or more reports)
              </label>
              <label>Show
                <select
                  value={filters.minSeverity}
                  onChange={(e) => setFilters({ ...filters, minSeverity: e.target.value })}
                >
                  <option value="">All severities</option>
                  <option value="moderate">Moderate and severe</option>
                  <option value="severe">Severe only</option>
                </select>
              </label>
              <button className="small" onClick={() => setRefreshKey((k) => k + 1)}>Refresh</button>
            </div>

            {state.status === 'error' && <p className="warn">{state.error}</p>}
            {state.status === 'loading' && (
              <p className="hint">Loading (a sleeping free server can take a minute)...</p>
            )}
            {state.status === 'ok' && (
              <p className="hint">
                {state.spots.length} {state.spots.length === 1 ? 'spot' : 'spots'} ({confirmed} confirmed).
                Updated {new Date(state.at).toLocaleTimeString()}.
                {state.spots.length === 0 && ' Nothing here yet: upload a ride first.'}
              </p>
            )}

            <SpotsMap spots={state.spots} />

            <div className="legend">
              {Object.entries(SEVERITY_COLORS).map(([k, c]) => (
                <span key={k}>
                  <i style={{ background: c }} />
                  {k} ({count(k)})
                </span>
              ))}
            </div>
            <p className="hint">
              Bigger circle = more reports. Solid = confirmed by 2 or more reports, light = reported
              once. Tap a circle for details. The map needs internet.
            </p>
          </>
        )}

        <button className="link" onClick={onBack}>Back to the recorder</button>
      </div>

      <ServerSettings apiBase={apiBase} onChange={onApiBaseChange} />
    </>
  )
}
