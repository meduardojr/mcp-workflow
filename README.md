# MCP Workflow

> ⚠️ **PROTOTYPE** — This is an early-stage prototype. It uses local seed data and simulated agent execution. Database persistence, real agent API calls, and authentication are stubbed out and ready to wire up.

A mobile-first visual workflow builder for MCP (Model Context Protocol) multi-agent systems. Design and run DAG pipelines where each task node is assigned an AI agent and model, all communicating through a central message bus.

---

## Features

- **Node-based canvas** — drag, pan, and connect task nodes into a DAG
- **Agent registry** — create, edit, and delete agents with per-agent AI model selection
- **10 AI models** — Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek
- **Workflow management** — multiple named workflows, each with their own nodes and edges
- **Execution engine** — topological sort, per-node status animation, live run log
- **Scheduler** — once / daily / weekly schedule per workflow
- **Mobile-first** — bottom nav, slide-up panels, canvas pan via drag

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| UI          | React 18 + TypeScript               |
| State       | Zustand + Immer                     |
| Database    | Supabase (PostgreSQL)               |
| Build       | Vite 5                              |
| Deploy      | Netlify                             |
| Versioning  | GitHub                              |

---

## Project Structure

```
src/
├── features/
│   ├── agents/        # Agent registry, AgentForm, AgentsView
│   ├── canvas/        # WorkflowCanvas (DAG editor), InspectorSheet
│   ├── connections/   # Edge list view
│   ├── execution/     # RunLogView
│   ├── workflows/     # WorkflowsSheet, NewWorkflowModal, ScheduleModal
│   └── ui/            # Shared primitives: Modal, SlidePanel, styles
├── lib/
│   ├── constants.ts   # Design tokens, AI models, task types, seed data
│   ├── supabase.ts    # Supabase client singleton
│   ├── database.types.ts  # Generated Supabase types (stub)
│   └── utils.ts       # uid, agentById, topoSort, etc.
├── store/
│   ├── agentsStore.ts     # Zustand slice — agent CRUD
│   ├── workflowsStore.ts  # Zustand slice — workflow/node/edge CRUD
│   └── executionStore.ts  # Zustand slice — run engine + log
├── types/
│   └── index.ts       # Shared TypeScript interfaces
├── App.tsx            # Root component — layout + view routing
└── main.tsx           # React entry point
supabase/
└── schema.sql         # Database schema + RLS + seed data
```

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/your-username/mcp-workflow.git
cd mcp-workflow
```

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> The app runs with local seed data if Supabase env vars are missing — useful for UI development.

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/schema.sql`
3. Copy your Project URL and anon key from **Settings → API**

### 5. Dev server

```bash
npm run dev
```

---

## Deployment

### Netlify

1. Push to GitHub
2. Connect repo in [Netlify](https://netlify.com) → **Add new site → Import from Git**
3. Build settings are pre-configured in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in **Netlify → Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### GitHub

```bash
git init
git add .
git commit -m "feat: initial prototype"
git branch -M main
git remote add origin https://github.com/your-username/mcp-workflow.git
git push -u origin main
```

---

## Regenerate Supabase Types

After changing the schema:

```bash
npx supabase gen types typescript \
  --project-id your-project-id \
  > src/lib/database.types.ts
```

---

## Roadmap

- [ ] Wire Supabase persistence (agents, workflows, run logs)
- [ ] Real agent API execution via MCP server
- [ ] User authentication (Supabase Auth)
- [ ] Workflow versioning
- [ ] Result passing between nodes
- [ ] Parallel fan-out merge strategy
- [ ] OpenTelemetry observability
- [ ] Agent sandboxing (code execution)

---

## Spec

Full architecture spec is in `modular-mcp-spec-v2.md`.

---

## License

MIT
