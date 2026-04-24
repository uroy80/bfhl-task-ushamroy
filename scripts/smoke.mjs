import { processData } from '../lib/processor.js';

const cases = [
  {
    name: 'spec example',
    input: [
      'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
      'X->Y', 'Y->Z', 'Z->X',
      'P->Q', 'Q->R',
      'G->H', 'G->H', 'G->I',
      'hello', '1->2', 'A->',
    ],
    expect: {
      hierarchies: [
        { root: 'A', tree: { A: { B: { D: {} }, C: { E: { F: {} } } } }, depth: 4 },
        { root: 'X', tree: {}, has_cycle: true },
        { root: 'P', tree: { P: { Q: { R: {} } } }, depth: 3 },
        { root: 'G', tree: { G: { H: {}, I: {} } }, depth: 2 },
      ],
      invalid_entries: ['hello', '1->2', 'A->'],
      duplicate_edges: ['G->H'],
      summary: { total_trees: 3, total_cycles: 1, largest_tree_root: 'A' },
    },
  },
  {
    name: 'self-loop invalid',
    input: ['A->A', 'A->B'],
    expect: {
      hierarchies: [{ root: 'A', tree: { A: { B: {} } }, depth: 2 }],
      invalid_entries: ['A->A'],
      duplicate_edges: [],
      summary: { total_trees: 1, total_cycles: 0, largest_tree_root: 'A' },
    },
  },
  {
    name: 'whitespace trimming',
    input: [' A->B ', '  A->C  ', 'A->B'],
    expect: {
      hierarchies: [{ root: 'A', tree: { A: { B: {}, C: {} } }, depth: 2 }],
      invalid_entries: [],
      duplicate_edges: ['A->B'],
      summary: { total_trees: 1, total_cycles: 0, largest_tree_root: 'A' },
    },
  },
  {
    name: 'bad formats',
    input: ['hello', '1->2', 'AB->C', 'A-B', 'A->', '', 'a->b'],
    expect: {
      hierarchies: [],
      invalid_entries: ['hello', '1->2', 'AB->C', 'A-B', 'A->', '', 'a->b'],
      duplicate_edges: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: '' },
    },
  },
  {
    name: 'diamond (first parent wins)',
    input: ['A->D', 'B->D', 'A->C', 'B->E'],
    expect: {
      hierarchies: [
        { root: 'A', tree: { A: { D: {}, C: {} } }, depth: 2 },
        { root: 'B', tree: { B: { E: {} } }, depth: 2 },
      ],
      invalid_entries: [],
      duplicate_edges: [],
      summary: { total_trees: 2, total_cycles: 0, largest_tree_root: 'A' },
    },
  },
  {
    name: 'duplicate repeated many times',
    input: ['A->B', 'A->B', 'A->B', 'A->B'],
    expect: {
      hierarchies: [{ root: 'A', tree: { A: { B: {} } }, depth: 2 }],
      invalid_entries: [],
      duplicate_edges: ['A->B'],
      summary: { total_trees: 1, total_cycles: 0, largest_tree_root: 'A' },
    },
  },
  {
    name: 'equal-depth tiebreaker (lex smaller)',
    input: ['C->D', 'A->B'],
    expect: {
      summary_largest_tree_root: 'A',
    },
  },
  {
    name: 'pure cycle two nodes',
    input: ['A->B', 'B->A'],
    expect: {
      hierarchies: [{ root: 'A', tree: {}, has_cycle: true }],
      summary: { total_trees: 0, total_cycles: 1, largest_tree_root: '' },
    },
  },
  {
    name: 'empty input',
    input: [],
    expect: {
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: '' },
    },
  },
];

let pass = 0;
let fail = 0;

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

for (const c of cases) {
  const out = processData(c.input);
  let ok = true;
  const diffs = [];

  if (c.expect.hierarchies && !eq(out.hierarchies, c.expect.hierarchies)) {
    ok = false;
    diffs.push(['hierarchies', out.hierarchies, c.expect.hierarchies]);
  }
  if (c.expect.invalid_entries && !eq(out.invalid_entries, c.expect.invalid_entries)) {
    ok = false;
    diffs.push(['invalid_entries', out.invalid_entries, c.expect.invalid_entries]);
  }
  if (c.expect.duplicate_edges && !eq(out.duplicate_edges, c.expect.duplicate_edges)) {
    ok = false;
    diffs.push(['duplicate_edges', out.duplicate_edges, c.expect.duplicate_edges]);
  }
  if (c.expect.summary && !eq(out.summary, c.expect.summary)) {
    ok = false;
    diffs.push(['summary', out.summary, c.expect.summary]);
  }
  if (c.expect.summary_largest_tree_root !== undefined &&
      out.summary.largest_tree_root !== c.expect.summary_largest_tree_root) {
    ok = false;
    diffs.push(['largest_tree_root', out.summary.largest_tree_root, c.expect.summary_largest_tree_root]);
  }

  if (ok) {
    pass++;
    console.log(`PASS  ${c.name}`);
  } else {
    fail++;
    console.log(`FAIL  ${c.name}`);
    for (const [field, got, want] of diffs) {
      console.log(`  ${field}`);
      console.log(`    got:  ${JSON.stringify(got)}`);
      console.log(`    want: ${JSON.stringify(want)}`);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
