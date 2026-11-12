export const MARK_TYPES = [
  { key: 'speed_breaker', label: 'Speed breaker' },
  { key: 'pothole', label: 'Pothole' },
  { key: 'rough_patch', label: 'Rough patch' },
]

export default function MarkPanel({ onMark, onUndo, marksCount }) {
  return (
    <div>
      <p className="hint">
        Tap right after you cross a bump. A passenger should do the tapping,
        never the rider or driver.
      </p>
      <div className="marks">
        {MARK_TYPES.map((t) => (
          <button key={t.key} className="mark" onClick={() => onMark(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <button className="link" onClick={onUndo} disabled={marksCount === 0}>
        Undo last mark
      </button>
    </div>
  )
}
