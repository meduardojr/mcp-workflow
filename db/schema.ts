import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const agents = pgTable('agents', {
  id: text().notNull(),
  ownerId: text('owner_id').notNull(),
  name: text().notNull(),
  emoji: text().notNull(),
  capabilities: jsonb().$type<string[]>().notNull().default([]),
  status: text().notNull(),
  version: text().notNull(),
  model: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('agents_owner_id_uidx').on(table.ownerId, table.id), index('agents_owner_idx').on(table.ownerId)])

export const workflows = pgTable('workflows', {
  id: text().notNull(),
  ownerId: text('owner_id').notNull(),
  name: text().notNull(),
  executionMode: text('execution_mode').notNull(),
  version: integer().notNull().default(1),
  nodes: jsonb().$type<unknown[]>().notNull().default([]),
  edges: jsonb().$type<unknown[]>().notNull().default([]),
  schedule: jsonb().$type<unknown | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('workflows_owner_id_uidx').on(table.ownerId, table.id), index('workflows_owner_idx').on(table.ownerId)])

export const workflowVersions = pgTable('workflow_versions', {
  id: text().primaryKey(),
  workflowId: text('workflow_id').notNull(),
  ownerId: text('owner_id').notNull(),
  version: integer().notNull(),
  definition: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex('workflow_versions_unique_idx').on(table.ownerId, table.workflowId, table.version)])

export const runs = pgTable('runs', {
  id: text().primaryKey(),
  workflowId: text('workflow_id').notNull(),
  workflowVersion: integer('workflow_version').notNull(),
  ownerId: text('owner_id').notNull(),
  status: text().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, table => [index('runs_owner_workflow_idx').on(table.ownerId, table.workflowId)])

export const executionEvents = pgTable('execution_events', {
  id: text().primaryKey(),
  runId: text('run_id').notNull(),
  workflowId: text('workflow_id').notNull(),
  ownerId: text('owner_id').notNull(),
  nodeId: text('node_id'),
  agentId: text('agent_id'),
  type: text().notNull(),
  message: text().notNull(),
  detail: text().notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('events_owner_run_idx').on(table.ownerId, table.runId)])
