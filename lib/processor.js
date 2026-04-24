const NODE_PATTERN = /^([A-Z])->([A-Z])$/;

export function processData(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('data must be an array');
  }

  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const duplicateSeen = new Set();

  const nodeOrder = new Map();
  let order = 0;
  const parentOf = Object.create(null);
  const childrenOf = Object.create(null);

  for (const raw of data) {
    const asString = typeof raw === 'string' ? raw : String(raw ?? '');
    const trimmed = asString.trim();
    const match = NODE_PATTERN.exec(trimmed);

    if (!match) {
      invalidEntries.push(asString);
      continue;
    }

    const parent = match[1];
    const child = match[2];

    if (parent === child) {
      invalidEntries.push(asString);
      continue;
    }

    if (seenEdges.has(trimmed)) {
      if (!duplicateSeen.has(trimmed)) {
        duplicateSeen.add(trimmed);
        duplicateEdges.push(trimmed);
      }
      continue;
    }
    seenEdges.add(trimmed);

    if (parentOf[child] !== undefined) continue;

    if (!nodeOrder.has(parent)) nodeOrder.set(parent, order++);
    if (!nodeOrder.has(child)) nodeOrder.set(child, order++);

    parentOf[child] = parent;
    if (!childrenOf[parent]) childrenOf[parent] = [];
    childrenOf[parent].push(child);
  }

  const adj = Object.create(null);
  for (const node of nodeOrder.keys()) adj[node] = new Set();
  for (const child of Object.keys(parentOf)) {
    const parent = parentOf[child];
    adj[parent].add(child);
    adj[child].add(parent);
  }

  const visited = new Set();
  const components = [];
  const orderedNodes = [...nodeOrder.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([n]) => n);

  for (const start of orderedNodes) {
    if (visited.has(start)) continue;
    const comp = [];
    const queue = [start];
    visited.add(start);
    while (queue.length) {
      const node = queue.shift();
      comp.push(node);
      for (const neighbor of adj[node]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(comp);
  }

  const hierarchies = [];
  for (const comp of components) {
    const roots = comp.filter((n) => parentOf[n] === undefined);

    if (roots.length === 0) {
      const root = [...comp].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    const root = [...roots].sort()[0];
    const { tree, depth } = buildTreeAndDepth(root, childrenOf);
    hierarchies.push({ root, tree, depth });
  }

  const treeHierarchies = hierarchies.filter((h) => !h.has_cycle);
  const cycleHierarchies = hierarchies.filter((h) => h.has_cycle);

  let largestTreeRoot = '';
  let maxDepth = -1;
  for (const h of treeHierarchies) {
    if (h.depth > maxDepth || (h.depth === maxDepth && h.root < largestTreeRoot)) {
      maxDepth = h.depth;
      largestTreeRoot = h.root;
    }
  }

  return {
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: treeHierarchies.length,
      total_cycles: cycleHierarchies.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}

function buildTreeAndDepth(root, childrenOf) {
  const rootObj = {};
  const objOf = new Map();
  objOf.set(root, rootObj);
  const queue = [[root, 1]];
  let maxDepth = 1;

  while (queue.length) {
    const [node, level] = queue.shift();
    if (level > maxDepth) maxDepth = level;
    const kids = childrenOf[node] || [];
    const parentObj = objOf.get(node);
    for (const k of kids) {
      const kidObj = {};
      parentObj[k] = kidObj;
      objOf.set(k, kidObj);
      queue.push([k, level + 1]);
    }
  }

  return { tree: { [root]: rootObj }, depth: maxDepth };
}
