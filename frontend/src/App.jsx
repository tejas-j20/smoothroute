import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import PermissionScreen from './components/PermissionScreen'
import LiveReadout from './components/LiveReadout'
import MarkPanel from './components/MarkPanel'
import RideResult from './components/RideResult'
import SavedRides from './components/SavedRides'
import { requestMotionPermission, useMotion } from './hooks/useMotion'
import { requestLocationPermission, useGeolocation } from './hooks/useGeolocation'
import { useWakeLock } from './hooks/useWakeLock'
import { toCsv, downloadText, csvFilename } from './utils/csv'
import { saveSession, saveChunk, loadSession, deleteSession } from './utils/storage'

const AUTOSAVE_MS = 5000

// Turns a ride (just finished, or loaded from storage) into what the result screen shows.
function buildResult(session, samples) {
  const lastTime = samples.length ? samples[samples.length - 1].t : session.startedAt
  return {
    id: session.id,
    status: session.status,
    meta: session.meta || {},
    startedAt: session.startedAt,
    endedAt: session.endedAt ?? lastTime,
    samples,
    marks: session.marks || [],
  }
}

function downloadResult(r) {
  const csv = toCsv({ ...r.meta, startedAt: r.startedAt, endedAt: r.endedAt }, r.samples, r.marks)
  downloadText(csvFilename(r.startedAt), csv)
}

export default function App() {
  // permission -> ready -> recording -> result
  const [phase, setPhase] = useState('permission')
  const [backPhase, setBackPhase] = useState('ready')
  const [perm, setPerm] = useState({ motion: 'unknown', location: 'unknown' })
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState({ phone: '', mount: 'holder', vehicle: '', road: '' })
  const [live, setLive] = useState(null)
  const [marksCount, setMarksCount] = useState(0)
  const [result, setResult] = useState(null)
  const [savedKey, setSavedKey] = useState(0) // bump this to reload the saved-rides list
  const [storageOk, setStorageOk] = useState(true)

  // Data lives in refs: the sensor fires dozens of times a second and storing
  // it in React state would make the page lag.
  const samples = useRef([])
  const marks = useRef([])
  const recordingRef = useRef(false)
  const latestMotion = useRef(null)
  const motionCount = useRef(0)
  const startedAt = useRef(0)
  const metaRef = useRef(meta)
  const sessionRef = useRef(null) // { id, savedCount, chunkSeq } for the ride being recorded
  const saveQueue = useRef(Promise.resolve()) // saves run one after another

  const geo = useGeolocation()
  const sensorsOn = phase === 'ready' || phase === 'recording'
  const recording = phase === 'recording'

  // Called for every motion reading: attach the newest GPS fix and store it.
  const onSample = useCallback(
    (s) => {
      const g = geo.latest.current
      const row = {
        ...s,
        lat: g ? g.lat : null,
        lng: g ? g.lng : null,
        acc: g ? g.acc : null,
        speed: g ? g.speed : null,
        speedSource: g ? g.speedSource : '',
      }
      latestMotion.current = row
      motionCount.current += 1
      if (recordingRef.current) samples.current.push(row)
    },
    [geo.latest],
  )

  useMotion(sensorsOn, onSample)
  useWakeLock(recording)

  // Autosave: write the readings that are new since the last save, plus the
  // small ride record (notes, marks, status). Saves are queued so two never overlap.
  const persist = useCallback((status, endedAt = null) => {
    const sess = sessionRef.current
    if (!sess) return Promise.resolve()
    const job = {
      rows: samples.current,
      marks: marks.current.slice(),
      meta: metaRef.current,
      startedAt: startedAt.current,
    }
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const fresh = job.rows.slice(sess.savedCount)
        if (fresh.length > 0) {
          await saveChunk(sess.id, sess.chunkSeq, fresh)
          sess.chunkSeq += 1
          sess.savedCount += fresh.length
        }
        await saveSession({
          id: sess.id,
          startedAt: job.startedAt,
          endedAt,
          status,
          meta: job.meta,
          marks: job.marks,
          sampleCount: sess.savedCount,
        })
        setStorageOk(true)
      } catch {
        setStorageOk(false)
      }
    })
    return saveQueue.current
  }, [])

  // While recording: save every few seconds, and also when the page is hidden.
  useEffect(() => {
    if (!recording) return undefined
    const id = setInterval(() => persist('recording'), AUTOSAVE_MS)
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist('recording')
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [recording, persist])

  // GPS runs in "ready" too, so a good fix exists before recording starts.
  useEffect(() => {
    if (!sensorsOn) return undefined
    geo.start()
    return () => geo.stop()
  }, [sensorsOn, geo.start, geo.stop]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh the on-screen numbers twice a second (not on every sensor event).
  useEffect(() => {
    if (!sensorsOn) return undefined
    let lastCount = motionCount.current
    let lastTime = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const rate = (motionCount.current - lastCount) / ((now - lastTime) / 1000)
      lastCount = motionCount.current
      lastTime = now
      const m = latestMotion.current
      const g = geo.latest.current
      setLive({
        strength: m && now - m.t < 2000 ? m.strength : null,
        gravity: m ? m.gravity : false,
        rate,
        count: samples.current.length,
        speed: g ? g.speed : null,
        acc: g ? g.acc : null,
        elapsed: recordingRef.current ? (now - startedAt.current) / 1000 : 0,
      })
    }, 500)
    return () => clearInterval(id)
  }, [sensorsOn, geo.latest])

  const handleAllow = async () => {
    setBusy(true)
    // Must be the first thing in the tap handler (iPhone rule).
    const motion = await requestMotionPermission()
    const location = await requestLocationPermission()
    setPerm({ motion, location })
    setBusy(false)
    if (motion === 'granted' && (location === 'granted' || location === 'unavailable')) {
      setPhase('ready')
    }
  }

  const startRecording = () => {
    const id = Date.now()
    samples.current = []
    marks.current = []
    motionCount.current = 0
    startedAt.current = id
    metaRef.current = meta
    sessionRef.current = { id, savedCount: 0, chunkSeq: 0 }
    recordingRef.current = true
    setMarksCount(0)
    setPhase('recording')
    persist('recording')
    // Ask the browser not to delete saved rides when storage runs low.
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {})
    }
  }

  const stopRecording = () => {
    recordingRef.current = false
    const endedAt = Date.now()
    setResult(
      buildResult(
        {
          id: sessionRef.current.id,
          status: 'finished',
          meta: metaRef.current,
          startedAt: startedAt.current,
          endedAt,
          marks: marks.current.slice(),
        },
        samples.current,
      ),
    )
    setBackPhase('ready')
    setPhase('result')
    persist('finished', endedAt).then(() => setSavedKey((k) => k + 1))
  }

  const addMark = (type) => {
    const g = geo.latest.current
    marks.current.push({
      t: Date.now(),
      type,
      lat: g ? g.lat : null,
      lng: g ? g.lng : null,
      acc: g ? g.acc : null,
      speed: g ? g.speed : null,
      speedSource: g ? g.speedSource : '',
    })
    setMarksCount(marks.current.length)
    if (navigator.vibrate) navigator.vibrate(60)
  }

  const undoMark = () => {
    marks.current.pop()
    setMarksCount(marks.current.length)
  }

  // ----- saved rides (autosaved on this phone) -----
  const openSaved = async (id) => {
    try {
      const { session, samples: rows } = await loadSession(id)
      if (!session) return
      setResult(buildResult(session, rows))
      setBackPhase(phase)
      setPhase('result')
    } catch {
      setStorageOk(false)
    }
  }

  const downloadSaved = async (id) => {
    try {
      const { session, samples: rows } = await loadSession(id)
      if (session) downloadResult(buildResult(session, rows))
    } catch {
      setStorageOk(false)
    }
  }

  const removeSaved = async (id) => {
    if (!window.confirm('Delete this saved ride from this phone?')) return
    try {
      await deleteSession(id)
      setSavedKey((k) => k + 1)
    } catch {
      setStorageOk(false)
    }
  }

  const closeResult = () => {
    setResult(null)
    setPhase(backPhase)
  }

  const saved = (
    <SavedRides
      refreshKey={savedKey}
      onOpen={openSaved}
      onDownload={downloadSaved}
      onDelete={removeSaved}
    />
  )

  if (phase === 'permission') {
    return (
      <main>
        <PermissionScreen perm={perm} busy={busy} onAllow={handleAllow} />
        {saved}
      </main>
    )
  }

  if (phase === 'result' && result) {
    return (
      <main>
        <RideResult
          result={result}
          onDownload={() => downloadResult(result)}
          onClose={closeResult}
        />
      </main>
    )
  }

  const noMotion = sensorsOn && live && live.strength == null
  const set = (k) => (e) => setMeta({ ...meta, [k]: e.target.value })

  return (
    <main>
      {phase === 'ready' && (
        <>
          <div className="card">
            <h1>Get ready</h1>
            <p className="hint">
              Sensor check: move the phone and watch &quot;Shake strength&quot; change. Wait
              until GPS accuracy is low (about 20 m or better) before you start.
            </p>
            <LiveReadout live={live} marksCount={0} recording={false} />
            {noMotion && (
              <p className="warn">
                No motion data yet. Allow &quot;Motion sensors&quot; for this site in your
                browser settings, or try another browser.
              </p>
            )}

            <label>Phone model
              <input value={meta.phone} onChange={set('phone')} placeholder="e.g. Redmi Note 11" />
            </label>
            <label>How is the phone placed?
              <select value={meta.mount} onChange={set('mount')}>
                <option value="holder">Fixed in a holder</option>
                <option value="mat">Flat on a non-slip mat</option>
                <option value="hand">Held in hand</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Vehicle
              <input value={meta.vehicle} onChange={set('vehicle')} placeholder="e.g. scooter, car, bicycle" />
            </label>
            <label>Road / route
              <input value={meta.road} onChange={set('road')} placeholder="e.g. campus main road" />
            </label>

            <button className="primary" onClick={startRecording}>Start recording</button>
          </div>
          {saved}
        </>
      )}

      {phase === 'recording' && (
        <div className="card">
          <h1>Recording</h1>
          <LiveReadout live={live} marksCount={marksCount} recording />
          {!storageOk && (
            <p className="warn">
              Autosave is not working in this browser. Download the CSV before you leave the page.
            </p>
          )}
          <MarkPanel onMark={addMark} onUndo={undoMark} marksCount={marksCount} />
          <button className="stop" onClick={stopRecording}>Stop recording</button>
        </div>
      )}
    </main>
  )
}
