import type { Config, Context } from '@netlify/functions'
import { getUser } from '@netlify/identity'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { agents, workflows, workflowVersions } from '../../db/schema.js'

const agentSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().trim().min(1).max(100), emoji: z.string().min(1).max(16),
  caps: z.array(z.string().min(1).max(64)).max(30), status: z.enum(['active', 'idle', 'warn', 'offline']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), model: z.string().min(1).max(100),
})
const nodeSchema = z.object({
  id: z.string().min(1).max(100), x: z.number().finite(), y: z.number().finite(), label: z.string().trim().min(1).max(160),
  type: z.string().min(1).max(64), agentId: z.string().min(1).max(100), status: z.enum(['idle', 'running', 'done', 'error', 'blocked']), prompt: z.string().max(20000),
})
const edgeSchema = z.object({ id: z.string().min(1).max(100), from: z.string().min(1).max(100), to: z.string().min(1).max(100) })
const scheduleSchema = z.object({ mode: z.enum(['once', 'daily', 'weekly']), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), days: z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])), tz: z.string().min(1).max(100) }).nullable()
const workflowSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().trim().min(1).max(160), mode: z.enum(['dag', 'sequential', 'parallel']),
  version: z.number().int().positive().default(1), createdAt: z.string(), nodes: z.array(nodeSchema).max(250), edges: z.array(edgeSchema).max(1000), schedule: scheduleSchema,
})
const stateSchema = z.object({ agents: z.array(agentSchema).max(250), workflows: z.array(workflowSchema).max(250) })

function graphError(nodes: z.infer<typeof nodeSchema>[], edges: z.infer<typeof edgeSchema>[]) {
  const ids = new Set(nodes.map(node => node.id))
  const seen = new Set<string>()
  const next = new Map(nodes.map(node => [node.id, [] as string[]]))
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) return 'An edge references a missing node.'
    if (edge.from === edge.to) return 'Self-referencing edges are not allowed.'
    const key = `${edge.from}:${edge.to}`
    if (seen.has(key)) return 'Duplicate edges are not allowed.'
    seen.add(key); next.get(edge.from)?.push(edge.to)
  }
  const visiting = new Set<string>(), visited = new Set<string>()
  const cyclic = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    if (next.get(id)?.some(cyclic)) return true
    visiting.delete(id); visited.add(id); return false
  }
  return nodes.some(node => cyclic(node.id)) ? 'Workflow graphs must be acyclic.' : null
}

export default async (req: Request, _context: Context) => {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })

  if (req.method === 'GET') {
    const [agentRows, workflowRows] = await Promise.all([
      db.select().from(agents).where(eq(agents.ownerId, user.id)),
      db.select().from(workflows).where(eq(workflows.ownerId, user.id)),
    ])
    return Response.json({
      agents: agentRows.map(row => ({ id: row.id, name: row.name, emoji: row.emoji, caps: row.capabilities, status: row.status, version: row.version, model: row.model })),
      workflows: workflowRows.map(row => ({ id: row.id, name: row.name, mode: row.executionMode, version: row.version, createdAt: row.createdAt.toISOString(), nodes: row.nodes, edges: row.edges, schedule: row.schedule })),
    })
  }
  if (req.method !== 'PUT') return Response.json({ error: 'Method not allowed.' }, { status: 405 })

  const parsed = stateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid state payload.', issues: parsed.error.issues }, { status: 400 })
  const agentIds = new Set(parsed.data.agents.map(agent => agent.id))
  for (const workflow of parsed.data.workflows) {
    const error = graphError(workflow.nodes, workflow.edges)
    if (error) return Response.json({ error }, { status: 400 })
    if (workflow.nodes.some(node => !agentIds.has(node.agentId))) return Response.json({ error: 'A workflow references an unknown agent.' }, { status: 400 })
  }

  await db.transaction(async tx => {
    await tx.delete(workflows).where(eq(workflows.ownerId, user.id))
    await tx.delete(agents).where(eq(agents.ownerId, user.id))
    if (parsed.data.agents.length) await tx.insert(agents).values(parsed.data.agents.map(agent => ({
      id: agent.id, ownerId: user.id, name: agent.name, emoji: agent.emoji,
      capabilities: agent.caps, status: agent.status, version: agent.version, model: agent.model,
    })))
    if (parsed.data.workflows.length) {
      await tx.insert(workflows).values(parsed.data.workflows.map(workflow => ({ id: workflow.id, ownerId: user.id, name: workflow.name, executionMode: workflow.mode, version: workflow.version, nodes: workflow.nodes, edges: workflow.edges, schedule: workflow.schedule, createdAt: new Date(workflow.createdAt), updatedAt: new Date() })))
      for (const workflow of parsed.data.workflows) {
        const versionId = `${user.id}:${workflow.id}:${workflow.version}`
        const existing = await tx.select({ id: workflowVersions.id }).from(workflowVersions).where(and(eq(workflowVersions.ownerId, user.id), eq(workflowVersions.id, versionId))).limit(1)
        if (!existing.length) await tx.insert(workflowVersions).values({ id: versionId, ownerId: user.id, workflowId: workflow.id, version: workflow.version, definition: workflow })
      }
    }
  })
  return Response.json({ saved: true })
}

export const config: Config = { path: '/api/state' }
