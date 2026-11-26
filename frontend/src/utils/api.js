// Talks to the SmoothRoute backend over HTTP.
import { chunk } from './upload'

const TIMEOUT_MS = 60000 // a sleeping free server can take about a minute to wake up

async function request(url, options = {}, fetchImpl = globalThis.fetch) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response
  try {
    response = await fetchImpl(url, { ...options, signal: controller.signal })
  } catch (e) {
    throw new Error(
      e && e.name === 'AbortError'
        ? 'The server took too long to answer. If it was asleep, try again in a minute.'
        : 'Could not reach the server. Check the address and that the backend is running.',
    )
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) {
    let message = ''
    try {
      const body = await response.json()
      message = body && body.error ? body.error : ''
    } catch {
      // the error body was not JSON
    }
    throw new Error(message || `The server answered with an error (${response.status}).`)
  }
  return response.json()
}

export function checkHealth(base, fetchImpl) {
  return request(`${base}/api/health`, {}, fetchImpl)
}

// Sends detected bumps in pieces. Returns how many the server saved or rejected.
export async function uploadDetections(base, items, { fetchImpl, chunkSize = 200 } = {}) {
  let saved = 0
  let rejected = 0
  for (const part of chunk(items, chunkSize)) {
    const result = await request(
      `${base}/api/readings/batch`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(part) },
      fetchImpl,
    )
    saved += result.saved
    rejected += result.rejected
  }
  return { saved, rejected }
}

// Rough spots for the public map. minReports: 1 = every spot, 2 = only confirmed ones.
export function fetchClusters(base, { minReports = 1, minSeverity = '' } = {}, fetchImpl) {
  const params = new URLSearchParams()
  if (minReports > 1) params.set('minReports', String(minReports))
  if (minSeverity) params.set('minSeverity', minSeverity)
  const query = params.toString()
  return request(`${base}/api/clusters${query ? `?${query}` : ''}`, {}, fetchImpl)
}
