import assert from 'assert';

// Simulate the exact DAG execution logic from executionStore.ts
async function runWorkflowSimulated({ nodes, edges, agents, agentStatusOverride = {} }) {
  const log = [];
  const nodeStatuses = {};
  const runningNodesAtTime = []; // Track parallel executions
  let currentTime = 0;

  // Initialize statuses
  for (const node of nodes) {
    nodeStatuses[node.id] = 'idle';
  }

  // Setup parents and children maps
  const parentsMap = new Map();
  const childrenMap = new Map();
  for (const node of nodes) {
    parentsMap.set(node.id, edges.filter(e => e.to === node.id).map(e => e.from));
    childrenMap.set(node.id, edges.filter(e => e.from === node.id).map(e => e.to));
  }

  let runningCount = 0;
  let resolveWorkflow = null;
  const workflowPromise = new Promise(resolve => {
    resolveWorkflow = resolve;
  });

  const executeNode = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    runningCount++;
    nodeStatuses[nodeId] = 'running';
    runningNodesAtTime.push({
      nodeId,
      time: currentTime,
      runningNodes: Object.keys(nodeStatuses).filter(id => nodeStatuses[id] === 'running')
    });

    log.push({ type: 'running', nodeId });

    // Simulated async execution: wait 100ms
    await new Promise(r => setTimeout(r, 100));

    // Determine success based on agent status
    const agentStatus = agentStatusOverride[node.agentId] || 'active';
    const ok = agentStatus !== 'warn';
    const finalStatus = ok ? 'done' : 'error';

    nodeStatuses[nodeId] = finalStatus;
    log.push({ type: finalStatus, nodeId });

    // Trigger child nodes if successful
    if (ok) {
      const children = childrenMap.get(nodeId) ?? [];
      for (const childId of children) {
        const parents = parentsMap.get(childId) ?? [];
        const allParentsDone = parents.every(pId => nodeStatuses[pId] === 'done');
        if (allParentsDone && nodeStatuses[childId] === 'idle') {
          // Trigger next node
          executeNode(childId);
        }
      }
    }

    runningCount--;
    if (runningCount === 0) {
      resolveWorkflow();
    }
  };

  // Start root nodes
  const rootNodes = nodes.filter(n => (parentsMap.get(n.id) ?? []).length === 0);
  if (rootNodes.length === 0 && nodes.length > 0) {
    // Fallback: start first node
    executeNode(nodes[0].id);
  } else {
    for (const root of rootNodes) {
      executeNode(root.id);
    }
  }

  if (nodes.length > 0) {
    await workflowPromise;
  }

  return { nodeStatuses, log, runningNodesAtTime };
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("Running workflow execution tests...");

  // Test Case 1: Simple linear chain (A -> B -> C)
  {
    const nodes = [
      { id: 'A', agentId: 'agent1' },
      { id: 'B', agentId: 'agent1' },
      { id: 'C', agentId: 'agent1' }
    ];
    const edges = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' }
    ];

    const result = await runWorkflowSimulated({ nodes, edges, agents: [] });
    assert.deepStrictEqual(result.nodeStatuses, { A: 'done', B: 'done', C: 'done' });
    
    // Check execution order in log
    const runningOrder = result.log.filter(l => l.type === 'running').map(l => l.nodeId);
    assert.deepStrictEqual(runningOrder, ['A', 'B', 'C']);
    console.log("✓ Test Case 1 passed (Linear execution: A -> B -> C)");
  }

  // Test Case 2: Parallel execution (1 root with 2 children: A -> B, A -> C)
  {
    const nodes = [
      { id: 'A', agentId: 'agent1' },
      { id: 'B', agentId: 'agent1' },
      { id: 'C', agentId: 'agent1' }
    ];
    const edges = [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' }
    ];

    const result = await runWorkflowSimulated({ nodes, edges, agents: [] });
    assert.deepStrictEqual(result.nodeStatuses, { A: 'done', B: 'done', C: 'done' });

    // Verify that B and C ran in parallel (at least one start snapshot contains both running)
    const runningAtCStart = result.runningNodesAtTime.find(r => r.nodeId === 'C');

    assert.ok(runningAtCStart.runningNodes.includes('B') && runningAtCStart.runningNodes.includes('C'));
    console.log("✓ Test Case 2 passed (Parallel children: B & C run concurrently)");
  }

  // Test Case 3: Multiple roots parallel execution (A and B are both roots, running in parallel)
  {
    const nodes = [
      { id: 'A', agentId: 'agent1' },
      { id: 'B', agentId: 'agent1' },
      { id: 'C', agentId: 'agent1' }
    ];
    const edges = [
      { from: 'A', to: 'C' },
      { from: 'B', to: 'C' }
    ];

    const result = await runWorkflowSimulated({ nodes, edges, agents: [] });
    assert.deepStrictEqual(result.nodeStatuses, { A: 'done', B: 'done', C: 'done' });

    // Verify that A and B started in parallel as roots
    const runningAtBStart = result.runningNodesAtTime.find(r => r.nodeId === 'B');

    assert.ok(runningAtBStart.runningNodes.includes('A') && runningAtBStart.runningNodes.includes('B'));
    
    // Verify that C only runs after both A and B are done
    const indexOfCDone = result.log.findIndex(l => l.nodeId === 'C');
    const indexOfADone = result.log.findIndex(l => l.nodeId === 'A' && l.type === 'done');
    const indexOfBDone = result.log.findIndex(l => l.nodeId === 'B' && l.type === 'done');
    
    assert.ok(indexOfCDone > indexOfADone);
    assert.ok(indexOfCDone > indexOfBDone);
    console.log("✓ Test Case 3 passed (Multiple roots: A & B run concurrently, C runs only after both finish)");
  }

  // Test Case 4: Node failure handles downstream skipping
  {
    const nodes = [
      { id: 'A', agentId: 'agent1' },
      { id: 'B', agentId: 'failing_agent' },
      { id: 'C', agentId: 'agent1' }
    ];
    const edges = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' }
    ];

    const result = await runWorkflowSimulated({
      nodes,
      edges,
      agents: [],
      agentStatusOverride: { failing_agent: 'warn' }
    });

    assert.strictEqual(result.nodeStatuses.A, 'done');
    assert.strictEqual(result.nodeStatuses.B, 'error');
    assert.strictEqual(result.nodeStatuses.C, 'idle'); // skipped / never executed
    console.log("✓ Test Case 4 passed (Upstream failure skips downstream nodes)");
  }

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✓");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
