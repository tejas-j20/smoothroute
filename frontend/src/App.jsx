import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import PermissionScreen from './components/PermissionScreen'
import LiveReadout from './components/LiveReadout'
import MarkPanel from './components/MarkPanel'
import { requestMotionPermission, useMotion } from './hooks/useMotion'
import { requestLocationPermission, useGeolocation } from './hooks/useGeolocation'
import { useWakeLock } from './hooks/useWakeLock'
import { toCsv, downloadText } from './utils/csv'

export default function App() {
  // permission -> ready -> recording -> finished
  const [phase, setPhase] = useState('permission')
  const [perm, setPerm] = useState({ motion: 'unknown', location: 'unknown' })
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState({ phone: '', mount: 'holder', vehicle: '', road: '' })
  const [live, setLive] = useState(null)
  const [marksCount, setMarksCount] = useState(0)
  const [summary, setSummary] = useState(null)

  // Data lives in refs: the sensor fires dozens of times a second and storing
  // it in React state would make the page lag.
  const samples = useRef([])
  const marks = useRef([])
  const recordingRef = useRef(false)
  const latestMotion = useRef(null)
  const motionCount = useRef(0)
  const startedAt = useRef(0)

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
    samples.current = []
    marks.current = []
    motionCount.current = 0
    startedAt.current = Date.now()
    recordingRef.current = true
    setMarksCount(0)
    setPhase('recording')
  }

  const stopRecording = () => {
    recordingRef.current = false
    const endedAt = Date.now()
    const seconds = (endedAt - startedAt.current) / 1000
    setSummary({
      endedAt,
      readings: samples.current.length,
      marks: marks.current.length,
      seconds,
      rate: seconds > 0 ? samples.current.length / seconds : 0,
    })
    setPhase('finished')
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

  const download = () => {
    const csv = toCsv(
      { ...meta, startedAt: startedAt.current, endedAt: summary.endedAt },
      samples.current,
      marks.current,
    )
    const stamp = new Date(startedAt.current).toISOString().slice(0, 19).replace(/[:T]/g, '-')
    downloadText(`smoothroute_${stamp}.csv`, csv)
  }

  const newSession = () => {
    samples.current = []
    marks.current = []
    setMarksCount(0)
    setSummary(null)
    setPhase('ready')
  }

  if (phase === 'permission') {
    return (
      <main>
        <PermissionScreen perm={perm} busy={busy} onAllow={handleAllow} />
      </main>
    )
  }

  const noMotion = sensorsOn && live && live.strength == null
  const set = (k) => (e) => setMeta({ ...meta, [k]: e.target.value })

  return (
    <main>
      {phase === 'ready' && (
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
      )}

      {phase === 'recording' && (
        <div className="card">
          <h1>Recording</h1>
          <LiveReadout live={live} marksCount={marksCount} recording />
          <MarkPanel onMark={addMark} onUndo={undoMark} marksCount={marksCount} />
          <button className="stop" onClick={stopRecording}>Stop recording</button>
        </div>
      )}

      {phase === 'finished' && summary && (
        <div className="card">
          <h1>Recording finished</h1>
          <ul>
            <li>Readings: <b>{summary.readings}</b></li>
            <li>Bumps marked: <b>{summary.marks}</b></li>
            <li>Duration: <b>{Math.round(summary.seconds)} s</b></li>
            <li>Average sensor rate: <b>{summary.rate.toFixed(0)} per second</b></li>
          </ul>
          <button className="primary" onClick={download}>Download CSV</button>
          <button className="link" onClick={newSession}>New session</button>
        </div>
      )}
    </main>
  )
}
