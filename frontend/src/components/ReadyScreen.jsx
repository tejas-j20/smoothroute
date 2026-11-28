import { ActionBar, Alert } from './ui'
import LiveReadout from './LiveReadout'
import RoughnessTrace from './RoughnessTrace'
import DetectionSettings from './DetectionSettings'
import ServerSettings from './ServerSettings'

export default function ReadyScreen({
  live, trace, traceThreshold, noMotion,
  meta, onMeta,
  settings, onSettings,
  apiBase, onApiBase,
  saved, onStart,
}) {
  const set = (k) => (e) => onMeta({ ...meta, [k]: e.target.value })
  return (
    <main className="page">
      <section>
        <h1>Ready to record</h1>
        <p>Shake the phone and watch the line jump. Start once the GPS accuracy is about 20 m or better.</p>
        <RoughnessTrace trace={trace} threshold={traceThreshold} />
        <LiveReadout live={live} />
        {noMotion && (
          <Alert bad>
            No motion data yet. Allow motion sensors for this site in the browser settings, or try
            another browser.
          </Alert>
        )}
      </section>

      <DetectionSettings settings={settings} onChange={onSettings} />

      <section>
        <h2>This ride</h2>
        <div className="fields">
          <label className="field">Phone model
            <input value={meta.phone} onChange={set('phone')} placeholder="for example Redmi Note 11" />
          </label>
          <label className="field">How the phone is placed
            <select value={meta.mount} onChange={set('mount')}>
              <option value="holder">Fixed in a holder</option>
              <option value="mat">Flat on a non-slip mat</option>
              <option value="hand">Held in hand</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">Vehicle
            <input value={meta.vehicle} onChange={set('vehicle')} placeholder="scooter, car, bicycle" />
          </label>
          <label className="field">Road or route
            <input value={meta.road} onChange={set('road')} placeholder="for example campus main road" />
          </label>
        </div>
      </section>

      <ServerSettings apiBase={apiBase} onChange={onApiBase} />
      {saved}

      <ActionBar>
        <button className="primary" onClick={onStart}>Start recording</button>
      </ActionBar>
    </main>
  )
}
