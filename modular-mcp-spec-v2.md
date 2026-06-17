# Modular MCP Multi-Agent System — Architecture Specification

**Version:** 2.0  
**Status:** Draft  
**Supersedes:** v1.0

---

## Changelog (v1.0 → v2.0)

| Area | What changed |
|------|-------------|
| Workflow Builder | New top-level concept: named, visual, node-based Workflows |
| Task Node | Formalised Task as the atomic unit inside a Workflow |
| DAG Edges | Explicit edge schema; replaces implicit step ordering |
| Execution Engine | Replaces ad-hoc Orchestrator dispatch with a dedicated engine |
| Schedule | First-class scheduling contract (once / daily / weekly) |
| Agent mutation | Agents can now be created, edited, and deleted at runtime via the Registry API |
| UI contract | Added section describing the visual Workflow Builder surface |

---

## 1. Overview

A modular Model Context Protocol (MCP) system where autonomous agents perform specialised tasks and communicate via a central Message Bus. Workflows — directed acyclic graphs (DAGs) of Task Nodes — define execution plans that the Execution Engine runs against registered agents. The system is designed so new agents and new workflows can be added without modifying existing ones.

---

## 2. Core Concepts

### 2.1 Agent
A self-contained unit that:
- Exposes a set of **capabilities** (named actions it can perform)
- Subscribes to an **inbox** for inbound Task messages from the bus
- Publishes results to an **outbox** or replies directly to the caller
- Self-registers with the **Agent Registry** on startup
- Emits periodic **heartbeats** to signal liveness

### 2.2 Agent Registry
A central directory that maps agent IDs to their capabilities, status, and version. Agents and the Workflow Builder query the registry to discover who can handle a given task type. Agents can be registered, edited, and deregistered at runtime — zero restarts required for existing agents.

### 2.3 Message Bus
The sole communication backbone between all system components. Supports four routing modes: direct, broadcast, capability-routed, and round-robin. No component calls another directly; everything goes through the bus.

### 2.4 Task Node
The atomic unit of work inside a Workflow. Each Task Node declares:
- A **task type** (maps to one agent capability)
- An **assigned agent** (can be reassigned without changing the workflow structure)
- A **prompt / instruction payload**
- An **execution status** (idle → running → done | error)

### 2.5 Workflow
A named, user-authored DAG of Task Nodes connected by directed edges. Edges define execution order and data dependency. A workflow can be run immediately or on a schedule.

### 2.6 Execution Engine
Reads a Workflow's DAG, performs a topological sort, and dispatches Task Nodes to their assigned agents via the bus. Supports sequential, parallel, and DAG execution modes. Handles retries and fallback routing.

### 2.7 Orchestrator Agent
An optional built-in agent that can itself decompose a high-level goal into a Workflow, acting as a programmatic workflow author. It operates through the same message bus as any other agent.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         HOST (MCP Server)                        │
│                                                                  │
│  ┌─────────────────────┐      ┌──────────────────────────────┐  │
│  │   Workflow Builder  │      │       Agent Registry         │  │
│  │  (visual DAG editor)│◄────►│  (ID → caps, status, ver)   │  │
│  └──────────┬──────────┘      └──────────────────────────────┘  │
│             │ Workflow def                    ▲                  │
│  ┌──────────▼──────────┐                     │ register/hb      │
│  │   Execution Engine  │                     │                  │
│  │  (topo-sort + dispatch)                   │                  │
│  └──────────┬──────────┘                     │                  │
│             │                                │                  │
│  ┌──────────▼──────────────────────────────────────────────┐    │
│  │                      Message Bus                        │    │
│  │         direct · broadcast · capability · round-robin   │    │
│  └──────┬──────────┬──────────┬──────────┬─────────────────┘    │
│         │          │          │          │                       │
│  ┌──────▼──┐ ┌─────▼──┐ ┌────▼───┐ ┌────▼──────┐ ┌──────────┐  │
│  │Orchestr.│ │Search  │ │Code    │ │Summary   │ │Agent N+1 │  │
│  │(built-in│ │Agent   │ │Agent   │ │Agent     │ │(future)  │  │
│  └─────────┘ └────────┘ └────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Agent Interface Contract

Every agent MUST implement this interface.

### 4.1 Registration Payload
```json
{
  "agent_id":      "search-agent-v1",
  "display_name":  "Web Search Agent",
  "emoji":         "🔍",
  "version":       "1.0.0",
  "capabilities":  ["web_search", "url_fetch"],
  "input_schema":  { ... },
  "output_schema": { ... },
  "status":        "active"
}
```

**Status values:** `active` | `idle` | `warn` | `offline`

### 4.2 Inbound Message (Task Dispatch)
```json
{
  "message_id":  "msg_abc123",
  "from":        "execution-engine",
  "to":          "search-agent-v1",
  "task":        "web_search",
  "payload":     { "query": "latest AI research 2026" },
  "workflow_id": "wf_xyz",
  "node_id":     "node_1",
  "reply_to":    "msg_root001",
  "priority":    "normal",
  "created_at":  "2026-06-09T10:00:00Z"
}
```

### 4.3 Outbound Message (Task Result)
```json
{
  "message_id":   "msg_def456",
  "from":         "search-agent-v1",
  "to":           "execution-engine",
  "in_reply_to":  "msg_abc123",
  "workflow_id":  "wf_xyz",
  "node_id":      "node_1",
  "status":       "success",
  "result":       { ... },
  "completed_at": "2026-06-09T10:00:02Z"
}
```

---

## 5. Workflow Schema

A Workflow is a JSON document stored and versioned by the system.

```json
{
  "workflow_id":  "wf_xyz",
  "name":         "Research Pipeline",
  "version":      1,
  "created_at":   "2026-06-09T09:00:00Z",
  "execution_mode": "dag",
  "nodes": [
    {
      "node_id":  "node_1",
      "label":    "Search Papers",
      "type":     "web_search",
      "agent_id": "search-agent-v1",
      "prompt":   "Search for recent AI research papers 2026",
      "position": { "x": 60, "y": 80 },
      "status":   "idle"
    },
    {
      "node_id":  "node_2",
      "label":    "Summarise Results",
      "type":     "summarize",
      "agent_id": "summary-agent-v1",
      "prompt":   "Summarise into key points",
      "position": { "x": 300, "y": 80 },
      "status":   "idle"
    }
  ],
  "edges": [
    { "edge_id": "e1", "from": "node_1", "to": "node_2" }
  ],
  "schedule": {
    "mode":  "daily",
    "time":  "09:00",
    "days":  [],
    "tz":    "UTC"
  }
}
```

---

## 6. Task Node

### 6.1 Task Types and Default Agent Mapping

| Task Type | Label | Default Agent |
|-----------|-------|---------------|
| `web_search`  | Web Search      | `search-agent-v1`   |
| `url_fetch`   | Fetch URL       | `search-agent-v1`   |
| `run_code`    | Run Code        | `code-agent-v1`     |
| `write_code`  | Write Code      | `code-agent-v1`     |
| `summarize`   | Summarize       | `summary-agent-v1`  |
| `extract`     | Extract         | `summary-agent-v1`  |
| `store`       | Store Memory    | `memory-agent-v1`   |
| `retrieve`    | Retrieve Memory | `memory-agent-v1`   |
| `read_file`   | Read File       | `file-agent-v1`     |
| `write_file`  | Write File      | `file-agent-v1`     |
| `orchestrate` | Orchestrate     | `orchestrator-v1`   |

Default mappings are suggestions only. Any agent can be assigned to any node regardless of type — the user reassigns in the Workflow Builder inspector panel.

### 6.2 Node Status Lifecycle

```
idle ──► running ──► done
                └──► error ──► (retry) ──► done | error
```

---

## 7. Execution Engine

### 7.1 Responsibilities
- Accept a Workflow definition (DAG)
- Perform topological sort of nodes using edge dependencies
- Dispatch each node as a Task message to its assigned agent via the bus
- Track per-node status and update the Workflow in real time
- Apply retry logic on error (configurable per workflow)
- Emit execution log events for the UI and observability layer

### 7.2 Execution Modes

| Mode | Behaviour |
|------|-----------|
| **Sequential** | Nodes executed strictly in topological order, one at a time |
| **Parallel** | Independent nodes (no shared dependencies) execute concurrently |
| **DAG** | Full dependency-aware scheduling; default mode |

### 7.3 Execution Log Event
```json
{
  "event_id":    "evt_001",
  "workflow_id": "wf_xyz",
  "node_id":     "node_1",
  "agent_id":    "search-agent-v1",
  "type":        "running",
  "message":     "[🔍 Search] → Search Papers",
  "detail":      "task: web_search",
  "timestamp":   "2026-06-09T10:00:00Z"
}
```

**Event types:** `info` | `running` | `done` | `error`

---

## 8. Agent Registry

### 8.1 Responsibilities
- Store registered agents and their full profiles
- Respond to capability queries: *"who can do X?"*
- Track agent health via heartbeat
- Support runtime CRUD: agents can be created, updated, and deleted without restarting other agents

### 8.2 Registry API

| Tool | Description |
|------|-------------|
| `registry.register`           | Agent registers itself on startup |
| `registry.deregister`         | Agent gracefully removes itself |
| `registry.update`             | Update agent profile (caps, status, emoji, name) |
| `registry.find_by_capability` | Returns agents that can handle a given task type |
| `registry.list_all`           | Lists all agents and their statuses |
| `registry.heartbeat`          | Agent pings to signal liveness |

---

## 9. Message Bus

### 9.1 Routing Modes

| Mode | Description |
|------|-------------|
| **Direct** | Message sent to a specific `agent_id` |
| **Broadcast** | Message sent to all registered agents |
| **Capability-routed** | Bus queries registry; routes to first capable agent |
| **Round-robin** | Load-balanced across agents sharing a capability |

### 9.2 Delivery Guarantees
- At-least-once delivery by default
- Messages queued when target agent is temporarily unavailable
- Retry count and backoff configurable per message

### 9.3 Bus API

| Tool | Description |
|------|-------------|
| `bus.send`               | Send to a specific agent |
| `bus.broadcast`          | Send to all agents |
| `bus.route_by_capability`| Route to capable agent, resolved at runtime |
| `bus.get_status`         | Check delivery status of a message |

---

## 10. Workflow Builder (UI Contract)

The Workflow Builder is the visual interface for authoring, running, and scheduling workflows. It must reflect all data structures in this spec.

### 10.1 Views / Tabs

| Tab | Purpose |
|-----|---------|
| **Canvas** | Node-based DAG editor. Drag to reposition; click to inspect; draw edges between nodes. |
| **Agents** | Registry management. View all agents, edit profiles, add new agents, delete agents. |
| **Connections** | List view of all edges in the current workflow. Supports deletion. |
| **Run Log** | Real-time execution log stream. Shows per-node status events from the Execution Engine. |

### 10.2 Canvas Interactions

| Action | How |
|--------|-----|
| Add task node | "+ Add task" button → New Task modal |
| Select node | Click node → opens Inspector panel |
| Move node | Drag node on canvas |
| Connect nodes | Inspector → "Connect to another node" → click target node |
| Disconnect | Connections tab → delete edge row |
| Delete node | Inspector → Delete button |

### 10.3 Inspector Panel (per node)
The inspector allows full mutation of a selected node:
- Rename task label
- Change task type (auto-suggests default agent)
- **Reassign agent** — full list of registry agents; click any to override the default
- Edit prompt / instructions
- Initiate a connection to another node

### 10.4 New Task Modal Fields
- Task name (free text)
- Task type (dropdown; drives default agent suggestion)
- Auto-assigned agent preview (overridable in inspector after creation)
- Prompt / instructions (textarea)

### 10.5 Schedule Contract

| Field | Values |
|-------|--------|
| `mode` | `once` \| `daily` \| `weekly` |
| `time` | HH:MM (24h) |
| `days` | Array of weekday names (weekly mode only) |
| `tz`   | IANA timezone string |

### 10.6 Agent Editor Fields (Agents tab)
- Icon (emoji picker)
- Name
- Status (`active` / `idle` / `warn`)
- Capabilities (multi-select from known list + custom free-text entry)
- Version (auto-incremented on save)

---

## 11. Built-in Agents

| Agent ID | Emoji | Capability | Description |
|----------|-------|------------|-------------|
| `orchestrator-v1`  | 🎛️ | `orchestrate`                 | Decomposes goals, authors sub-workflows |
| `search-agent-v1`  | 🔍 | `web_search`, `url_fetch`     | Searches the web, fetches URLs |
| `code-agent-v1`    | 💻 | `run_code`, `write_code`      | Executes and generates code |
| `summary-agent-v1` | 📝 | `summarize`, `extract`        | Summarises or extracts from text |
| `memory-agent-v1`  | 🧠 | `store`, `retrieve`           | Persists and retrieves context |
| `file-agent-v1`    | 📁 | `read_file`, `write_file`     | Reads and writes files |

---

## 12. Adding a New Agent

Zero changes to existing agents or workflows are needed.

1. Implement the Agent Interface Contract (Section 4)
2. Start the agent process — it calls `registry.register` on startup
3. Declare capabilities in the registration payload
4. The Execution Engine and Workflow Builder can now discover and assign it

Alternatively, create an agent directly via the **Agents tab** in the Workflow Builder — no code deployment required for UI-defined agents.

### 12.1 New Agent Checklist
- [ ] Unique `agent_id`
- [ ] Valid `input_schema` and `output_schema`
- [ ] Calls `registry.register` on startup
- [ ] Emits `registry.heartbeat` on a regular interval
- [ ] Calls `registry.deregister` on graceful shutdown
- [ ] Handles inbound Task messages from the bus
- [ ] Returns structured results in the Outbound Message format

---

## 13. Configuration

```yaml
# mcp-config.yaml

bus:
  type: in-memory           # in-memory | redis | rabbitmq
  retry_limit: 3
  retry_backoff_ms: 500

registry:
  heartbeat_interval_ms: 5000
  agent_timeout_ms: 15000

execution_engine:
  default_mode: dag         # sequential | parallel | dag
  max_parallel_steps: 5
  log_retention_days: 30

agents:
  enabled:
    - orchestrator-v1
    - search-agent-v1
    - code-agent-v1
    - summary-agent-v1
    - memory-agent-v1
    - file-agent-v1
```

---

## 14. Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Agent unavailable | Bus queues message; retries up to `retry_limit` |
| Agent returns `error` | Engine logs event; attempts fallback agent if registry has one |
| No capable agent found | Node status set to `error`; workflow halts or skips (configurable) |
| Agent crashes mid-task | Heartbeat timeout → deregistered; engine re-routes to next capable agent |
| Workflow cycle detected | DAG validation rejects workflow at save time |

---

## 15. Security & Isolation

- Agents communicate **only** via the message bus — no direct agent-to-agent calls
- Each agent may declare an `allowed_callers` list
- Messages may be signed with an HMAC token for integrity verification
- Sensitive payloads should be encrypted at the bus level (configurable)
- Agent CRUD operations in the registry should be access-controlled (auth TBD — see Section 16)

---

## 16. Open Questions / Future Work

| Topic | Question |
|-------|----------|
| **Auth** | How do agents verify the identity of message senders? |
| **Streaming** | Should agents support streaming partial results back to the engine? |
| **Sandboxing** | Should code-running agents be isolated in containers? |
| **Observability** | Centralised tracing across agents (OpenTelemetry)? |
| **Agent marketplace** | Schema registry for community-contributed agents? |
| **Workflow versioning** | Should editing a running workflow create a new version? |
| **Result passing** | How does `node_2` receive the output of `node_1` as its input payload? |
| **Parallel fan-out** | What is the merge strategy when multiple parallel nodes feed one downstream node? |

---

*End of Specification v2.0*
