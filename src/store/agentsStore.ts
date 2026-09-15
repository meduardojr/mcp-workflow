import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { SEED_AGENTS } from '@/lib/constants'
import { uid } from '@/lib/utils'
import type { Agent } from '@/types'
import { useWorkflowsStore } from './workflowsStore'

interface AgentsState {
  agents: Agent[]
  // actions
  addAgent:    (data: Omit<Agent, 'id' | 'version'>) => void
  updateAgent: (id: string, patch: Partial<Agent>) => void
  removeAgent: (id: string) => boolean
}

export const useAgentsStore = create<AgentsState>()(
  immer(set => ({
    agents: SEED_AGENTS,

    addAgent: data =>
      set(state => {
        const newAgent: Agent = {
          ...data,
          id:      uid('agent'),
          version: '1.0.0',
        }
        state.agents.push(newAgent)
      }),

    updateAgent: (id, patch) =>
      set(state => {
        const idx = state.agents.findIndex(a => a.id === id)
        if (idx !== -1) Object.assign(state.agents[idx], patch)
      }),

    removeAgent: id => {
      if (useWorkflowsStore.getState().workflows.some(workflow => workflow.nodes.some(node => node.agentId === id))) return false
      let removed = false
      set(state => {
        removed = state.agents.some(agent => agent.id === id)
        state.agents = state.agents.filter(a => a.id !== id)
      })
      return removed
    },
  }))
)
