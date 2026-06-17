import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { topoSort, nowTime, agentById, modelById } from '@/lib/utils'
import { useWorkflowsStore } from './workflowsStore'
import { useAgentsStore }   from './agentsStore'
import type { LogEvent, RunState } from '@/types'

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

      // Topological sort
      const order = topoSort(wf.nodes.map(n => n.id), wf.edges)

      for (const nodeId of order) {
        const node = wf.nodes.find(n => n.id === nodeId)
        if (!node) continue

        const agent = agentById(agents, node.agentId)
        const model = modelById(agent.model)

        set(state => { state.runningNodeId = nodeId })
        useWorkflowsStore.getState().setNodeStatuses(wfId, { [nodeId]: 'running' })

        push('running', `[${agent.emoji} ${agent.name}] ${node.label}`,
          `${model.provider}/${model.label} · ${node.type}`)

        // Simulated async execution (replace with real API calls)
        await new Promise<void>(r => setTimeout(r, 800 + Math.random() * 900))

        const ok = agent.status !== 'warn' || Math.random() > 0.35
        useWorkflowsStore.getState().setNodeStatuses(wfId, { [nodeId]: ok ? 'done' : 'error' })

        push(
          ok ? 'done' : 'error',
          ok ? `✓ ${node.label}` : `✗ ${node.label} FAILED`,
          ok ? '' : agent.status === 'warn' ? 'AGENT DEGRADED — retry 1/3' : ''
        )

        if (!ok) await new Promise<void>(r => setTimeout(r, 400))
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
