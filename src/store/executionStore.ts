import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { topoSort, nowTime, agentById, modelById } from '@/lib/utils'
import { useWorkflowsStore } from './workflowsStore'
import { useAgentsStore }   from './agentsStore'
import type { LogEvent, RunState, NodeStatus } from '@/types'

interface ExecutionState {
  runState:     RunState
  runningNodeId:string | null
  log:          LogEvent[]
  // actions
  runWorkflow:  (wfId: string) => Promise<void>
  clearLog:     () => void
}

export const useExecutionStore = create<ExecutionState>()(
  immer(set => ({
    runState:      'idle',
    runningNodeId: null,
    log:           [],

    clearLog: () => set(state => { state.log = [] }),

    runWorkflow: async (wfId: string) => {
      const { runState } = useExecutionStore.getState()
      if (runState === 'running') return

      const wf     = useWorkflowsStore.getState().workflows.find(w => w.id === wfId)
      const agents = useAgentsStore.getState().agents
      if (!wf) return

      const push = (type: LogEvent['type'], msg: string, detail = '') =>
        set(state => {
          state.log.push({ type, msg, detail, time: nowTime() })
        })

      set(state => {
        state.runState      = 'running'
        state.runningNodeId = null
        state.log           = []
      })

      push('info', `RUN STARTED — ${wf.name}`)
      push('info', `MODE: ${wf.mode.toUpperCase()}`)

      // Reset all node statuses to idle
      const idleStatuses = Object.fromEntries(wf.nodes.map(n => [n.id, 'idle' as const]))
      useWorkflowsStore.getState().setNodeStatuses(wfId, idleStatuses)

      // Set up parents and children lookups
      const parentsMap = new Map<string, string[]>()
      const childrenMap = new Map<string, string[]>()
      for (const node of wf.nodes) {
        parentsMap.set(node.id, wf.edges.filter(e => e.to === node.id).map(e => e.from))
        childrenMap.set(node.id, wf.edges.filter(e => e.from === node.id).map(e => e.to))
      }

      const nodeStatuses = new Map<string, NodeStatus>()
      for (const node of wf.nodes) {
        nodeStatuses.set(node.id, 'idle')
      }

      let runningCount = 0
      let resolveWorkflow: (() => void) | null = null
      const workflowPromise = new Promise<void>(resolve => {
        resolveWorkflow = resolve
      })

      const executeNode = async (nodeId: string) => {
        const node = wf.nodes.find(n => n.id === nodeId)
        if (!node) return

        runningCount++
        nodeStatuses.set(nodeId, 'running')
        set(state => { state.runningNodeId = nodeId })
        useWorkflowsStore.getState().setNodeStatuses(wfId, { [nodeId]: 'running' })

        const agent = agentById(agents, node.agentId)
        const model = modelById(agent.model)

        push('running', `[${agent.emoji} ${agent.name}] ${node.label}`,
          `${model.provider}/${model.label} · ${node.type}`)

        // Simulated async execution (replace with real API calls)
        await new Promise<void>(r => setTimeout(r, 800 + Math.random() * 900))

        const ok = agent.status !== 'warn' || Math.random() > 0.35
        const finalStatus: NodeStatus = ok ? 'done' : 'error'

        nodeStatuses.set(nodeId, finalStatus)
        useWorkflowsStore.getState().setNodeStatuses(wfId, { [nodeId]: finalStatus })

        push(
          ok ? 'done' : 'error',
          ok ? `✓ ${node.label}` : `✗ ${node.label} FAILED`,
          ok ? '' : agent.status === 'warn' ? 'AGENT DEGRADED — retry 1/3' : ''
        )

        if (!ok) {
          await new Promise<void>(r => setTimeout(r, 400))
        }

        // Trigger child nodes if successful
        if (ok) {
          const children = childrenMap.get(nodeId) ?? []
          for (const childId of children) {
            const parents = parentsMap.get(childId) ?? []
            const allParentsDone = parents.every(pId => nodeStatuses.get(pId) === 'done')
            if (allParentsDone && nodeStatuses.get(childId) === 'idle') {
              executeNode(childId)
            }
          }
        }

        runningCount--
        if (runningCount === 0) {
          resolveWorkflow?.()
        }
      }

      // Start the root nodes (nodes with 0 incoming dependencies)
      const rootNodes = wf.nodes.filter(n => (parentsMap.get(n.id) ?? []).length === 0)

      if (rootNodes.length === 0 && wf.nodes.length > 0) {
        // Fallback: if there are nodes but no roots (e.g. cyclic), start topo sorted first node.
        const order = topoSort(wf.nodes.map(n => n.id), wf.edges)
        if (order.length > 0) {
          executeNode(order[0])
        }
      } else {
        for (const root of rootNodes) {
          executeNode(root.id)
        }
      }

      // Wait for all execution paths to finish
      if (wf.nodes.length > 0) {
        await workflowPromise
      }

      set(state => {
        state.runningNodeId = null
        state.runState      = 'done'
      })
      push('done', 'WORKFLOW COMPLETE ✓')

      await new Promise<void>(r => setTimeout(r, 3000))
      set(state => { state.runState = 'idle' })
    },
  }))
)
