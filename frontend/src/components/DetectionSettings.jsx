import { PRESETS } from '../utils/settings'

// A number box that saves when you leave it. `key` makes it start again from the saved value.
function NumberField({ label, value, step, onCommit }) {
  return (
    <label className="field">
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
    </label>
  )
}

export default function DetectionSettings({ settings, onChange }) {
  const normalised = settings.mode === 'normalised'
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <section>
      <h2>Detection</h2>
      <div className="inline-actions">
        <button className="textbtn" onClick={() => onChange({ ...PRESETS.ride })}>Use vehicle ride values</button>
        <button className="textbtn" onClick={() => onChange({ ...PRESETS.walk })}>Use walking test values</button>
      </div>

      <div className="fields">
        <label className="field">Measure
          <select value={settings.mode} onChange={(e) => set({ mode: e.target.value })}>
            <option value="plain">Jolt</option>
            <option value="normalised">Jolt divided by speed</option>
          </select>
        </label>

        {normalised ? (
          <NumberField
            label="Threshold (jolt per m/s of speed)"
            value={settings.thresholdNorm}
            step="0.05"
            onCommit={(v) => set({ thresholdNorm: v })}
          />
        ) : (
          <NumberField
            label="Threshold (jolt in m/s²)"
            value={settings.threshold}
            step="0.1"
            onCommit={(v) => set({ threshold: v })}
          />
        )}

        <NumberField
          label="Minimum speed (km/h)"
          value={Math.round(settings.minSpeed * 3.6 * 10) / 10}
          step="1"
          onCommit={(v) => set({ minSpeed: v / 3.6 })}
        />
        <NumberField
          label="Pause after a bump (seconds)"
          value={settings.pause}
          step="0.1"
          onCommit={(v) => set({ pause: v })}
        />
      </div>

      <p className="muted small">
        Starting values come from research papers. Raise the threshold if you get false alarms,
        lower it if bumps are missed. Slower readings than the minimum speed are ignored.
      </p>
    </section>
  )
}
