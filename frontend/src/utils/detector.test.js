import { describe, it, expect } from 'vitest'
import { createDetector, severityOf } from './detector'
import { DEFAULT_SETTINGS } from './settings'

// Builds readings at 50 per second: steady shaking around 9.8 with a tiny repeating
// wobble, plus bumps (a sharp spike that fades) at the given times.
function ride({ seconds = 30, speed = 6, bumps = [], bumpSize = 6, hz = 50 } = {}) {
  const rows = []
  for (let i = 0; i < seconds * hz; i++) {
    const t = i / hz
    let strength = 9.8 + 0.3 * Math.sin(i * 1.7)
    for (const b of bumps) {
      if (t >= b && t < b + 0.4) strength += bumpSize * Math.exp(-(t - b) * 6) * Math.cos((t - b) * 40)
    }
    rows.push({ t: 1_700_000_000_000 + Math.round(t * 1000), strength, speed, lat: 12.9, lng: 77.5, acc: 8 })
  }
  return rows
}

function run(rows, settings = DEFAULT_SETTINGS) {
  const d = createDetector(settings)
  const found = []
  for (const r of rows) found.push(...d.push(r))
  found.push(...d.flush())
  return found
}

describe('createDetector', () => {
  it('finds nothing on a smooth road', () => {
    expect(run(ride())).toHaveLength(0)
  })

  it('finds each bump once', () => {
    const found = run(ride({ bumps: [5, 12, 20] }))
    expect(found).toHaveLength(3)
  })

  it('reports the time of the bump, not a moment later', () => {
    const [d] = run(ride({ bumps: [10] }))
    const seconds = (d.t - 1_700_000_000_000) / 1000
    expect(Math.abs(seconds - 10) < 0.3).toBe(true)
  })

  it('does not count one bump twice (pause)', () => {
    // two spikes 0.5 s apart are inside the 1 s pause, so only one detection
    expect(run(ride({ bumps: [10, 10.5] }))).toHaveLength(1)
  })

  it('counts two bumps that are further apart than the pause', () => {
    expect(run(ride({ bumps: [10, 11.5] }))).toHaveLength(2)
  })

  it('ignores bumps when the vehicle is too slow', () => {
    expect(run(ride({ bumps: [10], speed: 1 }))).toHaveLength(0)
  })

  it('ignores bumps when the speed is unknown', () => {
    expect(run(ride({ bumps: [10], speed: null }))).toHaveLength(0)
  })

  it('a lower minimum speed allows a walking test', () => {
    const walk = { ...DEFAULT_SETTINGS, minSpeed: 0.5 }
    expect(run(ride({ bumps: [10], speed: 1 }), walk)).toHaveLength(1)
  })

  it('a higher threshold misses small bumps', () => {
    const strict = { ...DEFAULT_SETTINGS, threshold: 30 }
    expect(run(ride({ bumps: [10] }), strict)).toHaveLength(0)
  })

  it('normalised mode divides by speed', () => {
    const norm = { ...DEFAULT_SETTINGS, mode: 'normalised', thresholdNorm: 0.5 }
    expect(run(ride({ bumps: [10], speed: 6 }), norm)).toHaveLength(1)
    // the same bump at much higher speed gives a smaller value per m/s
    const strictNorm = { ...norm, thresholdNorm: 3 }
    expect(run(ride({ bumps: [10], speed: 6 }), strictNorm)).toHaveLength(0)
  })

  it('closes a bump that is still being measured when recording stops (flush)', () => {
    const rows = ride({ bumps: [10] }).filter((r) => r.t <= 1_700_000_000_000 + 10_100)
    const d = createDetector(DEFAULT_SETTINGS)
    const during = []
    for (const r of rows) during.push(...d.push(r))
    expect(during).toHaveLength(0)
    expect(d.flush()).toHaveLength(1)
  })

  it('keeps the place of the strongest reading', () => {
    const [d] = run(ride({ bumps: [10] }))
    expect(d.lat).toBe(12.9)
    expect(d.speed).toBe(6)
    expect(d.value > 3).toBe(true)
  })
})

describe('severityOf', () => {
  it('grades by how far above the threshold', () => {
    expect(severityOf(3.1, 3)).toBe('minor')
    expect(severityOf(4.6, 3)).toBe('moderate')
    expect(severityOf(8, 3)).toBe('severe')
  })
})
