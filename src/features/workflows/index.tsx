import React, { useState } from 'react'
import { COLORS, MONO, SANS } from '@/lib/constants'
import { styles, SlidePanel, Modal, SelectInput } from '@/features/ui'
import type { ExecutionMode, Schedule, Workflow } from '@/types'

// ─── Workflows slide-up sheet ─────────────────────────────────────────────────
interface WorkflowsSheetProps {
  open: boolean
  onClose: () => void
  workflows: Workflow[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export const WorkflowsSheet: React.FC<WorkflowsSheetProps> = ({
  open, onClose, workflows, activeId, onSelect, onCreate, onDelete,
}) => (
  <SlidePanel open={open} onClose={onClose} title="WORKFLOWS">
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {workflows.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: COLORS.muted, fontFamily: MONO, fontSize: 11 }}>
          NO WORKFLOWS YET
        </div>
      )}
      {workflows.map(wf => {
        const act = wf.id === activeId
        return (
          <div
            key={wf.id}
            onClick={() => { onSelect(wf.id); onClose() }}
            style={{ background: act ? COLORS.amberDim : COLORS.surface2, border: `1px solid ${act ? COLORS.amber : COLORS.border2}`, borderRadius: 4, padding: '12px 14px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{wf.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{wf.nodes.length} TASKS</span>
                  <span>·</span>
                  <span>{wf.edges.length} EDGES</span>
                  <span>·</span>
                  <span>{wf.mode.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                {wf.schedule && <span style={styles.pill('amber')}>⏱ {wf.schedule.mode}</span>}
                {act && (
                  <button
                    style={styles.btn('danger', { padding: '4px 8px', fontSize: 10 })}
                    onClick={e => { e.stopPropagation(); onDelete(wf.id) }}
                  >
                    DEL
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <button style={{ ...styles.btn('pri', { width: '100%', marginTop: 4 }) }} onClick={() => { onCreate(); onClose() }}>
        + NEW WORKFLOW
      </button>
    </div>
  </SlidePanel>
)

// ─── New workflow modal ───────────────────────────────────────────────────────
interface NewWorkflowModalProps {
  onClose: () => void
  onSave: (name: string, mode: ExecutionMode) => void
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<ExecutionMode>('dag')
  return (
    <Modal onClose={onClose} title="// NEW WORKFLOW">
      <div>
        <label style={styles.label}>Name</label>
        <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daily Briefing" autoFocus />
      </div>
      <SelectInput
        label="Execution mode"
        value={mode}
        onChange={v => setMode(v as ExecutionMode)}
        options={[
          { value: 'dag',        label: 'DAG — dependency-aware' },
          { value: 'sequential', label: 'Sequential' },
          { value: 'parallel',   label: 'Parallel' },
        ]}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...styles.btn('sec'), flex: 1 }} onClick={onClose}>CANCEL</button>
        <button style={{ ...styles.btn('pri'), flex: 1 }} disabled={!name.trim()} onClick={() => { onSave(name.trim(), mode); onClose() }}>
          CREATE
        </button>
      </div>
    </Modal>
  )
}

// ─── New task modal ───────────────────────────────────────────────────────────
import { TASK_TYPES, PROVIDER_COLOR } from '@/lib/constants'
import { agentById, modelById } from '@/lib/utils'
import type { Agent } from '@/types'

interface NewTaskModalProps {
  agents: Agent[]
  onClose: () => void
  onAdd: (data: { label: string; type: string; agentId: string; prompt: string }) => void
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ agents, onClose, onAdd }) => {
  const [label,  setLabel]  = useState('')
  const [type,   setType]   = useState('web_search')
  const [prompt, setPrompt] = useState('')

  const tt = TASK_TYPES.find(t => t.value === type) ?? TASK_TYPES[0]
  const da = agentById(agents, tt.defaultAgent)
  const m  = modelById(da.model)
  const pc = PROVIDER_COLOR[m.provider] ?? COLORS.amber

  return (
    <Modal onClose={onClose} title="// ADD TASK NODE">
      <div>
        <label style={styles.label}>Label</label>
        <input style={styles.input} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Fetch headlines" autoFocus />
      </div>
      <SelectInput label="Task type" value={type} onChange={setType} options={TASK_TYPES.map(t => ({ value: t.value, label: t.label }))} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4 }}>
        <span style={{ fontSize: 18 }}>{da.emoji}</span>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>Auto: {da.name}</div>
          <span style={{ fontFamily: MONO, fontSize: 9, color: pc }}>{m.label}</span>
        </div>
      </div>
      <div>
        <label style={styles.label}>Prompt</label>
        <textarea style={{ ...styles.input, resize: 'vertical', minHeight: 68 }} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Instructions…" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...styles.btn('sec'), flex: 1 }} onClick={onClose}>CANCEL</button>
        <button style={{ ...styles.btn('pri'), flex: 1 }} disabled={!label.trim()} onClick={() => { onAdd({ label: label.trim(), type, agentId: tt.defaultAgent, prompt }); onClose() }}>
          ADD
        </button>
      </div>
    </Modal>
  )
}

// ─── Schedule modal ───────────────────────────────────────────────────────────
interface ScheduleModalProps {
  current: Schedule | null
  onClose: () => void
  onSave: (schedule: Schedule | null) => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ current, onClose, onSave }) => {
  const [mode, setMode] = useState<Schedule['mode']>(current?.mode ?? 'once')
  const [time, setTime] = useState(current?.time ?? '09:00')
  const [days, setDays] = useState<string[]>(current?.days ?? [])

  const toggleDay = (d: string) => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  return (
    <Modal onClose={onClose} title="// SCHEDULE">
      <div>
        <label style={styles.label}>Frequency</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['once', 'daily', 'weekly'] as Schedule['mode'][]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ ...styles.btn(mode === m ? 'pri' : 'sec', { flex: 1, fontSize: 10, padding: '8px 4px', textTransform: 'uppercase' as const }) }}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={styles.label}>Time</label>
        <input type="time" style={styles.input} value={time} onChange={e => setTime(e.target.value)} />
      </div>
      {mode === 'weekly' && (
        <div>
          <label style={styles.label}>Days</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DAYS.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                style={{ padding: '5px 10px', borderRadius: 3, fontFamily: MONO, fontSize: 10, cursor: 'pointer', border: `1px solid ${days.includes(d) ? COLORS.amber : COLORS.border}`, background: days.includes(d) ? COLORS.amberDim : COLORS.surface2, color: days.includes(d) ? COLORS.amber : COLORS.muted }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        {current && <button style={styles.btn('danger')} onClick={() => { onSave(null); onClose() }}>REMOVE</button>}
        <button style={{ ...styles.btn('sec'), flex: 1 }} onClick={onClose}>CANCEL</button>
        <button style={{ ...styles.btn('pri'), flex: 1 }} onClick={() => { onSave({ mode, time, days }); onClose() }}>
          {current ? 'UPDATE' : 'SET'}
        </button>
      </div>
    </Modal>
  )
}
