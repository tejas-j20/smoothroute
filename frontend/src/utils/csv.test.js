import { describe, it, expect } from 'vitest'
import { toCsv, csvFilename } from './csv'

const meta = {
  phone: 'Test, phone',
  mount: 'holder',
  vehicle: 'car',
  road: 'campus road',
  startedAt: Date.UTC(2026, 10, 5, 5, 0, 0),
  endedAt: Date.UTC(2026, 10, 5, 5, 1, 0),
}

const sample = (t, extra = {}) => ({
  t, ax: 1, ay: 2, az: 3, strength: 3.7417, gravity: false,
  lat: 12.9, lng: 77.5, acc: 8, speed: 5.5, speedSource: 'gps', ...extra,
})

const mark = (t, type) => ({ t, type, lat: 12.9, lng: 77.5, acc: 8, speed: 5.5, speedSource: 'gps' })

describe('toCsv', () => {
  const lines = toCsv(meta, [sample(100), sample(300)], [mark(200, 'pothole')]).split('\n')

  it('starts with the session notes and the column header', () => {
    expect(lines[0]).toBe('# SmoothRoute recording')
    expect(lines).toContain('# vehicle: car')
    expect(lines[7]).toBe('# detection: not recorded')
    expect(lines[8]).toBe(
      'time_ms,ax,ay,az,strength,gravity_included,lat,lng,gps_accuracy_m,speed_mps,speed_source,event,detect_value',
    )
  })

  it('removes commas from free-text notes so the file stays valid', () => {
    const phoneLine = lines.find((l) => l.startsWith('# phone:'))
    expect(phoneLine).not.toContain(',')
  })

  it('puts the mark between the readings, ordered by time', () => {
    const rows = lines.slice(9)
    expect(rows).toHaveLength(3)
    expect(rows[0].startsWith('100,')).toBe(true)
    expect(rows[1].startsWith('200,')).toBe(true)
    expect(rows[2].startsWith('300,')).toBe(true)
  })

  it('writes the event name only on mark rows, with empty sensor columns', () => {
    const rows = lines.slice(9)
    expect(rows[0].endsWith(',')).toBe(true) // reading: empty event
    expect(rows[1].startsWith('200,,,,,,')).toBe(true)
    expect(rows[1].endsWith(',pothole,')).toBe(true)
  })

  it('leaves missing GPS values empty', () => {
    const csv = toCsv(meta, [sample(100, { lat: null, lng: null, acc: null, speed: null })], [])
    const row = csv.split('\n')[9]
    expect(row).toBe('100,1.0000,2.0000,3.0000,3.7417,0,,,,,gps,,')
  })

  it('marks whether gravity is included', () => {
    const csv = toCsv(meta, [sample(100, { gravity: true })], [])
    expect(csv.split('\n')[9].split(',')[5]).toBe('1')
  })
})

describe('toCsv with automatic detections', () => {
  const det = { t: 150, value: 4.5, lat: 12.9, lng: 77.5, acc: 8, speed: 5.5, severity: 'moderate' }
  const csv = toCsv(
    { ...meta, settings: { mode: 'plain', threshold: 3, thresholdNorm: 0.5, minSpeed: 3, pause: 1 } },
    [sample(100), sample(300)],
    [],
    [det],
  )
  const lines = csv.split('\n')

  it('writes the settings that were used', () => {
    expect(lines[7]).toBe('# detection: mode=plain threshold=3 min_speed_mps=3 pause_s=1')
  })

  it('adds a row per detection with event auto_<severity> and the value', () => {
    const row = lines[10]
    expect(row.startsWith('150,,,,,,')).toBe(true)
    expect(row.endsWith(',auto_moderate,4.5000')).toBe(true)
  })

  it('shows the normalised threshold when that mode was used', () => {
    const text = toCsv(
      { ...meta, settings: { mode: 'normalised', threshold: 3, thresholdNorm: 0.5, minSpeed: 3, pause: 1 } },
      [],
      [],
    )
    expect(text.split('\n')[7]).toBe('# detection: mode=normalised threshold=0.5 min_speed_mps=3 pause_s=1')
  })
})

describe('csvFilename', () => {
  it('builds a file name from the start time', () => {
    expect(csvFilename(Date.UTC(2026, 10, 5, 5, 0, 0))).toBe(
      'smoothroute_2026-11-05-05-00-00.csv',
    )
  })
})
