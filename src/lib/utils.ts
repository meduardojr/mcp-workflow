import { AI_MODELS, TASK_TYPES } from './constants'
import type { Agent, AIModel, TaskType } from '@/types'

/** Generate a uid with a readable prefix */
export const uid = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`

/** Find an agent by id, falling back to the first agent */
export const agentById = (agents: Agent[], id: string): Agent =>
  agents.find(a => a.id === id) ?? agents[0]

/** Find a task type definition by value */
export const taskByType = (value: string): TaskType =>
  TASK_TYPES.find(t => t.value === value) ?? TASK_TYPES[0]

/** Find an AI model by id */
export const modelById = (id: string): AIModel =>
  AI_MODELS.find(m => m.id === id) ?? AI_MODELS[0]

/** Map a status string to a colour token key */
export const pillVariant = (status: string): string =>
  ({ active: 'green', idle: 'muted', warn: 'amber', running: 'cyan', done: 'green', error: 'red' }[status] ?? 'muted')

/** Topological sort of workflow nodes using Kahn's algorithm */
export function topoSort(
  nodeIds: string[],
  edges: { from: string; to: string }[]
): string[] {
  const inDegree = new Map<string, number>(nodeIds.map(id => [id, 0]))
  const adj = new Map<string, string[]>(nodeIds.map(id => [id, []]))

  for (const e of edges) {
    if (inDegree.has(e.to)) inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1)
    adj.get(e.from)?.push(e.to)
  }

  const queue = nodeIds.filter(id => (inDegree.get(id) ?? 0) === 0)
  const result: string[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighbour of adj.get(node) ?? []) {
      const deg = (inDegree.get(neighbour) ?? 1) - 1
      inDegree.set(neighbour, deg)
      if (deg === 0) queue.push(neighbour)
    }
  }

  // Fallback: include any nodes not reached (disconnected)
  const missing = nodeIds.filter(id => !result.includes(id))
  return [...result, ...missing]
}

/** Current time as HH:MM:SS */
export const nowTime = (): string => new Date().toTimeString().slice(0, 8)

/** Clamp a number between min and max */
export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val))
