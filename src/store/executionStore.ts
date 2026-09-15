import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { executeWorkflow, validateGraph } from '@/lib/executionEngine'
import { nowTime, modelById } from '@/lib/utils'
import { useWorkflowsStore } from './workflowsStore'
import { useAgentsStore } from './agentsStore'
import type { LogEvent, RunState, NodeStatus } from '@/types'

interface ExecutionState {
  runState: RunState
  runningNodeId: string | null
  log: LogEvent[]
  runWorkflow: (wfId: string) => Promise<void>
  clearLog: () => void
}

const wait = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))

export const useExecutionStore = create<ExecutionState>()(
  immer(set => ({
    runState: 'idle', runningNodeId: null, log: [],
    clearLog: () => set(state => { state.log = [] }),
    runWorkflow: async (wfId: string) => {
      if (useExecutionStore.getState().runState === 'running') return
      const wf = useWorkflowsStore.getState().workflows.find(item => item.id === wfId)
      if (!wf) return
      const agents = useAgentsStore.getState().agents
      const validation = validateGraph(wf.nodes, wf.edges)
      const push = (type: LogEvent['type'], msg: string, detail = '') => set(state => {
        state.log.push({ type, msg, detail, time: nowTime() })
      })
      set(state => { state.runState = 'running'; state.runningNodeId = null; state.log = [] })
      push('info', `RUN STARTED — ${wf.name}`)
      push('info', `MODE: ${wf.mode.toUpperCase()}`)
      if (!validation.valid) {
        push('error', 'WORKFLOW INVALID', validation.errors.join(' · '))
        set(state => { state.runState = 'error' })
        return
      }
      useWorkflowsStore.getState().setNodeStatuses(wfId, Object.fromEntries(wf.nodes.map(node => [node.id, 'idle' as NodeStatus])))
      try {
        const statuses = await executeWorkflow({
          nodes: wf.nodes, edges: wf.edges, mode: wf.mode, maxAttempts: 3,
          execute: async (node, attempt) => {
            const agent = agents.find(item => item.id === node.agentId)
            if (!agent) { push('error', `✗ ${node.label}`, `MISSING AGENT: ${node.agentId}`); return false }
            const model = modelById(agent.model)
            push('running', `[${agent.emoji} ${agent.name}] ${node.label}`, `${model.provider}/${model.label} · attempt ${attempt}/3`)
            await wait(800 + Math.random() * 900)
            return agent.status !== 'offline' && (agent.status !== 'warn' || Math.random() > 0.35)
          },
          onStatus: (node, status, attempt) => {
            useWorkflowsStore.getState().setNodeStatuses(wfId, { [node.id]: status })
            if (status === 'running') set(state => { state.runningNodeId = node.id })
            if (status === 'done') push('done', `✓ ${node.label}`, attempt > 1 ? `SUCCEEDED ON ATTEMPT ${attempt}/3` : '')
            if (status === 'error') push('error', `✗ ${node.label} FAILED`, `EXHAUSTED ${attempt} ATTEMPTS`)
            if (status === 'blocked') push('error', `⊘ ${node.label} BLOCKED`, 'UPSTREAM TASK FAILED')
          },
        })
        const failed = Object.values(statuses).some(status => status === 'error' || status === 'blocked')
        set(state => { state.runningNodeId = null; state.runState = failed ? 'error' : 'done' })
        push(failed ? 'error' : 'done', failed ? 'WORKFLOW FAILED ✗' : 'WORKFLOW COMPLETE ✓')
      } catch (error) {
        set(state => { state.runningNodeId = null; state.runState = 'error' })
        push('error', 'WORKFLOW FAILED', error instanceof Error ? error.message : 'Unknown execution error')
      }
    },
  }))
)
