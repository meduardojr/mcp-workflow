# MCP Workflow Roadmap

This roadmap compares the current prototype with `modular-mcp-spec-v2.md`. “Working” means the behavior exists in the current browser prototype; it does not imply that the feature is backed by a real MCP service or persistent storage.

## Current status

| Original specification area | Status | What works now | What needs fixing |
| --- | --- | --- | --- |
| Workflow Builder views | Working (prototype) | Canvas, Agents, Connections, and Run Log views are present and navigable. | Add broader automated UI coverage and production accessibility checks. |
| Workflow CRUD | Working (local only) | Workflows can be created, selected, and deleted. | Changes reset on refresh. Add persistent storage, editing/versioning, ownership, and safe deletion behavior. |
| Task node CRUD | Working (local only) | Nodes can be added, moved, renamed, reassigned, edited, and deleted. Task types suggest default agents. | Validate referenced agents and task types, and preserve data in the database. |
| Edge editing | Working (prototype) | Store-level validation rejects missing endpoints, self edges, duplicates, and cycles. | Add equivalent server-side validation when the API is introduced. |
| Agent Registry UI | Partially working | Agents can be listed, created, edited, and deleted with status, capabilities, icon, and model. | There is no Registry API, self-registration, capability lookup, heartbeat, schema metadata, or deregistration. Editing does not auto-increment the version as specified. Prevent deletion while an agent is referenced, or provide reassignment. |
| Visual node status | Working (simulation) | Idle, running, done, and error states appear on nodes; edges animate during a run. | Drive status from real execution events and support multiple concurrently running node indicators reliably. |
| DAG execution | Working (simulation) | Dependency joins and concurrent ready tasks work; failed descendants are marked blocked and the run fails accurately. | Replace simulated task work with real dispatch in Phase 3. |
| Sequential mode | Working (simulation) | Valid tasks execute in stable topological order, one at a time. | Replace simulated task work with real dispatch in Phase 3. |
| Parallel mode | Working (simulation) | All independent tasks start concurrently without waiting on graph dependencies. | Replace simulated task work with real dispatch in Phase 3. |
| Retries and fallback routing | Partially working | Failed simulated tasks receive up to three real attempts and exhaustion is logged accurately. | Add configurable backoff and fallback routing in Phase 3. |
| Execution logs | Partially working (local) | The UI streams local info/running/done/error entries and can clear them. | Events lack the specified IDs and workflow/node/agent fields, are not persisted, and report success after node failure. Add run records, retention, and observability. |
| Scheduling | Partially working (configuration UI) | Once, daily, and weekly schedules include validated time, weekdays, and an IANA timezone. | Nothing triggers scheduled runs yet. |
| Workflow schema/versioning | Partially working | The local types represent workflows, nodes, edges, modes, and schedules. | Field names differ from the specified wire schema, workflow `version` and schedule `tz` are absent, and there is no serialization/versioning contract. |
| Message Bus | Not working | The Agents view displays a banner describing the four routing modes. | There is no bus implementation or API for direct, broadcast, capability, or round-robin delivery; no queue, status, retry, or at-least-once guarantee exists. |
| Agent interface/runtime | Not working | Six built-in agent profiles and their capabilities are seeded in local state. | No agent process implements registration, inbox/outbox task messages, structured results, or heartbeats. Built-in agents do not perform their declared capabilities. |
| Orchestrator Agent | Not working | An orchestrator profile is visible and assignable. | It cannot decompose a goal, author a workflow, or communicate through a bus. |
| Persistence | Not working | A Supabase schema and unused client stub exist. | The app only reads seed constants. No application code loads or saves agents, workflows, schedules, or run logs. For this Netlify project, persistence should be implemented with Netlify Database rather than the unused Supabase path. |
| Authentication/authorization | Not working | None. | Add user authentication, workflow ownership, protected server APIs, and role/access checks for registry mutations. Current SQL policies allow anonymous writes if that schema is deployed. |
| Security and isolation | Not working | None. | Add allowed callers, message integrity, secret-safe payload handling, agent sandboxing, and authorization boundaries. |
| Configuration | Not working | A few configuration values appear as static UI text. | There is no `mcp-config.yaml` loading or equivalent validated server configuration. |

## Confirmed working checks

- `npm run typecheck` passes.
- `npm test` directly exercises production graph validation and execution code across sequential, DAG, and parallel modes, including retries and blocked descendants.
- These tests cover the simulation engine, not real agents, the message bus, persistence, scheduled invocation, or browser interactions.

## Phase 1 defects resolved

Execution modes now behave distinctly, invalid graphs are rejected, failed runs report accurate terminal states, bounded retries are real, referenced agents cannot be deleted, missing agents render safely, and schedules validate their timezone and inputs. Persistence and scheduled invocation remain planned backend work.

## Recommended delivery order

### Phase 1 — Make the prototype truthful and safe — Finished ✅

- [x] Add store-level graph validation for missing endpoints, self edges, duplicates, and cycles.
- [x] Implement distinct sequential, parallel, and DAG schedulers with direct unit tests against production code rather than a copied test implementation.
- [x] Track `blocked`/skipped outcomes or convert them to explicit errors, and calculate the overall run result from node results.
- [x] Implement actual bounded retries or remove retry claims until they exist.
- [x] Guard missing agents and add referenced-agent deletion/reassignment rules.
- [x] Add schedule timezone and input validation.

### Phase 2 — Add the Netlify backend

- Replace local seed-only state with Netlify Database tables for agents, workflows, workflow versions, runs, and execution events.
- Add server-side APIs with schema validation and consistent spec-compatible wire names.
- Add authentication, per-user ownership, and authorization for workflow and registry mutations.
- Preserve optimistic UI behavior while surfacing loading, empty, and server error states.

### Phase 3 — Implement real execution

- Implement the Agent Registry API, capability discovery, heartbeat health, and safe runtime CRUD.
- Implement the Message Bus routing modes, delivery state, queueing, retry/backoff, and idempotency for at-least-once delivery.
- Dispatch structured task messages to real agents and validate structured result messages.
- Pass upstream results into downstream tasks and define fan-out merge semantics.
- Add fallback routing and cancellation/timeouts.

### Phase 4 — Scheduling and operations

- Execute saved schedules with Netlify Scheduled Functions and prevent duplicate runs.
- Persist detailed execution events and add retention, tracing, metrics, and operational diagnostics.
- Add workflow versioning so active runs remain pinned to an immutable definition.
- Add security controls for message integrity, caller permissions, secrets, and sandboxed code/file agents.

## Definition of specification-ready

The project is specification-ready when workflows and registry data persist per authenticated user; graph validation rejects cycles; each execution mode has tested, distinct behavior; schedules actually invoke runs in their saved timezone; real task/result messages travel through the bus; retries and fallbacks are observable and truthful; and failures produce an accurate terminal workflow state.
