import { PRESETS } from '../utils/settings'

// A number box that saves when you leave it. It starts again from the saved value
// whenever that value changes (the `key` makes React rebuild it).
function NumberField({ label, hint, value, step, onCommit }) {
  return (
    <label>
      {label}
      <input
        key={value}
        type="number"
        inputMode="decimal"
        step={step}
        defaultValue={value}
        onBlur={(e) => {
          const v = parseFloat(e.target.value)
          if (Number.isFinite(v)) onCommit(v)
          else e.target.value = value // ignore an empty or invalid entry
        }}
      />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

export default function DetectionSettings({ settings, onChange }) {
  const normalised = settings.mode === 'normalised'
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <div className="settings">
      <h2>Automatic detection</h2>
      <p className="hint">
        Starting values from research papers. Tune them after your first ride.
        You can still mark bumps by hand: the app compares the two afterwards.
      </p>

      <div className="presets">
        <button className="small" onClick={() => onChange({ ...PRESETS.ride })}>Vehicle ride</button>
        <button className="small" onClick={() => onChange({ ...PRESETS.walk })}>Walking test</button>
      </div>

      <label>Measure
        <select value={settings.mode} onChange={(e) => set({ mode: e.target.value })}>
          <option value="plain">Jolt (plain)</option>
          <option value="normalised">Jolt divided by speed (normalised)</option>
        </select>
      </label>

      {normalised ? (
        <NumberField
          label="Threshold (jolt per m/s of speed)"
          hint="Bigger = fewer bumps found"
          value={settings.thresholdNorm}
          step="0.05"
          onCommit={(v) => set({ thresholdNorm: v })}
        />
      ) : (
        <NumberField
          label="Threshold (jolt, m/s²)"
          hint="Bigger = fewer bumps found. Research suggests about 2 to 4."
          value={settings.threshold}
          step="0.1"
          onCommit={(v) => set({ threshold: v })}
        />
      )}

      <NumberField
        label="Minimum speed (km/h)"
        hint="Slower readings are ignored. Use a low value for a walking test."
        value={Math.round(settings.minSpeed * 3.6 * 10) / 10}
        step="1"
        onCommit={(v) => set({ minSpeed: v / 3.6 })}
      />
      <NumberField
        label="Pause between bumps (seconds)"
        hint="After a bump, new ones are ignored for this long."
        value={settings.pause}
        step="0.1"
        onCommit={(v) => set({ pause: v })}
      />
    </div>
  )
}
