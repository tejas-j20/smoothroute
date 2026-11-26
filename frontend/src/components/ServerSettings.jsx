import { useState } from 'react'
import { checkHealth } from '../utils/api'
import { isInsecure, normalizeBase } from '../utils/serverSettings'

// Where the backend is. Needed to upload bumps and to show the public map.
export default function ServerSettings({ apiBase, onChange }) {
  const [text, setText] = useState(apiBase)
  const [status, setStatus] = useState({ kind: '', message: '' })

  const typed = normalizeBase(text)

  const save = () => {
    if (text.trim() && !typed) {
      setStatus({ kind: 'warn', message: 'The address must start with https:// (or http://).' })
      return
    }
    onChange(typed)
    setText(typed)
    setStatus({ kind: 'ok', message: typed ? 'Saved on this phone.' : 'Server address cleared.' })
  }

  const test = async () => {
    if (!typed) {
      setStatus({ kind: 'warn', message: 'Type the server address first.' })
      return
    }
    setStatus({ kind: 'busy', message: 'Contacting the server (a sleeping free server can take a minute)...' })
    try {
      await checkHealth(typed)
      onChange(typed)
      setStatus({ kind: 'ok', message: 'Connected. The server is working and the address is saved.' })
    } catch (e) {
      setStatus({ kind: 'warn', message: e.message })
    }
  }

  return (
    <details className="card server" open={!apiBase}>
      <summary>Server address {apiBase ? '(connected setting saved)' : '(needed to upload and see the map)'}</summary>
      <p className="hint">
        The address of the SmoothRoute backend, for example the https:// link from your
        tunnel or hosting. It is remembered on this phone.
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="https://your-backend.example.com"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
      />
      {isInsecure(typed) && (
        <p className="warn">
          On a phone this must start with https://. A plain http:// address to another
          computer is blocked by the browser.
        </p>
      )}
      <div className="presets">
        <button className="small" onClick={save}>Save</button>
        <button className="small" onClick={test}>Test connection</button>
      </div>
      {status.message && <p className={status.kind === 'warn' ? 'warn' : 'hint'}>{status.message}</p>}
    </details>
  )
}
