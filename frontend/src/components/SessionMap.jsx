import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { routePoints } from '../utils/route'
import { MARK_TYPES, SEVERITY_COLORS } from '../utils/marks'

const TYPE_INFO = Object.fromEntries(MARK_TYPES.map((t) => [t.key, t]))

// Draws the route as a blue line, each bump you marked as a filled dot, and each bump
// the app found automatically as a ring (green = minor, amber = moderate, red = severe).
// Leaflet is used directly (no wrapper library) to keep the dependencies small.
export default function SessionMap({ samples, marks, detections = [] }) {
  const box = useRef(null)

  useEffect(() => {
    const map = L.map(box.current)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const layers = []
    const points = routePoints(samples)
    if (points.length > 1) {
      layers.push(L.polyline(points, { color: '#1585c7', weight: 4 }).addTo(map))
    } else if (points.length === 1) {
      layers.push(L.circleMarker(points[0], { radius: 5, color: '#1585c7' }).addTo(map))
    }

    detections
      .filter((d) => d.lat != null && d.lng != null)
      .forEach((d) => {
        const ring = L.circleMarker([d.lat, d.lng], {
          radius: 15,
          color: SEVERITY_COLORS[d.severity] || '#333333',
          weight: 5,
          fill: false,
        }).addTo(map)
        ring.bindPopup(
          `Detected: ${d.severity}<br>value ${Number(d.value).toFixed(2)}<br>${new Date(d.t).toLocaleTimeString()}`,
        )
        layers.push(ring)
      })

    marks
      .filter((m) => m.lat != null && m.lng != null)
      .forEach((m) => {
        const info = TYPE_INFO[m.type]
        const dot = L.circleMarker([m.lat, m.lng], {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: info ? info.color : '#333333',
          fillOpacity: 1,
        }).addTo(map)
        dot.bindPopup(`Marked: ${info ? info.label : m.type}<br>${new Date(m.t).toLocaleTimeString()}`)
        layers.push(dot)
      })

    if (layers.length > 0) {
      map.fitBounds(L.featureGroup(layers).getBounds().pad(0.2), { maxZoom: 19 })
    } else {
      map.setView([20.5937, 78.9629], 4) // India, if there is nothing to show
    }

    return () => map.remove()
  }, [samples, marks, detections])

  return <div ref={box} className="map" />
}
