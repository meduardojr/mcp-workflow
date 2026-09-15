# MCP Workflow Roadmap

This roadmap compares the current prototype with `modular-mcp-spec-v2.md`. “Working” means the behavior exists in the current browser prototype; it does not imply that the feature is backed by a real MCP service or persistent storage.

## Current status

| Original specification area | Status | What works now | What needs fixing |
| --- | --- | --- | --- |
| Workflow Builder views | Working (prototype) | Canvas, Agents, Connections, and Run Log views are present and navigable. | Add broader automated UI coverage and production accessibility checks. |
| Workflow CRUD | Working (local only) | Workflows can be created, selected, and deleted. | Changes reset on refresh. Add persistent storage, editing/versioning, ownership, and safe deletion behavior. |
| Task node CRUD | Working (local only) | Nodes can be added, moved, renamed, reassigned, edited, and deleted. Task types suggest default agents. | Validate referenced agents and task types, and preserve data in the database. |
| Edge editing | Partially working | Users can connect nodes and remove edges; duplicate and self edges are blocked in the UI flow. | Reject cycles and invalid endpoints in the store/API. Connection creation currently allows cyclic workflows. |
| Agent Registry UI | Partially working | Agents can be listed, created, edited, and deleted with status, capabilities, icon, and model. | There is no Registry API, self-registration, capability lookup, heartbeat, schema metadata, or deregistration. Editing does not auto-increment the version as specified. Prevent deletion while an agent is referenced, or provide reassignment. |
| Visual node status | Working (simulation) | Idle, running, done, and error states appear on nodes; edges animate during a run. | Drive status from real execution events and support multiple concurrently running node indicators reliably. |
| DAG execution | Partially working (simulation) | Dependency joins, parallel roots, and parallel children work in the simulation. The included four execution tests pass. | Execution is a random timer simulation and never dispatches work. Cycles are executed through a fallback instead of rejected. Failed branches remain `idle`, yet the workflow is logged as complete. |
| Sequential mode | Not working | The mode can be selected and displayed. | The engine ignores it and still starts all roots/eligible children concurrently. Implement strict topological, one-at-a-time execution. |
| Parallel mode | Not working as specified | The mode can be selected and displayed. | It uses the same dependency-aware algorithm as DAG mode. Define and implement the spec’s independent-node behavior. |
| Retries and fallback routing | Not working | A failure can be simulated for a degraded agent. | No retry is attempted even though the log says `retry 1/3`; there is no backoff, fallback agent, rerouting, or configurable failure policy. |
| Execution logs | Partially working (local) | The UI streams local info/running/done/error entries and can clear them. | Events lack the specified IDs and workflow/node/agent fields, are not persisted, and report success after node failure. Add run records, retention, and observability. |
| Scheduling | Partially working (configuration UI) | Once, daily, and weekly schedule settings can be attached to a workflow. | Nothing triggers scheduled runs. The required IANA `tz` field is missing, weekday values differ from the contract, and validation is incomplete. |
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
- `node test/parallel-execution.test.js` passes its linear chain, parallel fan-out, parallel roots/join, and failure-blocks-downstream cases.
- These tests exercise a copied simulation of the execution logic, not real agents, the message bus, persistence, scheduling, or browser interactions.

## Known defects to fix first

1. Execution mode is ignored. `dag`, `sequential`, and `parallel` all run through the same dependency-aware scheduler.
2. Cycles are not rejected when an edge is saved. The execution fallback then runs a cyclic graph instead of reporting validation failure.
3. A failed node still ends with `WORKFLOW COMPLETE` and a `done` run state; blocked descendants remain `idle`, which hides partial failure.
4. Retry text is misleading because no retry occurs.
5. Removing agents can leave nodes referencing missing agents. Removing every agent can cause UI/runtime errors where fallback code assumes an agent exists.
6. Scheduling stores display settings only and omits timezone; no scheduled function executes workflows.
7. All edits and logs disappear after refresh because the Supabase client/schema are not connected to any store action.

## Recommended delivery order

### Phase 1 — Make the prototype truthful and safe

- Add store-level graph validation for missing endpoints, self edges, duplicates, and cycles.
- Implement distinct sequential, parallel, and DAG schedulers with direct unit tests against production code rather than a copied test implementation.
- Track `blocked`/skipped outcomes or convert them to explicit errors, and calculate the overall run result from node results.
- Implement actual bounded retries or remove retry claims until they exist.
- Guard missing agents and add referenced-agent deletion/reassignment rules.
- Add schedule timezone and input validation.

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
