import React, { useState } from 'react'
import { COLORS, MONO, SANS, ALL_CAPS, EMOJI_POOL, AI_MODELS, MODEL_PROVIDERS, PROVIDER_COLOR } from '@/lib/constants'
import { modelById, pillVariant } from '@/lib/utils'
import { styles, Dot } from '@/features/ui'
import type { Agent, AgentStatus } from '@/types'

// ─── Agent card ───────────────────────────────────────────────────────────────
interface AgentCardProps {
  agent: Agent
  expanded: boolean
  onToggle: () => void
  onSave: (patch: Partial<Agent>) => void
  onDelete: () => void
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, expanded, onToggle, onSave, onDelete }) => {
  const m   = modelById(agent.model)
  const pc  = PROVIDER_COLOR[m.provider] ?? COLORS.amber
  return (
    <div>
      <div
        onClick={onToggle}
        style={{ background: expanded ? COLORS.amberDim : COLORS.surface2, border: `1px solid ${expanded ? COLORS.amber : COLORS.border2}`, borderRadius: 4, padding: '12px 14px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{agent.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13 }}>{agent.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.amber, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.id}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: pc, marginTop: 3 }}>{m.label}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span style={styles.pill(pillVariant(agent.status))}>
              <Dot color="currentColor" sz={4} />{agent.status}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: COLORS.muted2 }}>v{agent.version}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {agent.caps.map(c => (
            <span key={c} style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: '1px 5px' }}>{c}</span>
          ))}
        </div>
      </div>
      {expanded && (
        <AgentForm agent={agent} onSave={onSave} onDelete={onDelete} onCancel={onToggle} />
      )}
    </div>
  )
}

// ─── Agent form (edit + create) ───────────────────────────────────────────────
interface AgentFormProps {
  agent?: Agent
  isNew?: boolean
  onSave: (data: Omit<Agent, 'id' | 'version'>) => void
  onDelete?: () => void
  onCancel: () => void
}

export const AgentForm: React.FC<AgentFormProps> = ({ agent, isNew, onSave, onDelete, onCancel }) => {
  const [name,   setName]   = useState(agent?.name   ?? '')
  const [emoji,  setEmoji]  = useState(agent?.emoji  ?? '🤖')
  const [status, setStatus] = useState<AgentStatus>(agent?.status ?? 'active')
  const [caps,   setCaps]   = useState<string[]>(agent?.caps ?? [])
  const [model,  setModel]  = useState(agent?.model  ?? 'claude-sonnet-4-6')
  const [custom, setCustom] = useState('')

  const toggleCap = (c: string) => setCaps(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  const addCustom = () => {
    const trimmed = custom.trim()
    if (trimmed && !caps.includes(trimmed)) { setCaps(p => [...p, trimmed]); setCustom('') }
  }

  const selectedModel = modelById(model)
  const provCol = PROVIDER_COLOR[selectedModel.provider] ?? COLORS.amber

  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.amber}40`, borderRadius: 4, padding: 14, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.amber, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {isNew ? '// NEW AGENT' : '// EDIT AGENT'}
      </div>

      {/* Emoji picker */}
      <div>
        <label style={styles.label}>Icon</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {EMOJI_POOL.map(em => (
            <span
              key={em}
              onClick={() => setEmoji(em)}
              style={{ fontSize: 16, cursor: 'pointer', padding: '4px 6px', borderRadius: 3, border: `1px solid ${emoji === em ? COLORS.amber : COLORS.border}`, background: emoji === em ? COLORS.amberDim : COLORS.surface2 }}
            >
              {em}
            </span>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label style={styles.label}>Name</label>
        <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Data Parser" autoFocus={isNew} />
      </div>

      {/* AI Model */}
      <div>
        <label style={styles.label}>AI Model</label>
        <div style={{ position: 'relative' }}>
          <select
            style={{ ...styles.input, appearance: 'none' } as React.CSSProperties}
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {MODEL_PROVIDERS.map(provider => (
              <optgroup key={provider} label={`── ${provider} ──`}>
                {AI_MODELS.filter(m => m.provider === provider).map(m => (
                  <option key={m.id} value={m.id}>{m.label} ({m.tier})</option>
                ))}
              </optgroup>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, pointerEvents: 'none', fontSize: 10 }}>▾</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: provCol, background: `${provCol}12`, border: `1px solid ${provCol}30`, borderRadius: 3, padding: '2px 8px' }}>
            {selectedModel.provider} / {selectedModel.label}
          </span>
        </div>
      </div>

      {/* Status */}
      <div>
        <label style={styles.label}>Status</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['active', 'idle', 'warn'] as AgentStatus[]).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              style={{ ...styles.btn(status === s ? (s === 'active' ? 'pri' : s === 'warn' ? 'danger' : 'sec') : 'sec', { flex: 1, fontSize: 10, padding: '6px 4px', textTransform: 'uppercase' as const }) }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <label style={styles.label}>Capabilities</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {ALL_CAPS.map(c => (
            <button key={c} onClick={() => toggleCap(c)}
              style={{ padding: '3px 8px', borderRadius: 3, fontSize: 9, fontFamily: MONO, cursor: 'pointer', border: `1px solid ${caps.includes(c) ? COLORS.amber : COLORS.border}`, background: caps.includes(c) ? COLORS.amberDim : COLORS.surface2, color: caps.includes(c) ? COLORS.amber : COLORS.muted }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...styles.input, flex: 1 }} value={custom} placeholder="custom capability…"
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom() }} />
          <button style={styles.btn('sec')} onClick={addCustom}>ADD</button>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {!isNew && onDelete && <button style={styles.btn('danger')} onClick={onDelete}>DEL</button>}
        <button style={{ ...styles.btn('sec'), flex: 1 }} onClick={onCancel}>CANCEL</button>
        <button style={{ ...styles.btn('pri'), flex: 1 }} disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), emoji, status, caps, model })}>
          {isNew ? 'CREATE' : 'SAVE'}
        </button>
      </div>
    </div>
  )
}

// ─── AgentsView (full tab) ────────────────────────────────────────────────────
interface AgentsViewProps {
  agents: Agent[]
  onAdd: (data: Omit<Agent, 'id' | 'version'>) => void
  onUpdate: (id: string, patch: Partial<Agent>) => void
  onRemove: (id: string) => void
}

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, onAdd, onUpdate, onRemove }) => {
  const [editId,  setEditId]  = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  const activeCount   = agents.filter(a => a.status === 'active').length
  const degradedCount = agents.filter(a => a.status === 'warn').length

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Bus banner */}
      <div style={{ margin: '14px 16px', background: COLORS.surface3, border: '1px solid #38BDF820', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.cyan, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          MESSAGE BUS — in-memory · retry 3
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {['DIRECT', 'BROADCAST', 'CAPABILITY', 'ROUND-ROBIN'].map(c => (
            <span key={c} style={{ fontFamily: MONO, fontSize: 9, color: COLORS.cyan, background: COLORS.cyanDim, border: '1px solid #38BDF825', borderRadius: 3, padding: '2px 7px' }}>{c}</span>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: COLORS.green }}>
            ● {activeCount}/{agents.length} ONLINE
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', margin: '0 16px 14px', border: `1px solid ${COLORS.border2}`, borderRadius: 4, overflow: 'hidden' }}>
        {([['TOTAL', agents.length, null], ['ACTIVE', activeCount, COLORS.green], ['WARN', degradedCount, COLORS.amber]] as [string, number, string | null][]).map(([l, v, col], i) => (
          <div key={l} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.border2}` : 'none' }}>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: col ?? COLORS.text, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.map(a => (
          <AgentCard
            key={a.id}
            agent={a}
            expanded={editId === a.id}
            onToggle={() => setEditId(editId === a.id ? null : a.id)}
            onSave={patch => { onUpdate(a.id, patch); setEditId(null) }}
            onDelete={() => { onRemove(a.id); setEditId(null) }}
          />
        ))}

        {showNew
          ? <AgentForm isNew onSave={data => { onAdd(data); setShowNew(false) }} onCancel={() => setShowNew(false)} />
          : <button style={{ ...styles.btn('pri', { width: '100%', marginTop: 4, marginBottom: 24 }) }} onClick={() => setShowNew(true)}>
              + ADD AGENT
            </button>
        }
      </div>
    </div>
  )
}
