import React, { useRef, useEffect } from 'react'
import { COLORS, MONO } from '@/lib/constants'
import { styles, HR } from '@/features/ui'
import type { LogEvent, RunState, Workflow } from '@/types'

interface Props {
  log: LogEvent[]
  runState: RunState
  workflow: Workflow | null
  onClear: () => void
}

const EVENT_COLOR: Record<string, string> = {
  error:   COLORS.red,
  done:    COLORS.green,
  running: COLORS.cyan,
  info:    COLORS.muted,
}

const EVENT_ICON: Record<string, string> = {
  running: '▶',
  done:    '✓',
  error:   '✗',
  info:    '·',
}

export const RunLogView: React.FC<Props> = ({ log, runState, workflow, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: COLORS.text }}>RUN LOG</span>
          {runState === 'running' && <span style={styles.pill('cyan')}>LIVE</span>}
          {runState === 'done'    && <span style={styles.pill('green')}>DONE</span>}
        </div>
        <button style={styles.btn('sec', { padding: '5px 12px', fontSize: 10 })} onClick={onClear}>CLEAR</button>
      </div>
      <HR m="0 16px 0" />

      {log.length === 0 && (
        <div style={{ padding: '24px 20px', color: COLORS.muted, fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
          NO RUNS YET.<br />
          {workflow ? `HIT ▶ TO RUN "${workflow.name.toUpperCase()}"` : 'SELECT A WORKFLOW.'}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
        {log.map((e, i) => (
          <div
            key={i}
            style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}40`, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: EVENT_COLOR[e.type] ?? COLORS.muted }}>
                {EVENT_ICON[e.type] ?? '·'} {e.msg}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted2, flexShrink: 0 }}>{e.time}</span>
            </div>
            {e.detail && (
              <span style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted2, paddingLeft: 14 }}>{e.detail}</span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
