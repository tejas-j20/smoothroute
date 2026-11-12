const label = {
  unknown: '',
  granted: 'Allowed',
  denied: 'Denied',
  unsupported: 'Not supported on this device',
  unavailable: 'Allowed, but no location yet',
}

export default function PermissionScreen({ perm, busy, onAllow }) {
  const insecure = !window.isSecureContext
  return (
    <div className="card">
      <h1>SmoothRoute Recorder</h1>
      <p>
        This page records your phone&apos;s <b>motion</b> and <b>location</b> while you
        travel, so we can study how rough a road is.
      </p>
      <ul>
        <li>Only motion, location, speed and time are saved.</li>
        <li>No camera, no microphone, no name.</li>
        <li>Data stays on your phone until you download it.</li>
      </ul>

      {insecure && (
        <p className="warn">
          This page is not using HTTPS, so the phone will not give motion data.
          Open it through the HTTPS tunnel link.
        </p>
      )}

      <button className="primary" onClick={onAllow} disabled={busy}>
        {busy ? 'Waiting for permission...' : 'Allow motion and location'}
      </button>

      {perm.motion !== 'unknown' && (
        <p>
          Motion: <b>{label[perm.motion]}</b>
          <br />
          Location: <b>{label[perm.location]}</b>
        </p>
      )}
      {perm.motion === 'denied' && (
        <p className="warn">
          iPhone: close this tab, reopen the link and tap Allow again, or check
          Settings, Safari, Motion &amp; Orientation Access.
        </p>
      )}
      {perm.location === 'denied' && (
        <p className="warn">
          Location is blocked. Allow it for this site in your browser settings,
          then reload.
        </p>
      )}
    </div>
  )
}
