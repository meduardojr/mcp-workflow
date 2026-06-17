import { useState } from 'react'
import { useAgentsStore }    from '@/store/agentsStore'
import { useWorkflowsStore } from '@/store/workflowsStore'
import { useExecutionStore } from '@/store/executionStore'
import { COLORS, MONO, SANS, TASK_TYPES } from '@/lib/constants'
import { uid } from '@/lib/utils'
import { styles }            from '@/features/ui'
import { WorkflowCanvas, InspectorSheet } from '@/features/canvas'
import { AgentsView }        from '@/features/agents'
import { ConnectionsView }   from '@/features/connections'
import { RunLogView }        from '@/features/execution'
import {
  WorkflowsSheet,
  NewWorkflowModal,
  NewTaskModal,
  ScheduleModal,
} from '@/features/workflows'
import type { ExecutionMode, TaskNode } from '@/types'

// ─── Bottom nav items ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'canvas',      icon: '◈', label: 'Canvas'  },
  { id: 'agents',      icon: '◉', label: 'Agents'  },
  { id: 'connections', icon: '⟼', label: 'Edges'   },
  { id: 'log',         icon: '▤', label: 'Log'     },
] as const

type ViewId = typeof NAV[number]['id']

export default function App() {
  // ─── Store access ───────────────────────────────────────────────────────
  const agents      = useAgentsStore(s => s.agents)
  const addAgent    = useAgentsStore(s => s.addAgent)
  const updateAgent = useAgentsStore(s => s.updateAgent)
  const removeAgent = useAgentsStore(s => s.removeAgent)

  const workflows   = useWorkflowsStore(s => s.workflows)
  const activeId    = useWorkflowsStore(s => s.activeId)
  const setActiveId = useWorkflowsStore(s => s.setActiveId)
  const createWf    = useWorkflowsStore(s => s.createWorkflow)
  const deleteWf    = useWorkflowsStore(s => s.deleteWorkflow)
  const addNode     = useWorkflowsStore(s => s.addNode)
  const updateNode  = useWorkflowsStore(s => s.updateNode)
  const removeNode  = useWorkflowsStore(s => s.removeNode)
  const addEdge     = useWorkflowsStore(s => s.addEdge)
  const removeEdge  = useWorkflowsStore(s => s.removeEdge)
  const setSchedule = useWorkflowsStore(s => s.setSchedule)

  const runState    = useExecutionStore(s => s.runState)
  const runningNode = useExecutionStore(s => s.runningNodeId)
  const log         = useExecutionStore(s => s.log)
  const runWorkflow = useExecutionStore(s => s.runWorkflow)
  const clearLog    = useExecutionStore(s => s.clearLog)

  // ─── Local UI state ─────────────────────────────────────────────────────
  const [view,          setView]          = useState<ViewId>('canvas')
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [connecting,    setConnecting]    = useState(false)
  const [showWfs,       setShowWfs]       = useState(false)
  const [showInspector, setShowInspector] = useState(false)
  const [showNewWf,     setShowNewWf]     = useState(false)
  const [showNewTask,   setShowNewTask]   = useState(false)
  const [showSchedule,  setShowSchedule]  = useState(false)

  // ─── Derived ────────────────────────────────────────────────────────────
  const wf      = workflows.find(w => w.id === activeId) ?? null
  const selNode = wf?.nodes.find(n => n.id === selectedId) ?? null

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleViewDetails = (id: string) => {
    setSelectedId(id)
    setShowInspector(true)
  }

  const handleClearSelection = () => {
    setSelectedId(null)
    setShowInspector(false)
    setConnecting(false)
  }

  const handleAddEdge = (toId: string) => {
    if (!connecting || !selectedId || selectedId === toId || !wf) {
      setConnecting(false)
      return
    }
    addEdge(wf.id, selectedId, toId)
    setConnecting(false)
  }

  const handleCreateWorkflow = (name: string, mode: ExecutionMode) => {
    createWf(name, mode)
    setView('canvas')
  }

  const handleAddNode = (data: { label: string; type: string; agentId: string; prompt: string }) => {
    if (!wf) return
    const col = wf.nodes.length
    const id  = addNode(wf.id, {
      x:      40 + (col % 3) * 230,
      y:      60 + Math.floor(col / 3) * 160,
      status: 'idle',
      ...data,
    })
    handleViewDetails(id)
  }

  const handleDeleteNode = () => {
    if (!wf || !selectedId) return
    removeNode(wf.id, selectedId)
    setSelectedId(null)
    setShowInspector(false)
  }

  const handleUpdateNode = (patch: Partial<TaskNode>) => {
    if (!wf || !selectedId) return
    updateNode(wf.id, selectedId, patch)
  }

  const runLabel = runState === 'running' ? '⏳ RUNNING' : runState === 'done' ? '✓ DONE' : '▶ RUN'

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: SANS, background: COLORS.bg, color: COLORS.text, height: '100dvh', display: 'flex', flexDirection: 'column', fontSize: 14, overflow: 'hidden', maxWidth: 480, margin: '0 auto', position: 'relative' }}>

      {/* ── TOP BAR ── */}
      <header style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: '0 14px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0, zIndex: 50 }}>
        {/* Workflow selector */}
        <button
          onClick={() => setShowWfs(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.surface2, border: `1px solid ${COLORS.border2}`, borderRadius: 4, padding: '6px 12px', cursor: 'pointer', minWidth: 0, flex: 1, maxWidth: 220, color: COLORS.text }}
        >
          <span style={{ fontFamily: MONO, fontSize: 9, color: COLORS.amber, flexShrink: 0 }}>WF</span>
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
            {wf?.name ?? 'Select workflow'}
          </span>
          <span style={{ color: COLORS.muted, fontSize: 10, flexShrink: 0 }}>▾</span>
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {wf?.schedule && <span style={styles.pill('amber')}>⏱</span>}
          <button style={styles.btn('sec', { padding: '6px 10px', fontSize: 10 })} onClick={() => setShowSchedule(true)} disabled={!wf}>
            ⏱
          </button>
          <button
            style={{ ...styles.btn('pri', { padding: '7px 14px', fontSize: 11 }), opacity: runState === 'running' ? 0.6 : 1 }}
            onClick={() => wf && runWorkflow(wf.id)}
            disabled={!wf || runState === 'running'}
          >
            {runLabel}
          </button>
        </div>
      </header>

      {/* ── VIEW AREA ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* CANVAS */}
        {view === 'canvas' && (
          !wf ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted }}>NO WORKFLOW SELECTED</div>
              <button style={styles.btn('pri')} onClick={() => setShowWfs(true)}>SELECT WORKFLOW</button>
            </div>
          ) : (
            <>
              <WorkflowCanvas
                nodes={wf.nodes}
                edges={wf.edges}
                agents={agents}
                selectedId={showInspector ? selectedId : null}
                runningId={runningNode}
                connecting={connecting}
                onViewDetails={handleViewDetails}
                onClearSelection={handleClearSelection}
                onMove={(id, x, y) => updateNode(wf.id, id, { x, y })}
                onAddEdge={handleAddEdge}
              />
              {/* FAB */}
              <button
                style={{ position: 'absolute', bottom: 74, right: 14, zIndex: 10, ...styles.btn('sec', { padding: '10px 14px', fontSize: 11, borderRadius: 4, boxShadow: '0 4px 20px #00000060' }) }}
                onClick={() => setShowNewTask(true)}
              >
                + TASK
              </button>
            </>
          )
        )}

        {/* AGENTS */}
        {view === 'agents' && (
          <AgentsView
            agents={agents}
            onAdd={addAgent}
            onUpdate={updateAgent}
            onRemove={removeAgent}
          />
        )}

        {/* CONNECTIONS */}
        {view === 'connections' && (
          <ConnectionsView
            workflow={wf}
            agents={agents}
            onDeleteEdge={eid => wf && removeEdge(wf.id, eid)}
          />
        )}

        {/* RUN LOG */}
        {view === 'log' && (
          <RunLogView
            log={log}
            runState={runState}
            workflow={wf}
            onClear={clearLog}
          />
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexShrink: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        {NAV.map(({ id, icon, label }) => {
          const act = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{ flex: 1, padding: '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', borderTop: `2px solid ${act ? COLORS.amber : 'transparent'}`, transition: 'border-color .12s' }}
            >
              <span style={{ fontSize: 16, color: act ? COLORS.amber : COLORS.muted }}>{icon}</span>
              <span style={{ fontFamily: MONO, fontSize: 8, color: act ? COLORS.amber : COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
                {id === 'log' && log.length > 0 && <span style={{ marginLeft: 3, color: COLORS.amber }}>{log.length}</span>}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ── PANELS & MODALS ── */}
      <WorkflowsSheet
        open={showWfs}
        onClose={() => setShowWfs(false)}
        workflows={workflows}
        activeId={activeId}
        onSelect={id => { setActiveId(id); handleClearSelection(); setView('canvas') }}
        onCreate={() => setShowNewWf(true)}
        onDelete={deleteWf}
      />

      <InspectorSheet
        open={showInspector}
        onClose={() => { setShowInspector(false); setConnecting(false) }}
        node={selNode}
        agents={agents}
        onUpdate={handleUpdateNode}
        onDelete={handleDeleteNode}
        connecting={connecting}
        setConnecting={setConnecting}
      />

      {showNewWf && (
        <NewWorkflowModal
          onClose={() => setShowNewWf(false)}
          onSave={handleCreateWorkflow}
        />
      )}

      {showNewTask && wf && (
        <NewTaskModal
          agents={agents}
          onClose={() => setShowNewTask(false)}
          onAdd={handleAddNode}
        />
      )}

      {showSchedule && wf && (
        <ScheduleModal
          current={wf.schedule}
          onClose={() => setShowSchedule(false)}
          onSave={sched => setSchedule(wf.id, sched)}
        />
      )}
    </div>
  )
}
