import { MARK_TYPES } from '../utils/marks'

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
