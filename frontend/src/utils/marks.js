// The kinds of bump you can mark by hand. Used by the buttons and by the map.
export const MARK_TYPES = [
  { key: 'speed_breaker', label: 'Speed breaker', color: '#ef6c00' },
  { key: 'pothole', label: 'Pothole', color: '#c62828' },
  { key: 'rough_patch', label: 'Rough patch', color: '#6a1b9a' },
]

// Colours for the rings drawn around automatically detected bumps.
export const SEVERITY_COLORS = {
  minor: '#2e7d32',
  moderate: '#f9a825',
  severe: '#c62828',
}
