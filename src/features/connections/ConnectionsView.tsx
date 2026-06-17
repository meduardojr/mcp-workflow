import React from 'react'
import { COLORS, MONO, SANS } from '@/lib/constants'
import { agentById } from '@/lib/utils'
import { styles, HR } from '@/features/ui'
import type { Agent, Workflow } from '@/types'

interface Props {
  workflow: Workflow | null
  agents: Agent[]
  onDeleteEdge: (edgeId: string) => void
}

export const ConnectionsView: React.FC<Props> = ({ workflow, agents, onDeleteEdge }) => {
  if (!workflow) {
    return (
      <div style={{ padding: 32, color: COLORS.muted, fontFamily: MONO, fontSize: 11 }}>
        SELECT A WORKFLOW FIRST.
      </div>
    )
  }

  const { nodes, edges } = workflow

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: COLORS.text }}>CONNECTIONS</span>
        <span style={styles.pill('muted')}>{edges.length} EDGES</span>
      </div>
      <HR m="0 16px 12px" />

      {edges.length === 0 && (
        <div style={{ padding: '24px 20px', color: COLORS.muted, fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
          NO CONNECTIONS.<br />
          CANVAS → TAP NODE → CONNECT
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {edges.map(e => {
          const from = nodes.find(n => n.id === e.from)
          const to   = nodes.find(n => n.id === e.to)
          if (!from || !to) return null
          const fa = agentById(agents, from.agentId)
          const ta = agentById(agents, to.agentId)
          return (
            <div
              key={e.id}
              style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 4, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{fa.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>{from.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted }}>{from.type}</div>
              </div>
              <span style={{ color: COLORS.cyan, fontSize: 16, flexShrink: 0 }}>⟶</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>{to.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted }}>{to.type}</div>
              </div>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ta.emoji}</span>
              <button
                onClick={() => onDeleteEdge(e.id)}
                style={{ background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: 14, padding: 4, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
