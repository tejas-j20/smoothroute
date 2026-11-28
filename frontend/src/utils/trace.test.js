import { describe, it, expect } from 'vitest'
import { createTrace, pushTrace, traceValues } from './trace'

describe('trace', () => {
  it('starts empty', () => {
    expect(traceValues(createTrace(10))).toHaveLength(0)
  })

  it('shows a steady signal as almost no jolt', () => {
    const t = createTrace(50)
    for (let i = 0; i < 50; i++) pushTrace(t, 9.8, i * 20)
    expect(Math.max(...traceValues(t)) < 0.01).toBe(true)
  })

  it('shows a sudden spike as a large jolt', () => {
    const t = createTrace(50)
    for (let i = 0; i < 40; i++) pushTrace(t, 9.8, i * 20)
    pushTrace(t, 16.8, 40 * 20)
    const values = traceValues(t)
    expect(values[values.length - 1] > 5).toBe(true)
  })

  it('keeps only the newest readings', () => {
    const t = createTrace(3)
    ;[1, 2, 3, 4, 5].forEach((v, i) => pushTrace(t, v, i * 1000))
    expect(traceValues(t)).toHaveLength(3)
  })

  it('ignores readings that are not numbers', () => {
    const t = createTrace(5)
    pushTrace(t, NaN, 0)
    pushTrace(t, undefined, 10)
    expect(traceValues(t)).toHaveLength(0)
  })
})
