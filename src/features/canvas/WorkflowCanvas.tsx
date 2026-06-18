import React, { useRef, useState } from 'react'
import { COLORS, MONO, SANS, NODE_W, NODE_H, PROVIDER_COLOR } from '@/lib/constants'
import { agentById, taskByType, modelById } from '@/lib/utils'
import type { Agent, TaskNode, WorkflowEdge } from '@/types'

interface Props {
  nodes: TaskNode[]
  edges: WorkflowEdge[]
  agents: Agent[]
  selectedId: string | null
  runningId: string | null
  connecting: boolean
  onViewDetails: (id: string) => void
  onClearSelection: () => void
  onMove: (id: string, x: number, y: number) => void
  onAddEdge: (toId: string) => void
}

const statusColor = (s: string) =>
  ({ active: COLORS.green, idle: COLORS.muted, warn: COLORS.amber, running: COLORS.cyan, done: COLORS.green, error: COLORS.red }[s] ?? COLORS.muted)

export const WorkflowCanvas: React.FC<Props> = ({
  nodes, edges, agents, selectedId, runningId, connecting,
  onViewDetails, onClearSelection, onMove, onAddEdge,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeDown     = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const panDown      = useRef<{ startX: number; startY: number } | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState<'node' | 'pan' | null>(null)

  const clientPt = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY })

  const svgPt = (e: React.PointerEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left - pan.x, y: e.clientY - r.top - pan.y }
  }

  const capturePointer = (e: React.PointerEvent) => {
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const releasePointer = (e: React.PointerEvent) => {
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const endInteraction = (e: React.PointerEvent) => {
    releasePointer(e)
    nodeDown.current = null
    panDown.current = null
    setDragging(null)
  }

  const onNodePointerDown = (e: React.PointerEvent, node: TaskNode) => {
    e.stopPropagation()
    if (connecting) { onAddEdge(node.id); return }
    capturePointer(e)
    const p = svgPt(e)
    nodeDown.current = { id: node.id, ox: node.x - p.x, oy: node.y - p.y }
    panDown.current = null
    setDragging('node')
  }

  const onBgPointerDown = (e: React.PointerEvent) => {
    if (connecting) { onClearSelection(); return }
    capturePointer(e)
    const c = clientPt(e)
    panDown.current = { startX: c.x - pan.x, startY: c.y - pan.y }
    nodeDown.current = null
    setDragging('pan')
    onClearSelection()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (nodeDown.current) {
      const p = svgPt(e)
      onMove(
        nodeDown.current.id,
        Math.max(4, p.x + nodeDown.current.ox),
        Math.max(4, p.y + nodeDown.current.oy),
      )
      return
    }
    if (panDown.current) {
      const c = clientPt(e)
      setPan({ x: c.x - panDown.current.startX, y: c.y - panDown.current.startY })
    }
  }

  const canvasCursor = connecting
    ? 'crosshair'
    : dragging === 'node' || dragging === 'pan'
      ? 'grabbing'
      : 'grab'

  const W = Math.max(1000, ...nodes.map(n => n.x + NODE_W + 120))
  const H = Math.max(600,  ...nodes.map(n => n.y + NODE_H + 120))

  const curve = (e: WorkflowEdge): string | null => {
    const a = nodes.find(n => n.id === e.from)
    const b = nodes.find(n => n.id === e.to)
    if (!a || !b) return null
    const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2
    const x2 = b.x,          y2 = b.y + NODE_H / 2
    const cx = (x1 + x2) / 2
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
  }

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', background: COLORS.bg, cursor: canvasCursor, touchAction: 'none', userSelect: 'none' }}
      onPointerDown={onBgPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    >
      <style>{`
        @keyframes flowDash { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        @keyframes nodePulse { 0%,100% { opacity:.12; } 50% { opacity:.28; } }
      `}</style>

      {/* scanline */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.007) 3px,rgba(255,255,255,.007) 4px)', zIndex: 0 }} />

      {/* blueprint grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <defs>
          <pattern id="grid-sm" width="24" height="24" patternUnits="userSpaceOnUse" x={pan.x % 24} y={pan.y % 24}>
            <path d="M24,0 L0,0 0,24" fill="none" stroke={COLORS.border} strokeWidth="0.5" opacity="0.6" />
          </pattern>
          <pattern id="grid-lg" width="120" height="120" patternUnits="userSpaceOnUse" x={pan.x % 120} y={pan.y % 120}>
            <path d="M120,0 L0,0 0,120" fill="none" stroke={COLORS.border2} strokeWidth="0.8" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-sm)" />
        <rect width="100%" height="100%" fill="url(#grid-lg)" />
      </svg>

      {/* connect hint */}
      {connecting && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: COLORS.amber, color: COLORS.bg, padding: '5px 16px', borderRadius: 3, fontFamily: MONO, fontSize: 11, pointerEvents: 'none', zIndex: 10, fontWeight: 500 }}>
          TAP NODE TO CONNECT →
        </div>
      )}

      {/* pan hint */}
      <div style={{ position: 'absolute', bottom: 80, right: 16, fontFamily: MONO, fontSize: 9, color: COLORS.muted2, pointerEvents: 'none', zIndex: 2, textAlign: 'right', lineHeight: 1.6 }}>
        DRAG NODE TO MOVE<br />DRAG BG TO PAN
      </div>

      {/* canvas content */}
      <div style={{ position: 'absolute', left: pan.x, top: pan.y, width: W, height: H, zIndex: 1 }}>
        {/* SVG edges */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={COLORS.muted2} />
            </marker>
            <marker id="arrA" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={COLORS.cyan} />
            </marker>
          </defs>
          {edges.map(e => {
            const d = curve(e)
            if (!d) return null
            const fromNode = nodes.find(n => n.id === e.from)
            const active = fromNode && (fromNode.status === 'done' || fromNode.status === 'running')
            return (
              <g key={e.id}>
                {active && (
                  <path d={d} fill="none" stroke={COLORS.cyan} strokeWidth="2.5"
                    strokeDasharray="8 5"
                    style={{ animation: 'flowDash .5s linear infinite' }}
                    opacity="0.8"
                    filter={`drop-shadow(0 0 4px ${COLORS.cyan})`}
                  />
                )}
                <path d={d} fill="none"
                  stroke={active ? COLORS.cyan : COLORS.border2}
                  strokeWidth={active ? 1 : 1.5}
                  strokeDasharray={active ? 'none' : '5 5'}
                  markerEnd={active ? 'url(#arrA)' : 'url(#arr)'}
                  opacity={active ? 0.2 : 0.7}
                />
              </g>
            )
          })}
        </svg>

        {/* Node cards */}
        {nodes.map(node => {
          const agent   = agentById(agents, node.agentId)
          const model   = modelById(agent.model)
          const task    = taskByType(node.type)
          const sel     = selectedId === node.id
          const isRun   = runningId  === node.id || node.status === 'running'
          const sc      = statusColor(node.status)
          const provCol = PROVIDER_COLOR[model.provider] ?? COLORS.amber

          return (
            <div
              key={node.id}
              style={{ position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H, cursor: connecting ? 'crosshair' : dragging === 'node' ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
              onPointerDown={e => onNodePointerDown(e, node)}
            >
              {isRun && (
                <div style={{ position: 'absolute', inset: -6, borderRadius: 8, background: COLORS.cyan, opacity: 0.08, animation: 'nodePulse 1s ease-in-out infinite' }} />
              )}

              <div style={{
                position: 'relative', width: '100%', height: '100%',
                background: COLORS.surface2,
                border: `1px solid ${sel ? COLORS.amber : isRun ? COLORS.cyan : node.status === 'error' ? COLORS.red : COLORS.border2}`,
                borderRadius: 6, overflow: 'hidden',
                boxShadow: sel ? `0 0 0 1px ${COLORS.amber},0 0 20px ${COLORS.amber}20` : isRun ? `0 0 12px ${COLORS.cyan}30` : 'none',
              }}>
                {/* corner brackets */}
                {[
                  { top: 4, left:  4, borderTop: `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}`, borderLeft:   `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}` },
                  { top: 4, right: 4, borderTop: `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}`, borderRight:  `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}` },
                  { bottom: 4, left:  4, borderBottom: `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}`, borderLeft:  `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}` },
                  { bottom: 4, right: 4, borderBottom: `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}`, borderRight: `1.5px solid ${sel ? COLORS.amber : COLORS.muted2}` },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 8, height: 8, ...s }} />
                ))}

                {/* status bar */}
                <div style={{ height: 2, background: `linear-gradient(90deg,${sc},${sc}80,transparent)`, position: 'absolute', top: 0, left: 0, right: 0 }} />

                {/* agent row */}
                <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13, lineHeight: 1 }}>{agent.emoji}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                  <button
                    type="button"
                    title="View details"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation()
                      onViewDetails(node.id)
                    }}
                    style={{
                      flexShrink: 0,
                      background: sel ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
                      color: sel ? '#00f0ff' : 'rgba(0, 240, 255, 0.6)',                       
                      border: `1px solid ${sel ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: sel ? 700 : 600, 
                      letterSpacing: '0.06em',
                      padding: '4px 8px',
                      lineHeight: 1,                      
                      transition: 'all 0.15s ease-in-out',
                      boxShadow: sel 
                        ? '0 0 10px rgba(0, 240, 255, 0.35), inset 0 0 4px rgba(0, 240, 255, 0.2)' 
                        : 'none',
                      transform: sel ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    DETAILS
                  </button>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor(agent.status), flexShrink: 0 }} />
                </div>

                {/* label */}
                <div style={{ padding: '6px 12px 0', fontFamily: SANS, fontSize: 12, fontWeight: 600, color: COLORS.text, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {node.label}
                </div>

                {/* footer */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: COLORS.muted, background: COLORS.surface3, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: '2px 5px', flexShrink: 0 }}>
                    {task.label}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: provCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {model.label.split(' ').slice(-1)[0]}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 8, color: sc }}>{node.status}</span>
                </div>

                {/* status tint */}
                {(node.status === 'running' || node.status === 'done' || node.status === 'error') && (
                  <div style={{ position: 'absolute', inset: 0, background: `${sc}06`, pointerEvents: 'none' }} />
                )}
              </div>

              {/* output port */}
              <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: COLORS.bg, border: `2px solid ${COLORS.amber}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.amber, opacity: 0.7 }} />
              </div>
              {/* input port */}
              <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: COLORS.bg, border: `2px solid ${COLORS.border2}` }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
