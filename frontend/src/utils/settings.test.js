import { describe, it, expect } from 'vitest'
import { cleanSettings, loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings'

const fakeStorage = () => {
  const data = {}
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v } }
}

describe('cleanSettings', () => {
  it('fills in missing values with the defaults', () => {
    expect(cleanSettings({})).toEqual(DEFAULT_SETTINGS)
    expect(cleanSettings(null)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps numbers inside safe limits', () => {
    expect(cleanSettings({ threshold: 9999 }).threshold).toBe(30)
    expect(cleanSettings({ threshold: -4 }).threshold).toBe(0.5)
    expect(cleanSettings({ pause: 0 }).pause).toBe(0.5)
  })

  it('replaces garbage with defaults', () => {
    expect(cleanSettings({ threshold: 'abc' }).threshold).toBe(DEFAULT_SETTINGS.threshold)
    expect(cleanSettings({ mode: 'weird' }).mode).toBe('plain')
  })

  it('accepts normalised mode', () => {
    expect(cleanSettings({ mode: 'normalised' }).mode).toBe('normalised')
  })
})

describe('loadSettings / saveSettings', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('remembers saved settings', () => {
    const storage = fakeStorage()
    saveSettings({ ...DEFAULT_SETTINGS, threshold: 4.5 }, storage)
    expect(loadSettings(storage).threshold).toBe(4.5)
  })

  it('survives broken saved data', () => {
    const storage = fakeStorage()
    storage.setItem('smoothroute.settings', '{not json')
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })
})
