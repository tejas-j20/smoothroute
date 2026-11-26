import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SEVERITY_COLORS } from '../utils/marks'

// Public map: every rough spot as a circle. Colour = severity, size = number of reports,
// solid = confirmed (reported at least twice), light = reported only once so far.
export default function SpotsMap({ spots }) {
  const box = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const fitted = useRef(false)

  // create the map once
  useEffect(() => {
    const map = L.map(box.current).setView([20.5937, 78.9629], 4)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
      fitted.current = false
    }
  }, [])

  // redraw the circles whenever the spots change
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    spots.forEach((s) => {
      const color = SEVERITY_COLORS[s.severity] || '#333333'
      const circle = L.circleMarker([s.lat, s.lng], {
        radius: 8 + Math.min(s.reports, 10),
        color,
        weight: 3,
        fillColor: color,
        fillOpacity: s.confirmed ? 0.65 : 0.15,
      }).addTo(layer)
      circle.bindPopup(
        `<b>${s.severity} spot</b><br>${s.reports} ${s.reports === 1 ? 'report' : 'reports'} ` +
          `(${s.confirmed ? 'confirmed' : 'not yet confirmed'})<br>` +
          `last reported ${new Date(s.lastSeen).toLocaleString()}`,
      )
    })

    if (spots.length > 0 && !fitted.current) {
      map.fitBounds(L.latLngBounds(spots.map((s) => [s.lat, s.lng])).pad(0.2), { maxZoom: 17 })
      fitted.current = true
    }
  }, [spots])

  return <div ref={box} className="map tall" />
}
