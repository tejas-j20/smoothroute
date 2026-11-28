import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import PermissionScreen from './components/PermissionScreen'
import ReadyScreen from './components/ReadyScreen'
import RecordingScreen from './components/RecordingScreen'
import RideResult from './components/RideResult'
import SavedRides from './components/SavedRides'
import ServerSettings from './components/ServerSettings'
import MapPage from './components/MapPage'
import { requestMotionPermission, useMotion } from './hooks/useMotion'
import { requestLocationPermission, useGeolocation } from './hooks/useGeolocation'
import { useWakeLock } from './hooks/useWakeLock'
import { toCsv, downloadText, csvFilename } from './utils/csv'
import { saveSession, saveChunk, loadSession, deleteSession, updateSession } from './utils/storage'
import { getDeviceId, loadApiBase, saveApiBase } from './utils/serverSettings'
import { createDetector } from './utils/detector'
import { cleanSettings, loadSettings, saveSettings } from './utils/settings'
import { createTrace, pushTrace } from './utils/trace'

const AUTOSAVE_MS = 5000

// How many bumps of each type were marked, for the counters on the mark buttons.
function countByType(list) {
  const out = {}
  for (const m of list) out[m.type] = (out[m.type] || 0) + 1
  return out
}

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
    detections: session.detections || [],
    settings: session.settings || null,
    uploaded: session.uploaded || null,
  }
}

function downloadResult(r) {
  const csv = toCsv(
    { ...r.meta, settings: r.settings, startedAt: r.startedAt, endedAt: r.endedAt },
    r.samples,
    r.marks,
    r.detections,
  )
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
  const [markCounts, setMarkCounts] = useState({})
  const [result, setResult] = useState(null)
  const [savedKey, setSavedKey] = useState(0) // bump this to reload the saved-rides list
  const [storageOk, setStorageOk] = useState(true)
  const [settings, setSettings] = useState(() => loadSettings()) // detection settings
  const [apiBase, setApiBase] = useState(() => loadApiBase()) // backend address
  const [deviceId] = useState(() => getDeviceId()) // anonymous id of this phone
  const [screen, setScreen] = useState('record') // 'record' or 'map'
  const trace = useMemo(() => createTrace(400), []) // history for the live trace

  // Data lives in refs: the sensor fires dozens of times a second and storing
  // it in React state would make the page lag.
  const samples = useRef([])
  const marks = useRef([])
  const detections = useRef([]) // bumps found automatically
  const detectorRef = useRef(null)
  const settingsRef = useRef(settings) // settings used for the ride being recorded
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
      pushTrace(trace, s.strength, s.t)
      if (recordingRef.current) {
        samples.current.push(row)
        if (detectorRef.current) {
          const found = detectorRef.current.push(row)
          if (found.length > 0) detections.current.push(...found)
        }
      }
    },
    [geo.latest, trace],
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
      detections: detections.current.slice(),
      settings: settingsRef.current,
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
          detections: job.detections,
          settings: job.settings,
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
        detected: detections.current.length,
        lastSeverity: detections.current.length
          ? detections.current[detections.current.length - 1].severity
          : null,
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
    detections.current = []
    motionCount.current = 0
    startedAt.current = id
    metaRef.current = meta
    settingsRef.current = settings
    detectorRef.current = createDetector(settings)
    sessionRef.current = { id, savedCount: 0, chunkSeq: 0 }
    recordingRef.current = true
    setMarksCount(0)
    setMarkCounts({})
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
    if (detectorRef.current) {
      detections.current.push(...detectorRef.current.flush()) // close a bump still being measured
      detectorRef.current = null
    }
    setResult(
      buildResult(
        {
          id: sessionRef.current.id,
          status: 'finished',
          meta: metaRef.current,
          startedAt: startedAt.current,
          endedAt,
          marks: marks.current.slice(),
          detections: detections.current.slice(),
          settings: settingsRef.current,
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
    setMarkCounts(countByType(marks.current))
    if (navigator.vibrate) navigator.vibrate(60)
  }

  const undoMark = () => {
    marks.current.pop()
    setMarksCount(marks.current.length)
    setMarkCounts(countByType(marks.current))
  }

  const updateApiBase = (base) => {
    setApiBase(base)
    saveApiBase(base)
  }

  // Remember that a ride was uploaded (so the saved-rides list can show it).
  const handleUploaded = async (info) => {
    setResult((r) => (r ? { ...r, uploaded: info } : r))
    if (result && result.id != null) {
      try {
        await updateSession(result.id, { uploaded: info })
        setSavedKey((k) => k + 1)
      } catch {
        // the upload itself worked; only the badge could not be saved
      }
    }
  }

  const updateSettings = (next) => {
    const clean = cleanSettings(next)
    setSettings(clean)
    saveSettings(clean)
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

  const noMotion = sensorsOn && live && live.strength == null
  // The dashed line on the live trace: the jolt that counts as a bump at the current speed.
  const traceThreshold =
    settings.mode === 'normalised'
      ? settings.thresholdNorm * Math.max((live && live.speed) || 0, settings.minSpeed || 0.1)
      : settings.threshold
  const dark = screen === 'record' && phase === 'recording'

  let body
  if (screen === 'map') {
    body = <MapPage apiBase={apiBase} onApiBaseChange={updateApiBase} />
  } else if (phase === 'permission') {
    body = (
      <PermissionScreen perm={perm} busy={busy} onAllow={handleAllow}>
        <ServerSettings apiBase={apiBase} onChange={updateApiBase} />
        {saved}
      </PermissionScreen>
    )
  } else if (phase === 'result' && result) {
    body = (
      <RideResult
        result={result}
        apiBase={apiBase}
        deviceId={deviceId}
        onUploaded={handleUploaded}
        onDownload={() => downloadResult(result)}
        onClose={closeResult}
      />
    )
  } else if (phase === 'recording') {
    body = (
      <RecordingScreen
        live={live}
        trace={trace}
        traceThreshold={traceThreshold}
        marksCount={marksCount}
        markCounts={markCounts}
        storageOk={storageOk}
        onMark={addMark}
        onUndo={undoMark}
        onStop={stopRecording}
      />
    )
  } else {
    body = (
      <ReadyScreen
        live={live}
        trace={trace}
        traceThreshold={traceThreshold}
        noMotion={noMotion}
        meta={meta}
        onMeta={setMeta}
        settings={settings}
        onSettings={updateSettings}
        apiBase={apiBase}
        onApiBase={updateApiBase}
        saved={saved}
        onStart={startRecording}
      />
    )
  }

  return (
    <div className={`app${dark ? ' dark' : ''}`}>
      <header className="bar">
        <div className="bar-inner">
          <span className="brand">SmoothRoute</span>
          {!recording &&
            (screen === 'map' ? (
              <button className="textbtn" onClick={() => setScreen('record')}>Recorder</button>
            ) : (
              <button className="textbtn" onClick={() => setScreen('map')}>Map</button>
            ))}
        </div>
        <div className="centerline" />
      </header>
      {body}
    </div>
  )
}
