import { ActionBar, Alert } from './ui'
import LiveReadout from './LiveReadout'
import MarkPanel from './MarkPanel'
import RoughnessTrace from './RoughnessTrace'

export default function RecordingScreen({
  live, trace, traceThreshold,
  marksCount, markCounts, storageOk,
  onMark, onUndo, onStop,
}) {
  return (
    <main className="page">
      <section>
        <h1>Recording</h1>
        <RoughnessTrace trace={trace} threshold={traceThreshold} dark />
        <LiveReadout live={live} recording marksCount={marksCount} />
        {!storageOk && (
          <Alert bad>Autosave is not working in this browser. Download the CSV before you leave the page.</Alert>
        )}
      </section>

      <MarkPanel counts={markCounts} total={marksCount} onMark={onMark} onUndo={onUndo} />

      <ActionBar>
        <button className="stop" onClick={onStop}>Stop recording</button>
      </ActionBar>
    </main>
  )
}
