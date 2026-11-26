import { describe, it, expect } from 'vitest'
import { normalizeBase, isInsecure, loadApiBase, saveApiBase, getDeviceId } from './serverSettings'

const fakeStorage = () => {
  const data = {}
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v },
    removeItem: (k) => { delete data[k] },
  }
}

describe('normalizeBase', () => {
  it('removes spaces and trailing slashes', () => {
    expect(normalizeBase('  https://abc.trycloudflare.com/  ')).toBe('https://abc.trycloudflare.com')
    expect(normalizeBase('https://x.onrender.com///')).toBe('https://x.onrender.com')
  })

  it('rejects anything that is not an http(s) address', () => {
    expect(normalizeBase('')).toBe('')
    expect(normalizeBase('abc.com')).toBe('')
    expect(normalizeBase('ftp://abc.com')).toBe('')
    expect(normalizeBase(null)).toBe('')
  })

  it('keeps a port and a path', () => {
    expect(normalizeBase('http://localhost:8080')).toBe('http://localhost:8080')
  })
})

describe('isInsecure', () => {
  it('flags plain http to another computer', () => {
    expect(isInsecure('http://192.168.1.5:8080')).toBe(true)
    expect(isInsecure('http://my-laptop:8080')).toBe(true)
  })

  it('accepts https and localhost', () => {
    expect(isInsecure('https://abc.com')).toBe(false)
    expect(isInsecure('http://localhost:8080')).toBe(false)
  })
})

describe('loadApiBase / saveApiBase', () => {
  it('uses the build-time address when nothing is saved', () => {
    expect(loadApiBase(fakeStorage(), 'https://built-in.example.com/')).toBe('https://built-in.example.com')
  })

  it('prefers the address typed in the app', () => {
    const s = fakeStorage()
    saveApiBase('https://typed.example.com', s)
    expect(loadApiBase(s, 'https://built-in.example.com')).toBe('https://typed.example.com')
  })

  it('goes back to the built-in address after the saved one is cleared', () => {
    const s = fakeStorage()
    saveApiBase('https://typed.example.com', s)
    saveApiBase('', s)
    expect(loadApiBase(s, 'https://built-in.example.com')).toBe('https://built-in.example.com')
  })

  it('returns empty when there is no address anywhere', () => {
    expect(loadApiBase(fakeStorage(), '')).toBe('')
    expect(loadApiBase(fakeStorage(), undefined)).toBe('')
  })
})

describe('getDeviceId', () => {
  it('makes an id once and remembers it', () => {
    const s = fakeStorage()
    let n = 0
    const make = () => `id-${++n}`
    expect(getDeviceId(s, make)).toBe('id-1')
    expect(getDeviceId(s, make)).toBe('id-1')
  })

  it('still returns an id when storage is not available', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(getDeviceId(broken, () => 'temp').length > 0).toBe(true)
  })
})
