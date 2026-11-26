import { useState } from 'react'
import { uploadDetections } from '../utils/api'
import { buildUploadItems } from '../utils/upload'

// Sends the bumps found during a ride to the backend, so they appear on the public map.
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
    <div className="upload">
      <h2>Share with the map</h2>
      <p className="hint">
        <b>{items.length}</b> detected {items.length === 1 ? 'bump is' : 'bumps are'} ready to upload
        {skipped > 0 && ` (${skipped} skipped: no GPS fix or poor accuracy)`}. Only the place, strength,
        speed, time and a random anonymous phone id are sent. No name, no video.
      </p>

      {!apiBase && <p className="warn">Set the server address first (on the first screen).</p>}

      <button
        className="primary"
        onClick={upload}
        disabled={state.busy || !apiBase || items.length === 0}
      >
        {state.busy ? 'Uploading (a sleeping server can take a minute)...' : 'Upload to the server'}
      </button>

      {state.error && <p className="warn">{state.error}</p>}
      {state.done && (
        <p className="success">
          Uploaded: {state.done.saved} saved{state.done.rejected > 0 ? `, ${state.done.rejected} rejected` : ''}.
          Open the map to see it.
        </p>
      )}
      {!state.done && earlier && (
        <p className="hint">
          Last upload: {new Date(earlier.at).toLocaleString()} ({earlier.saved} saved). Uploading
          again is safe: the server ignores bumps it already has.
        </p>
      )}
    </div>
  )
}
