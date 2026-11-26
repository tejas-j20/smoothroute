import { describe, it, expect } from 'vitest'
import { checkHealth, uploadDetections, fetchClusters } from './api'

// A fake fetch that records what was asked and answers with the given replies, one per call.
function fakeFetch(replies) {
  const calls = []
  const fn = async (url, options) => {
    calls.push({ url, options })
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)]
    if (reply instanceof Error) throw reply
    return { ok: reply.status < 400, status: reply.status, json: async () => reply.body }
  }
  fn.calls = calls
  return fn
}

const item = (n) => ({ lat: 12.9, lng: 77.5, speed: 6, value: 5, mode: 'plain', accuracy: 8, time: n, deviceId: 'p' })

describe('checkHealth', () => {
  it('asks the health endpoint', async () => {
    const f = fakeFetch([{ status: 200, body: { status: 'ok' } }])
    const r = await checkHealth('https://api.example.com', f)
    expect(r.status).toBe('ok')
    expect(f.calls[0].url).toBe('https://api.example.com/api/health')
  })

  it('explains when the server cannot be reached', async () => {
    const f = fakeFetch([new TypeError('Failed to fetch')])
    let message = ''
    try { await checkHealth('https://api.example.com', f) } catch (e) { message = e.message }
    expect(message.startsWith('Could not reach the server')).toBe(true)
  })
})

describe('uploadDetections', () => {
  it('sends bumps in pieces and adds up the answers', async () => {
    const f = fakeFetch([
      { status: 200, body: { received: 2, saved: 2, rejected: 0 } },
      { status: 200, body: { received: 1, saved: 0, rejected: 1 } },
    ])
    const r = await uploadDetections('https://api.example.com', [item(1), item(2), item(3)], { fetchImpl: f, chunkSize: 2 })
    expect(r).toEqual({ saved: 2, rejected: 1 })
    expect(f.calls).toHaveLength(2)
    expect(f.calls[0].url).toBe('https://api.example.com/api/readings/batch')
    expect(f.calls[0].options.method).toBe('POST')
    expect(JSON.parse(f.calls[0].options.body)).toHaveLength(2)
    expect(JSON.parse(f.calls[1].options.body)).toHaveLength(1)
  })

  it('sends nothing for an empty list', async () => {
    const f = fakeFetch([{ status: 200, body: { saved: 0, rejected: 0 } }])
    expect(await uploadDetections('https://x.com', [], { fetchImpl: f })).toEqual({ saved: 0, rejected: 0 })
    expect(f.calls).toHaveLength(0)
  })

  it('shows the message the server gave when it refuses', async () => {
    const f = fakeFetch([{ status: 400, body: { error: 'at most 500 readings per request' } }])
    let message = ''
    try { await uploadDetections('https://x.com', [item(1)], { fetchImpl: f }) } catch (e) { message = e.message }
    expect(message).toBe('at most 500 readings per request')
  })

  it('has a fallback message when the error has no body', async () => {
    const f = fakeFetch([{ status: 500, body: null }])
    let message = ''
    try { await uploadDetections('https://x.com', [item(1)], { fetchImpl: f }) } catch (e) { message = e.message }
    expect(message).toContain('500')
  })
})

describe('fetchClusters', () => {
  it('asks for all spots by default', async () => {
    const f = fakeFetch([{ status: 200, body: [] }])
    await fetchClusters('https://x.com', {}, f)
    expect(f.calls[0].url).toBe('https://x.com/api/clusters')
  })

  it('adds the filters', async () => {
    const f = fakeFetch([{ status: 200, body: [{ id: 1 }] }])
    const spots = await fetchClusters('https://x.com', { minReports: 2, minSeverity: 'moderate' }, f)
    expect(spots).toHaveLength(1)
    expect(f.calls[0].url).toBe('https://x.com/api/clusters?minReports=2&minSeverity=moderate')
  })
})
