import React from 'react'
import { COLORS, MONO, SANS, TASK_TYPES, PROVIDER_COLOR } from '@/lib/constants'
import { modelById, pillVariant } from '@/lib/utils'
import { styles, Dot, SelectInput, SlidePanel } from '@/features/ui'
import type { Agent, TaskNode } from '@/types'

interface Props {
  open: boolean
  node: TaskNode | null
  agents: Agent[]
  onUpdate: (patch: Partial<TaskNode>) => void
  onDelete: () => void
  onClose: () => void
  connecting: boolean
  setConnecting: (v: boolean) => void
}

export const InspectorSheet: React.FC<Props> = ({
  open, node, agents, onUpdate, onDelete, onClose, connecting, setConnecting,
}) => (
  <SlidePanel open={open} onClose={onClose} title={node ? 'TASK NODE' : 'NO SELECTION'}>
    {!node ? (
      <div style={{ padding: 24, color: COLORS.muted, fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
        Tap DETAILS on a node to inspect it.
      </div>
    ) : (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Label */}
        <div>
          <label style={styles.label}>Label</label>
          <input style={styles.input} value={node.label} onChange={e => onUpdate({ label: e.target.value })} />
        </div>

        {/* Task type */}
        <SelectInput
          label="Task type"
          value={node.type}
          onChange={v => {
            const t = TASK_TYPES.find(x => x.value === v) ?? TASK_TYPES[0]
            onUpdate({ type: v, agentId: t.defaultAgent })
          }}
          options={TASK_TYPES.map(t => ({ value: t.value, label: t.label }))}
        />

        {/* Agent assignment */}
        <div>
          <label style={styles.label}>Assigned agent</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agents.map(a => {
              const sel = node.agentId === a.id
              const m   = modelById(a.model)
              const pc  = PROVIDER_COLOR[m.provider] ?? COLORS.amber
              return (
                <div
                  key={a.id}
                  onClick={() => onUpdate({ agentId: a.id })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4, border: `1px solid ${sel ? COLORS.amber : COLORS.border2}`, background: sel ? COLORS.amberDim : COLORS.bg, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{a.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: pc, marginTop: 2 }}>{m.label}</div>
                  </div>
                  <span style={styles.pill(pillVariant(a.status))}>
                    <Dot color="currentColor" sz={4} />
                    {a.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label style={styles.label}>Prompt</label>
          <textarea
            style={{ ...styles.input, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
            value={node.prompt || ''}
            onChange={e => onUpdate({ prompt: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...styles.btn(connecting ? 'danger' : 'cyan'), flex: 1 }} onClick={() => setConnecting(!connecting)}>
            {connecting ? '✕ CANCEL' : '⟶ CONNECT'}
          </button>
          <button style={styles.btn('danger')} onClick={onDelete}>DELETE</button>
        </div>
      </div>
    )}
  </SlidePanel>
)
