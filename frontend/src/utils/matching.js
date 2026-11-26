// Compares the app's automatic detections with the bumps you marked by hand.
// A "found" mark has exactly one detection matched to it. A detection with no
// mark is a "false alarm". A mark with no detection is "missed".
import { distanceMeters } from './geo'

function summarise(pairs, marks, detections) {
  const usedMarks = new Set(pairs.map((p) => p.mark))
  const usedDetections = new Set(pairs.map((p) => p.detection))
  const missed = marks.filter((m) => !usedMarks.has(m))
  const falseAlarms = detections.filter((d) => !usedDetections.has(d))
  return {
    pairs,
    missed,
    falseAlarms,
    found: pairs.length,
    total: marks.length,
    rate: marks.length > 0 ? pairs.length / marks.length : null,
  }
}

// Greedy one-to-one matching: take the closest candidate pairs first.
function assign(candidates, marks, detections) {
  candidates.sort((a, b) => a.cost - b.cost)
  const usedMarks = new Set()
  const usedDetections = new Set()
  const pairs = []
  for (const c of candidates) {
    if (usedMarks.has(c.mark) || usedDetections.has(c.detection)) continue
    usedMarks.add(c.mark)
    usedDetections.add(c.detection)
    pairs.push({ mark: c.mark, detection: c.detection })
  }
  return summarise(pairs, marks, detections)
}

// Use when you tapped the marks DURING the ride. The tap comes just after the bump,
// so a detection counts if it is up to `preS` seconds before the tap or `postS` after.
export function matchByTime(detections, marks, preS = 2.0, postS = 0.5) {
  const candidates = []
  for (const mark of marks) {
    for (const detection of detections) {
      const dt = detection.t - mark.t // negative = detection before the tap
      if (dt >= -preS * 1000 && dt <= postS * 1000) {
        candidates.push({ mark, detection, cost: Math.abs(dt) })
      }
    }
  }
  return assign(candidates, marks, detections)
}

// Use when the marks come from a different run (for example a survey walk), so only
// the place can be compared: a detection counts if it is within `radiusM` metres.
export function matchByDistance(detections, marks, radiusM = 20) {
  const candidates = []
  for (const mark of marks) {
    if (mark.lat == null || mark.lng == null) continue
    for (const detection of detections) {
      if (detection.lat == null || detection.lng == null) continue
      const d = distanceMeters(mark.lat, mark.lng, detection.lat, detection.lng)
      if (d <= radiusM) candidates.push({ mark, detection, cost: d })
    }
  }
  return assign(candidates, marks, detections)
}
