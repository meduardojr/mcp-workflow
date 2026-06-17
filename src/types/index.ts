// ─── Agent ────────────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'idle' | 'warn' | 'offline'

export interface Agent {
  id: string
  name: string
  emoji: string
  caps: string[]
  status: AgentStatus
  version: string
  model: string
}

// ─── AI Model ─────────────────────────────────────────────────────────────────

export type ModelTier = 'fast' | 'powerful'

export interface AIModel {
  id: string
  label: string
  provider: string
  tier: ModelTier
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export type NodeStatus = 'idle' | 'running' | 'done' | 'error'
export type ExecutionMode = 'dag' | 'sequential' | 'parallel'

export interface TaskNode {
  id: string
  x: number
  y: number
  label: string
  type: string
  agentId: string
  status: NodeStatus
  prompt: string
}

export interface WorkflowEdge {
  id: string
  from: string
  to: string
}

export interface Schedule {
  mode: 'once' | 'daily' | 'weekly'
  time: string
  days: string[]
}

export interface Workflow {
  id: string
  name: string
  mode: ExecutionMode
  createdAt: string
  nodes: TaskNode[]
  edges: WorkflowEdge[]
  schedule: Schedule | null
}

// ─── Execution ────────────────────────────────────────────────────────────────

export type LogEventType = 'info' | 'running' | 'done' | 'error'
export type RunState = 'idle' | 'running' | 'done'

export interface LogEvent {
  type: LogEventType
  msg: string
  detail: string
  time: string
}

// ─── Task types ───────────────────────────────────────────────────────────────

export interface TaskType {
  value: string
  label: string
  defaultAgent: string
}
