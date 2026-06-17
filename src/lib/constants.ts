import type { AIModel, Agent, TaskType, Workflow } from '@/types'

// ─── Design tokens (duplicated in CSS vars via index.css) ─────────────────────
export const COLORS = {
  bg:       '#0E0E0F',
  surface:  '#161618',
  surface2: '#1E1E21',
  surface3: '#252529',
  border:   '#2A2A2F',
  border2:  '#333338',
  text:     '#E8E8EA',
  muted:    '#666670',
  muted2:   '#444449',
  amber:    '#F5A623',
  amberDim: '#F5A62318',
  green:    '#3DD68C',
  greenDim: '#3DD68C14',
  cyan:     '#38BDF8',
  cyanDim:  '#38BDF814',
  red:      '#F87171',
  purple:   '#A78BFA',
  purpleDim:'#A78BFA14',
} as const

export const MONO = "'IBM Plex Mono', monospace"
export const SANS = "'IBM Plex Sans', sans-serif"

// ─── AI Models ────────────────────────────────────────────────────────────────
export const AI_MODELS: AIModel[] = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', tier: 'fast'     },
  { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6',   provider: 'Anthropic', tier: 'powerful' },
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'OpenAI',    tier: 'fast'     },
  { id: 'gpt-4o-mini',       label: 'GPT-4o mini',       provider: 'OpenAI',    tier: 'fast'     },
  { id: 'gpt-4-turbo',       label: 'GPT-4 Turbo',       provider: 'OpenAI',    tier: 'powerful' },
  { id: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash',  provider: 'Google',    tier: 'fast'     },
  { id: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',    provider: 'Google',    tier: 'powerful' },
  { id: 'llama-3.3-70b',     label: 'Llama 3.3 70B',     provider: 'Meta',      tier: 'fast'     },
  { id: 'mistral-large',     label: 'Mistral Large',      provider: 'Mistral',   tier: 'powerful' },
  { id: 'deepseek-r1',       label: 'DeepSeek R1',        provider: 'DeepSeek',  tier: 'powerful' },
]

export const MODEL_PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'DeepSeek'] as const

export const PROVIDER_COLOR: Record<string, string> = {
  Anthropic: COLORS.amber,
  OpenAI:    COLORS.green,
  Google:    COLORS.cyan,
  Meta:      COLORS.purple,
  Mistral:   COLORS.red,
  DeepSeek:  COLORS.amber,
}

// ─── Task types ───────────────────────────────────────────────────────────────
export const TASK_TYPES: TaskType[] = [
  { value: 'web_search',  label: 'Web Search',      defaultAgent: 'search-agent-v1'   },
  { value: 'url_fetch',   label: 'Fetch URL',        defaultAgent: 'search-agent-v1'   },
  { value: 'run_code',    label: 'Run Code',         defaultAgent: 'code-agent-v1'     },
  { value: 'write_code',  label: 'Write Code',       defaultAgent: 'code-agent-v1'     },
  { value: 'summarize',   label: 'Summarize',        defaultAgent: 'summary-agent-v1'  },
  { value: 'extract',     label: 'Extract',          defaultAgent: 'summary-agent-v1'  },
  { value: 'store',       label: 'Store Memory',     defaultAgent: 'memory-agent-v1'   },
  { value: 'retrieve',    label: 'Retrieve Memory',  defaultAgent: 'memory-agent-v1'   },
  { value: 'read_file',   label: 'Read File',        defaultAgent: 'file-agent-v1'     },
  { value: 'write_file',  label: 'Write File',       defaultAgent: 'file-agent-v1'     },
  { value: 'orchestrate', label: 'Orchestrate',      defaultAgent: 'orchestrator-v1'   },
]

export const ALL_CAPS = TASK_TYPES.map(t => t.value)

export const EMOJI_POOL = [
  '🤖','🔍','💻','📝','🧠','📁','🎛️','⚙️','🚀','🛠️',
  '📊','🔧','🌐','📡','🔒','🧩','⚡','🔬','📦','🗂️',
]

// ─── Seed data ────────────────────────────────────────────────────────────────
export const SEED_AGENTS: Agent[] = [
  { id: 'orchestrator-v1',  name: 'Orchestrator', emoji: '🎛️', caps: ['orchestrate'],              status: 'active', version: '1.0.0', model: 'claude-sonnet-4-6' },
  { id: 'search-agent-v1',  name: 'Search',       emoji: '🔍', caps: ['web_search', 'url_fetch'],  status: 'active', version: '1.0.0', model: 'gpt-4o'            },
  { id: 'code-agent-v1',    name: 'Code',         emoji: '💻', caps: ['run_code', 'write_code'],   status: 'active', version: '1.0.0', model: 'claude-opus-4-6'   },
  { id: 'summary-agent-v1', name: 'Summary',      emoji: '📝', caps: ['summarize', 'extract'],     status: 'active', version: '1.0.0', model: 'gemini-2.0-flash'  },
  { id: 'memory-agent-v1',  name: 'Memory',       emoji: '🧠', caps: ['store', 'retrieve'],        status: 'idle',   version: '1.0.0', model: 'claude-sonnet-4-6' },
  { id: 'file-agent-v1',    name: 'File I/O',     emoji: '📁', caps: ['read_file', 'write_file'], status: 'warn',   version: '1.0.0', model: 'gpt-4o-mini'       },
]

export const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_1',
    name: 'Research Pipeline',
    mode: 'dag',
    createdAt: '2026-06-01',
    nodes: [
      { id: 'n1', x: 40,  y: 60, label: 'Search Papers',   type: 'web_search', agentId: 'search-agent-v1',  status: 'idle', prompt: 'Search for recent AI research papers 2026' },
      { id: 'n2', x: 280, y: 60, label: 'Summarise',       type: 'summarize',  agentId: 'summary-agent-v1', status: 'idle', prompt: 'Summarise into key points' },
      { id: 'n3', x: 520, y: 60, label: 'Save to Memory',  type: 'store',      agentId: 'memory-agent-v1',  status: 'idle', prompt: 'Store summary for retrieval' },
    ],
    edges: [{ id: 'e1', from: 'n1', to: 'n2' }, { id: 'e2', from: 'n2', to: 'n3' }],
    schedule: null,
  },
  {
    id: 'wf_2',
    name: 'Code Review Bot',
    mode: 'sequential',
    createdAt: '2026-06-05',
    nodes: [
      { id: 'n4', x: 40,  y: 60, label: 'Fetch PR Diff',  type: 'read_file',  agentId: 'file-agent-v1', status: 'idle', prompt: 'Read the latest PR diff' },
      { id: 'n5', x: 280, y: 60, label: 'Review Code',    type: 'run_code',   agentId: 'code-agent-v1', status: 'idle', prompt: 'Analyse for bugs and style issues' },
      { id: 'n6', x: 520, y: 60, label: 'Write Report',   type: 'write_file', agentId: 'file-agent-v1', status: 'idle', prompt: 'Write review to /output/review.md' },
    ],
    edges: [{ id: 'e3', from: 'n4', to: 'n5' }, { id: 'e4', from: 'n5', to: 'n6' }],
    schedule: { mode: 'daily', time: '08:00', days: [] },
  },
]

// ─── Node canvas dimensions ───────────────────────────────────────────────────
export const NODE_W = 170
export const NODE_H = 106
