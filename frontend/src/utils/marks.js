// The kinds of bump you can mark by hand. Used by the buttons and by the map.
export const MARK_TYPES = [
  { key: 'speed_breaker', label: 'Speed breaker', color: '#7A5C00' },
  { key: 'pothole', label: 'Pothole', color: '#B3261E' },
  { key: 'rough_patch', label: 'Rough patch', color: '#1D5DA8' },
]

// Colours for detected bumps and map spots: green = minor, amber = moderate, red = severe.
export const SEVERITY_COLORS = {
  minor: '#2E7D4F',
  moderate: '#E08A00',
  severe: '#C62828',
}
