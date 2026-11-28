// Small building blocks used by every screen.

// One reading: label, dotted leader, value.
export function Row({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <i className="lead" aria-hidden="true" />
      <dd>{value}</dd>
    </div>
  )
}

// The bar fixed to the bottom of the screen, holding the main action.
export function ActionBar({ children }) {
  return (
    <div className="actionbar">
      <div className="actionbar-inner">{children}</div>
    </div>
  )
}

export function Alert({ bad = false, children }) {
  return <p className={bad ? 'alert bad' : 'alert'}>{children}</p>
}
