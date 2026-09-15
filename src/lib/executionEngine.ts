import type { ExecutionMode, NodeStatus, WorkflowEdge } from '@/types'

export interface ExecutionNode { id: string }
export interface GraphValidation { valid: boolean; errors: string[] }

export function validateGraph(nodes: ExecutionNode[], edges: Pick<WorkflowEdge, 'from' | 'to'>[]): GraphValidation {
  const ids = new Set(nodes.map(node => node.id))
  const errors: string[] = []
  const pairs = new Set<string>()

  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Edge ${edge.from} → ${edge.to} has a missing endpoint`)
    if (edge.from === edge.to) errors.push(`Node ${edge.from} cannot connect to itself`)
    const pair = `${edge.from}\0${edge.to}`
    if (pairs.has(pair)) errors.push(`Edge ${edge.from} → ${edge.to} is duplicated`)
    pairs.add(pair)
  }

  if (errors.length === 0) {
    const indegree = new Map(nodes.map(node => [node.id, 0]))
    const children = new Map(nodes.map(node => [node.id, [] as string[]]))
    for (const edge of edges) {
      indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
      children.get(edge.from)?.push(edge.to)
    }
    const queue = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id)
    let visited = 0
    while (queue.length) {
      const id = queue.shift()!
      visited++
      for (const child of children.get(id) ?? []) {
        const next = (indegree.get(child) ?? 1) - 1
        indegree.set(child, next)
        if (next === 0) queue.push(child)
      }
    }
    if (visited !== nodes.length) errors.push('Workflow contains a cycle')
  }
  return { valid: errors.length === 0, errors }
}

interface RunOptions<T extends ExecutionNode> {
  nodes: T[]
  edges: Pick<WorkflowEdge, 'from' | 'to'>[]
  mode: ExecutionMode
  maxAttempts?: number
  execute: (node: T, attempt: number) => Promise<boolean>
  onStatus?: (node: T, status: NodeStatus, attempt: number) => void
}

export async function executeWorkflow<T extends ExecutionNode>(options: RunOptions<T>): Promise<Record<string, NodeStatus>> {
  const { nodes, edges, mode, execute, onStatus } = options
  const validation = validateGraph(nodes, edges)
  if (!validation.valid) throw new Error(validation.errors.join('; '))
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3)
  const statuses: Record<string, NodeStatus> = Object.fromEntries(nodes.map(node => [node.id, 'idle']))
  const byId = new Map(nodes.map(node => [node.id, node]))
  const parents = new Map(nodes.map(node => [node.id, [] as string[]]))
  for (const edge of edges) parents.get(edge.to)?.push(edge.from)

  const setStatus = (node: T, status: NodeStatus, attempt = 0) => {
    statuses[node.id] = status
    onStatus?.(node, status, attempt)
  }
  const runOne = async (node: T) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setStatus(node, 'running', attempt)
      if (await execute(node, attempt)) {
        setStatus(node, 'done', attempt)
        return
      }
    }
    setStatus(node, 'error', maxAttempts)
  }
  const canRun = (node: T) => (parents.get(node.id) ?? []).every(id => statuses[id] === 'done')
  const isBlocked = (node: T) => (parents.get(node.id) ?? []).some(id => statuses[id] === 'error' || statuses[id] === 'blocked')

  if (mode === 'parallel') {
    await Promise.all(nodes.map(runOne))
    return statuses
  }

  while (Object.values(statuses).some(status => status === 'idle')) {
    const idle = nodes.filter(node => statuses[node.id] === 'idle')
    for (const node of idle.filter(isBlocked)) setStatus(node, 'blocked')
    const ready = nodes.filter(node => statuses[node.id] === 'idle' && canRun(node))
    if (!ready.length) break
    if (mode === 'sequential') await runOne(ready[0])
    else await Promise.all(ready.map(runOne))
  }

  for (const [id, status] of Object.entries(statuses)) {
    if (status === 'idle') setStatus(byId.get(id)!, 'blocked')
  }
  return statuses
}
