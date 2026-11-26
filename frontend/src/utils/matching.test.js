import { describe, it, expect } from 'vitest'
import { matchByTime, matchByDistance } from './matching'

const mark = (t, lat = null, lng = null) => ({ t, type: 'pothole', lat, lng })
const hit = (t, lat = null, lng = null) => ({ t, value: 5, lat, lng })

describe('matchByTime', () => {
  it('matches a detection just before the tap', () => {
    const r = matchByTime([hit(9000)], [mark(10000)])
    expect(r.found).toBe(1)
    expect(r.missed).toHaveLength(0)
    expect(r.falseAlarms).toHaveLength(0)
  })

  it('does not match a detection more than 2 s before the tap', () => {
    const r = matchByTime([hit(7000)], [mark(10000)])
    expect(r.found).toBe(0)
    expect(r.missed).toHaveLength(1)
    expect(r.falseAlarms).toHaveLength(1)
  })

  it('reports false alarms and misses', () => {
    const r = matchByTime([hit(9000), hit(30000)], [mark(10000), mark(50000)])
    expect(r.found).toBe(1)
    expect(r.missed).toHaveLength(1)
    expect(r.falseAlarms).toHaveLength(1)
    expect(r.rate).toBe(0.5)
  })

  it('uses each detection for only one mark', () => {
    const r = matchByTime([hit(9000)], [mark(9500), mark(10000)])
    expect(r.found).toBe(1)
  })

  it('has no rate when there are no marks', () => {
    expect(matchByTime([hit(1000)], []).rate).toBeNull()
  })
})

describe('matchByDistance', () => {
  it('matches detections within the radius', () => {
    // 0.0001 degrees of longitude is about 10.8 m here
    const r = matchByDistance([hit(0, 12.9716, 77.5947)], [mark(0, 12.9716, 77.5946)], 20)
    expect(r.found).toBe(1)
  })

  it('does not match detections that are too far', () => {
    const r = matchByDistance([hit(0, 12.9716, 77.5950)], [mark(0, 12.9716, 77.5946)], 20)
    expect(r.found).toBe(0)
    expect(r.falseAlarms).toHaveLength(1)
  })

  it('skips marks and detections without a position', () => {
    const r = matchByDistance([hit(0)], [mark(0)], 20)
    expect(r.found).toBe(0)
  })
})
