// Autosave using IndexedDB, the database built into every browser.
//
// A ride can have tens of thousands of readings, so we do NOT rewrite the whole
// ride on every save. Instead:
//   - "sessions" store: one small record per ride (notes, marks, status)
//   - "chunks" store:   the readings, saved in pieces (a new piece every few seconds)
// Saved data belongs to the website address it was saved from, so it is only
// visible when you open the SAME link again.
const DB_NAME = 'smoothroute'
const DB_VERSION = 1
let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'))
        return
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        db.createObjectStore('sessions', { keyPath: 'id' })
        db.createObjectStore('chunks', { keyPath: ['sessionId', 'seq'] })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbPromise.catch(() => {
      dbPromise = null // allow a retry next time
    })
  }
  return dbPromise
}

const finished = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

const wait = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const chunkRange = (id) => IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER])

export async function saveSession(session) {
  const db = await openDb()
  const tx = db.transaction('sessions', 'readwrite')
  tx.objectStore('sessions').put(session)
  await finished(tx)
}

export async function saveChunk(sessionId, seq, rows) {
  const db = await openDb()
  const tx = db.transaction('chunks', 'readwrite')
  tx.objectStore('chunks').put({ sessionId, seq, rows })
  await finished(tx)
}

// Newest ride first
export async function listSessions() {
  const db = await openDb()
  const all = await wait(db.transaction('sessions').objectStore('sessions').getAll())
  return all.sort((a, b) => b.startedAt - a.startedAt)
}

export async function loadSession(id) {
  const db = await openDb()
  const tx = db.transaction(['sessions', 'chunks'])
  const sessionReq = tx.objectStore('sessions').get(id)
  const chunksReq = tx.objectStore('chunks').getAll(chunkRange(id))
  const [session, chunks] = await Promise.all([wait(sessionReq), wait(chunksReq)])
  chunks.sort((a, b) => a.seq - b.seq)
  return { session, samples: chunks.flatMap((c) => c.rows) }
}

export async function deleteSession(id) {
  const db = await openDb()
  const tx = db.transaction(['sessions', 'chunks'], 'readwrite')
  tx.objectStore('sessions').delete(id)
  tx.objectStore('chunks').delete(chunkRange(id))
  await finished(tx)
}
