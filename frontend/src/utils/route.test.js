import { describe, it, expect } from 'vitest'
import { routePoints } from './route'

describe('routePoints', () => {
  it('returns nothing when there are no readings', () => {
    expect(routePoints([])).toEqual([])
  })

  it('skips readings that have no position', () => {
    const samples = [{ lat: null, lng: null }, { lat: 12.9, lng: 77.5 }]
    expect(routePoints(samples)).toEqual([[12.9, 77.5]])
  })

  it('keeps a point only when the position changes', () => {
    const samples = [
      { lat: 12.9, lng: 77.5 },
      { lat: 12.9, lng: 77.5 },
      { lat: 12.9, lng: 77.5 },
      { lat: 12.91, lng: 77.5 },
      { lat: 12.91, lng: 77.5 },
      { lat: 12.9, lng: 77.5 }, // going back is a real change
    ]
    expect(routePoints(samples)).toEqual([[12.9, 77.5], [12.91, 77.5], [12.9, 77.5]])
  })
})
