import { useState } from 'react'
import { uploadDetections } from '../utils/api'
import { buildUploadItems } from '../utils/upload'
import { Alert } from './ui'

// Sends the bumps found during a ride to the backend, so they appear on the map.
export default function UploadPanel({ result, apiBase, deviceId, onUploaded }) {
  const [state, setState] = useState({ busy: false, error: '', done: null })
  const { items, skipped } = buildUploadItems(result, deviceId)
  const earlier = result.uploaded

  const upload = async () => {
    setState({ busy: true, error: '', done: null })
    try {
      const sent = await uploadDetections(apiBase, items)
      const info = { at: Date.now(), saved: sent.saved, rejected: sent.rejected, skipped }
      setState({ busy: false, error: '', done: info })
      onUploaded(info)
    } catch (e) {
      setState({ busy: false, error: e.message, done: null })
    }
  }

  return (
    <section>
      <h2>Upload to the map</h2>
      <p>
        {items.length === 0
          ? 'No detected bump has a usable GPS fix, so there is nothing to upload.'
          : `${items.length} detected ${items.length === 1 ? 'bump' : 'bumps'} will be uploaded${
              skipped > 0 ? `. ${skipped} were skipped because of a missing or poor GPS fix` : ''
            }.`}
      </p>
      <p className="muted small">
        Only the place, strength, speed, time and a random anonymous phone id are sent.
      </p>

      {!apiBase && <Alert>Set the server address first.</Alert>}

      <button className="primary" onClick={upload} disabled={state.busy || !apiBase || items.length === 0}>
        {state.busy ? 'Uploading. A sleeping server can take a minute.' : 'Upload to the server'}
      </button>

      {state.error && <Alert bad>{state.error}</Alert>}
      {state.done && (
        <p className="good">
          Uploaded: {state.done.saved} saved{state.done.rejected > 0 ? `, ${state.done.rejected} rejected` : ''}.
          Open the map to see it.
        </p>
      )}
      {!state.done && earlier && (
        <p className="muted small">
          Last uploaded {new Date(earlier.at).toLocaleString()} ({earlier.saved} saved). Uploading again
          is safe: the server ignores bumps it already has.
        </p>
      )}
    </section>
  )
}
