import { MARK_TYPES } from '../utils/marks'

export default function MarkPanel({ counts, total, onMark, onUndo }) {
  return (
    <section>
      <h2>Mark a bump</h2>
      <p className="muted">Tap right after you cross it. A passenger taps, never the rider or driver.</p>
      <div className="marklist">
        {MARK_TYPES.map((t) => (
          <button key={t.key} className="markbtn" style={{ '--c': t.color }} onClick={() => onMark(t.key)}>
            <span className="label">{t.label}</span>
            <span>{counts[t.key] || 0}</span>
          </button>
        ))}
      </div>
      <div className="inline-actions">
        <button className="textbtn" onClick={onUndo} disabled={total === 0}>Undo last mark</button>
      </div>
    </section>
  )
}
