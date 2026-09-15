import assert from 'node:assert/strict'
import { executeWorkflow, validateGraph } from '../src/lib/executionEngine.ts'

const nodes = ids => ids.map(id => ({ id }))
const edge = (from, to) => ({ from, to })

async function testValidation() {
  assert.equal(validateGraph(nodes(['A']), [edge('A', 'A')]).valid, false)
  assert.equal(validateGraph(nodes(['A']), [edge('A', 'B')]).valid, false)
  assert.equal(validateGraph(nodes(['A', 'B']), [edge('A', 'B'), edge('A', 'B')]).valid, false)
  assert.equal(validateGraph(nodes(['A', 'B']), [edge('A', 'B'), edge('B', 'A')]).valid, false)
}

async function testSequential() {
  let active = 0
  let peak = 0
  const result = await executeWorkflow({
    nodes: nodes(['A', 'B', 'C']), edges: [], mode: 'sequential',
    execute: async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return true },
  })
  assert.equal(peak, 1)
  assert.deepEqual(result, { A: 'done', B: 'done', C: 'done' })
}

async function testDagAndBlocked() {
  let active = 0
  let peak = 0
  const result = await executeWorkflow({
    nodes: nodes(['A', 'B', 'C']), edges: [edge('A', 'C'), edge('B', 'C')], mode: 'dag', maxAttempts: 2,
    execute: async node => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return node.id !== 'B' },
  })
  assert.equal(peak, 2)
  assert.deepEqual(result, { A: 'done', B: 'error', C: 'blocked' })
}

async function testParallelAndRetries() {
  const attempts = new Map()
  let cStartedBeforeACompleted = false
  let aCompleted = false
  const result = await executeWorkflow({
    nodes: nodes(['A', 'C']), edges: [edge('A', 'C')], mode: 'parallel', maxAttempts: 3,
    execute: async node => {
      attempts.set(node.id, (attempts.get(node.id) ?? 0) + 1)
      if (node.id === 'C' && !aCompleted) cStartedBeforeACompleted = true
      await new Promise(resolve => setTimeout(resolve, 5))
      if (node.id === 'A' && attempts.get(node.id) === 2) aCompleted = true
      return node.id !== 'A' || attempts.get(node.id) === 2
    },
  })
  assert.equal(cStartedBeforeACompleted, true)
  assert.equal(attempts.get('A'), 2)
  assert.deepEqual(result, { A: 'done', C: 'done' })
}

await testValidation()
await testSequential()
await testDagAndBlocked()
await testParallelAndRetries()
console.log('Execution engine tests passed')
