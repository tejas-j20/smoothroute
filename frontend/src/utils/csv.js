// Builds one CSV file from the recorded samples and the manual bump marks.
// Lines starting with "#" hold session notes. In Python read it with:
//   pandas.read_csv("file.csv", comment="#")
const COLUMNS = [
  'time_ms', 'ax', 'ay', 'az', 'strength', 'gravity_included',
  'lat', 'lng', 'gps_accuracy_m', 'speed_mps', 'speed_source', 'event', 'detect_value',
]

const num = (v, digits) =>
  v == null || Number.isNaN(v) ? '' : Number(v).toFixed(digits)

// keep free-text notes from breaking the CSV
const clean = (s) => String(s ?? '').replace(/[\r\n,]+/g, ' ').trim()

// One line describing the detector settings that were used for the ride.
function detectionNote(settings) {
  if (!settings) return '# detection: not recorded'
  const threshold = settings.mode === 'normalised' ? settings.thresholdNorm : settings.threshold
  return `# detection: mode=${settings.mode} threshold=${threshold} min_speed_mps=${settings.minSpeed} pause_s=${settings.pause}`
}

// detections = the bumps the app found automatically (rows get event "auto_<severity>"
// and the detector's value in the last column).
export function toCsv(meta, samples, marks, detections = []) {
  const header = [
    '# SmoothRoute recording',
    `# phone: ${clean(meta.phone)}`,
    `# mounting: ${clean(meta.mount)}`,
    `# vehicle: ${clean(meta.vehicle)}`,
    `# road: ${clean(meta.road)}`,
    `# started: ${new Date(meta.startedAt).toISOString()}`,
    `# ended: ${new Date(meta.endedAt).toISOString()}`,
    detectionNote(meta.settings),
    COLUMNS.join(','),
  ]

  const sampleRows = samples.map((s) => ({
    t: s.t,
    line: [
      s.t, num(s.ax, 4), num(s.ay, 4), num(s.az, 4), num(s.strength, 4),
      s.gravity ? 1 : 0,
      num(s.lat, 7), num(s.lng, 7), num(s.acc, 1), num(s.speed, 3),
      s.speedSource ?? '', '', '',
    ].join(','),
  }))

  // a mark becomes its own row: sensor columns empty, "event" filled
  const markRows = marks.map((m) => ({
    t: m.t,
    line: [
      m.t, '', '', '', '', '',
      num(m.lat, 7), num(m.lng, 7), num(m.acc, 1), num(m.speed, 3),
      m.speedSource ?? '', clean(m.type), '',
    ].join(','),
  }))

  // an automatic detection is also its own row: sensor columns empty
  const detectionRows = detections.map((d) => ({
    t: d.t,
    line: [
      d.t, '', '', '', '', '',
      num(d.lat, 7), num(d.lng, 7), num(d.acc, 1), num(d.speed, 3),
      '', `auto_${d.severity}`, num(d.value, 4),
    ].join(','),
  }))

  const all = [...sampleRows, ...markRows, ...detectionRows].sort((a, b) => a.t - b.t)
  return header.concat(all.map((r) => r.line)).join('\n')
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// File name for a ride, e.g. smoothroute_2026-11-05-10-30-00.csv (UTC time)
export function csvFilename(startedAt) {
  const stamp = new Date(startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `smoothroute_${stamp}.csv`
}
