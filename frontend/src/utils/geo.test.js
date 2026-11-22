import { describe, it, expect } from 'vitest'
import { distanceMeters, msToKmh } from './geo'

describe('distanceMeters (Haversine)', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0)
  })

  it('one degree of latitude is about 111.2 km', () => {
    const d = distanceMeters(0, 0, 1, 0)
    expect(Math.abs(d - 111195)).toBeLessThan(50)
  })

  it('0.0001 degrees of longitude in Bengaluru is about 10.8 m', () => {
    const d = distanceMeters(12.9716, 77.5946, 12.9716, 77.5947)
    expect(Math.abs(d - 10.84)).toBeLessThan(0.1)
  })

  it('is the same in both directions', () => {
    const a = distanceMeters(12.9, 77.5, 13.0, 77.6)
    const b = distanceMeters(13.0, 77.6, 12.9, 77.5)
    expect(a).toBeCloseTo(b, 6)
  })
})

describe('msToKmh', () => {
  it('converts metres per second to km/h', () => {
    expect(msToKmh(10)).toBe(36)
  })

  it('keeps null as null', () => {
    expect(msToKmh(null)).toBeNull()
  })
})
