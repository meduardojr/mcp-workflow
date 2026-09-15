import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { SEED_WORKFLOWS } from '@/lib/constants'
import { uid } from '@/lib/utils'
import { validateGraph } from '@/lib/executionEngine'
import { isValidSchedule } from '@/lib/schedule'
import type { ExecutionMode, Schedule, TaskNode, Workflow, WorkflowEdge } from '@/types'

interface WorkflowsState {
  workflows:   Workflow[]
  activeId:    string | null
  // workflow CRUD
  createWorkflow: (name: string, mode: ExecutionMode) => string
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  setActiveId:    (id: string | null) => void
  // node CRUD
  addNode:        (wfId: string, node: Omit<TaskNode, 'id'>) => string
  updateNode:     (wfId: string, nodeId: string, patch: Partial<TaskNode>) => void
  removeNode:     (wfId: string, nodeId: string) => void
  // edge CRUD
  addEdge:        (wfId: string, from: string, to: string) => boolean
  removeEdge:     (wfId: string, edgeId: string) => void
  // schedule
  setSchedule:    (wfId: string, schedule: Schedule | null) => void
  // bulk node status update (used by execution engine)
  setNodeStatuses:(wfId: string, statuses: Record<string, TaskNode['status']>) => void
}

export const useWorkflowsStore = create<WorkflowsState>()(
  immer(set => ({
    workflows: SEED_WORKFLOWS,
    activeId:  SEED_WORKFLOWS[0]?.id ?? null,

    createWorkflow: (name, mode) => {
      const id = uid('wf')
      set(state => {
        state.workflows.push({
          id,
          name,
          mode,
          createdAt: new Date().toISOString().slice(0, 10),
          nodes: [],
          edges: [],
          schedule: null,
        })
        state.activeId = id
      })
      return id
    },

    updateWorkflow: (id, patch) =>
      set(state => {
        const wf = state.workflows.find(w => w.id === id)
        if (wf) Object.assign(wf, patch)
      }),

    deleteWorkflow: id =>
      set(state => {
        state.workflows = state.workflows.filter(w => w.id !== id)
        if (state.activeId === id) {
          state.activeId = state.workflows[0]?.id ?? null
        }
      }),

    setActiveId: id =>
      set(state => { state.activeId = id }),

    addNode: (wfId, nodeData) => {
      const id = uid('n')
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (wf) wf.nodes.push({ ...nodeData, id })
      })
      return id
    },

    updateNode: (wfId, nodeId, patch) =>
      set(state => {
        const wf  = state.workflows.find(w => w.id === wfId)
        const node = wf?.nodes.find(n => n.id === nodeId)
        if (node) Object.assign(node, patch)
      }),

    removeNode: (wfId, nodeId) =>
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (!wf) return
        wf.nodes  = wf.nodes.filter(n => n.id !== nodeId)
        wf.edges  = wf.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
      }),

    addEdge: (wfId, from, to) => {
      let added = false
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (!wf) return
        const edge: WorkflowEdge = { id: uid('e'), from, to }
        if (validateGraph(wf.nodes, [...wf.edges, edge]).valid) {
          wf.edges.push(edge)
          added = true
        }
      })
      return added
    },

    removeEdge: (wfId, edgeId) =>
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (wf) wf.edges = wf.edges.filter(e => e.id !== edgeId)
      }),

    setSchedule: (wfId, schedule) =>
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (wf && (schedule === null || isValidSchedule(schedule))) wf.schedule = schedule
      }),

    setNodeStatuses: (wfId, statuses) =>
      set(state => {
        const wf = state.workflows.find(w => w.id === wfId)
        if (!wf) return
        for (const node of wf.nodes) {
          if (statuses[node.id]) node.status = statuses[node.id]
        }
      }),
  }))
)

// ─── Derived selectors ────────────────────────────────────────────────────────
export const selectActiveWorkflow = (state: WorkflowsState): Workflow | null =>
  state.workflows.find(w => w.id === state.activeId) ?? null
