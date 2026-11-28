// Draws the roughness trace on a canvas. `threshold` (jolt units) is drawn as a dashed line:
// every spike that crosses it counts as a bump.
export function drawTrace(ctx, width, height, values, threshold, colors) {
  ctx.clearRect(0, 0, width, height)
  const top = Math.max(6, (threshold || 0) * 2.2) // top of the chart, in jolt units
  const y = (v) => height - 6 - (Math.min(v, top) / top) * (height - 12)

  if (threshold) {
    ctx.save()
    ctx.strokeStyle = colors.threshold
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(0, y(threshold))
    ctx.lineTo(width, y(threshold))
    ctx.stroke()
    ctx.restore()
  }

  if (values.length < 2) return
  ctx.strokeStyle = colors.line
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const step = width / (values.length - 1)
  values.forEach((v, i) => (i === 0 ? ctx.moveTo(0, y(v)) : ctx.lineTo(i * step, y(v))))
  ctx.stroke()
}
