import { useState } from 'react'
import { checkHealth } from '../utils/api'
import { isInsecure, normalizeBase } from '../utils/serverSettings'
import { Alert } from './ui'

// Where the backend is. Needed to upload bumps and to show the map.
export default function ServerSettings({ apiBase, onChange }) {
  const [text, setText] = useState(apiBase)
  const [status, setStatus] = useState({ bad: false, message: '' })

  const typed = normalizeBase(text)

  const save = () => {
    if (text.trim() && !typed) {
      setStatus({ bad: true, message: 'The address must start with https:// (or http://).' })
      return
    }
    onChange(typed)
    setText(typed)
    setStatus({ bad: false, message: typed ? 'Saved on this phone.' : 'Server address cleared.' })
  }

  const test = async () => {
    if (!typed) {
      setStatus({ bad: true, message: 'Type the server address first.' })
      return
    }
    setStatus({ bad: false, message: 'Contacting the server. A sleeping free server can take a minute.' })
    try {
      await checkHealth(typed)
      onChange(typed)
      setStatus({ bad: false, message: 'Connected. The server works and the address is saved.' })
    } catch (e) {
      setStatus({ bad: true, message: e.message })
    }
  }

  return (
    <section>
      <details open={!apiBase}>
        <summary>
          <span>Server address</span>
          <span className="muted">{apiBase ? 'set' : 'not set'}</span>
        </summary>
        <div>
          <p className="muted small">
            The https:// address of the SmoothRoute backend. It is needed to upload rides and to
            load the map, and it is remembered on this phone.
          </p>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://your-backend.example.com"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            aria-label="Server address"
          />
          {isInsecure(typed) && (
            <Alert>On a phone the address must start with https://. A plain http:// address to another computer is blocked by the browser.</Alert>
          )}
          <div className="inline-actions">
            <button className="textbtn" onClick={save}>Save</button>
            <button className="textbtn" onClick={test}>Test connection</button>
          </div>
          {status.message && (status.bad ? <Alert bad>{status.message}</Alert> : <p>{status.message}</p>)}
        </div>
      </details>
    </section>
  )
}
