import { describe, it, expect } from 'vitest'
import { buildUploadItems, chunk, MAX_ACCURACY_M } from './upload'

const det = (extra = {}) => ({ t: 1000, value: 5.12345, jolt: 5, speed: 6.5, lat: 12.9, lng: 77.5, acc: 8, severity: 'moderate', ...extra })
const result = (detections, settings = { mode: 'plain' }) => ({ detections, settings })

describe('buildUploadItems', () => {
  it('turns a detection into the message the backend expects', () => {
    const { items, skipped } = buildUploadItems(result([det()]), 'phone-1')
    expect(skipped).toBe(0)
    expect(items).toEqual([
      { lat: 12.9, lng: 77.5, speed: 6.5, value: 5.1235, mode: 'plain', accuracy: 8, time: 1000, deviceId: 'phone-1' },
    ])
  })

  it('uses the mode that was active during the ride', () => {
    const { items } = buildUploadItems(result([det()], { mode: 'normalised' }), 'p')
    expect(items[0].mode).toBe('normalised')
  })

  it('defaults to plain when the settings were not recorded', () => {
    const { items } = buildUploadItems({ detections: [det()], settings: null }, 'p')
    expect(items[0].mode).toBe('plain')
  })

  it('skips bumps without a place, a speed or a good GPS fix', () => {
    const list = [
      det({ lat: null, lng: null }),
      det({ speed: null }),
      det({ acc: MAX_ACCURACY_M + 1 }),
      det({ value: NaN }),
      det(), // fine
    ]
    const { items, skipped } = buildUploadItems(result(list), 'p')
    expect(items).toHaveLength(1)
    expect(skipped).toBe(4)
  })

  it('accepts a bump whose GPS accuracy is unknown', () => {
    const { items } = buildUploadItems(result([det({ acc: null })]), 'p')
    expect(items[0].accuracy).toBeNull()
  })

  it('handles a ride with no detections', () => {
    expect(buildUploadItems({ detections: [], settings: null }, 'p')).toEqual({ items: [], skipped: 0 })
    expect(buildUploadItems({ settings: null }, 'p').items).toHaveLength(0)
  })
})

describe('chunk', () => {
  it('splits a list into pieces', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns nothing for an empty list', () => {
    expect(chunk([], 3)).toEqual([])
  })
})
