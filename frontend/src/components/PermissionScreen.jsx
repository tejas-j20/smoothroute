import { ActionBar, Alert, Row } from './ui'

const words = {
  granted: 'allowed',
  denied: 'denied',
  unsupported: 'not supported on this device',
  unavailable: 'allowed, no position yet',
}

export default function PermissionScreen({ perm, busy, onAllow, children }) {
  const insecure = !window.isSecureContext
  return (
    <main className="page">
      <section>
        <h1>Record road roughness with your phone</h1>
        <p>
          Fix the phone in the vehicle and ride. The page reads the motion sensor and GPS, finds
          the bumps, and lets you share them on a map.
        </p>
        <p>
          <b>Saved:</b> motion, location, speed and time. <b>Never saved:</b> camera, microphone,
          your name or number. Nothing leaves the phone until you upload a ride.
        </p>
      </section>

      {insecure && (
        <Alert bad>
          This page is not using HTTPS, so the phone will not give out motion data. Open it
          through the https:// link.
        </Alert>
      )}

      {perm.motion !== 'unknown' && (
        <section>
          <dl className="rows">
            <Row label="Motion sensor" value={words[perm.motion]} />
            <Row label="Location" value={words[perm.location]} />
          </dl>
          {perm.motion === 'denied' && (
            <Alert bad>
              iPhone: close this tab, open the link again and tap Allow, or check Settings, Safari,
              Motion &amp; Orientation Access.
            </Alert>
          )}
          {perm.location === 'denied' && (
            <Alert bad>Location is blocked. Allow it for this site in the browser settings, then reload.</Alert>
          )}
        </section>
      )}

      {children}

      <ActionBar>
        <button className="primary" onClick={onAllow} disabled={busy}>
          {busy ? 'Waiting for permission' : 'Allow motion and location'}
        </button>
      </ActionBar>
    </main>
  )
}
