'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const EXAMPLE = `{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]
}`;

const REQUEST_TIMEOUT_MS = 15000;

function parseInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
    } catch {
      // fall through to line parsing
    }
  }

  return trimmed
    .split('\n')
    .map((line) => line.replace(/^\s*"|"\s*,?\s*$/g, '').trimEnd())
    .filter((line) => line.length > 0);
}

function BgGraph() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.max(36, Math.min(72, Math.floor((width * height) / 24000)));
    const speed = prefersReduced ? 0 : 0.22;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: 1.2 + Math.random() * 1.8,
    }));

    const MAX_DIST = 150;
    let raf;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_DIST * MAX_DIST) {
            const alpha = (1 - Math.sqrt(d2) / MAX_DIST) * 0.28;
            ctx.strokeStyle = `rgba(21, 115, 254, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(21, 115, 254, 0.55)';
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="bg-graph" aria-hidden="true" />;
}

function BrandLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-g1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2e86ff" />
          <stop offset="0.55" stopColor="#1573fe" />
          <stop offset="1" stopColor="#0b4bb4" />
        </linearGradient>
        <linearGradient id="brand-g2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#brand-g1)" />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="10.5"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
      />
      <g fill="none" stroke="url(#brand-g2)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M20 12 L12 21" />
        <path d="M20 12 L28 21" />
        <path d="M12 21 L12 28" />
        <path d="M28 21 L28 28" />
      </g>
      <g fill="#ffffff">
        <circle cx="20" cy="11.5" r="3" />
      </g>
      <g fill="#ffffff" fillOpacity="0.95">
        <circle cx="12" cy="21" r="2.2" />
        <circle cx="28" cy="21" r="2.2" />
      </g>
      <g fill="#ffffff" fillOpacity="0.75">
        <circle cx="12" cy="28" r="1.7" />
        <circle cx="28" cy="28" r="1.7" />
      </g>
    </svg>
  );
}

function TreeNode({ name, subtree }) {
  const keys = Object.keys(subtree);
  const isLeaf = keys.length === 0;
  return (
    <li className={isLeaf ? 'leaf' : ''}>
      <span className="node-label">{name}</span>
      {!isLeaf && (
        <ul>
          {keys.map((k) => (
            <TreeNode key={k} name={k} subtree={subtree[k]} />
          ))}
        </ul>
      )}
    </li>
  );
}

function layoutTree(rootName, subtree) {
  const nodes = [];
  const edges = [];
  let leafIndex = 0;
  const HGAP = 78;
  const VGAP = 84;
  const PADDING = 42;

  const walk = (name, tree, depth, parentIdx) => {
    const selfIdx = nodes.length;
    nodes.push({ name, depth, x: 0 });
    if (parentIdx !== null) edges.push([parentIdx, selfIdx]);
    const keys = Object.keys(tree);
    if (keys.length === 0) {
      nodes[selfIdx].x = leafIndex * HGAP;
      leafIndex++;
    } else {
      const childIdxs = keys.map((k) => walk(k, tree[k], depth + 1, selfIdx));
      const xs = childIdxs.map((i) => nodes[i].x);
      nodes[selfIdx].x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    return selfIdx;
  };

  walk(rootName, subtree, 0, null);

  const xs = nodes.map((n) => n.x);
  const offsetX = PADDING - Math.min(...xs);
  const laid = nodes.map((n) => ({
    name: n.name,
    x: n.x + offsetX,
    y: n.depth * VGAP + PADDING,
  }));
  const maxX = Math.max(...laid.map((n) => n.x));
  const maxY = Math.max(...laid.map((n) => n.y));
  return {
    nodes: laid,
    edges,
    width: maxX + PADDING,
    height: maxY + PADDING,
  };
}

function GraphView({ rootName, subtree }) {
  const { nodes, edges, width, height } = useMemo(
    () => layoutTree(rootName, subtree),
    [rootName, subtree],
  );
  const R = 22;
  const RIM = 9;
  const hasChild = useMemo(() => new Set(edges.map(([f]) => f)), [edges]);
  const safeId = rootName.replace(/[^A-Za-z0-9_-]/g, '_');
  const gradId = `grad-${safeId}`;
  const leafGradId = `leafgrad-${safeId}`;
  const shadowId = `shadow-${safeId}`;

  return (
    <div className="graph-wrap">
      <svg
        className="graph"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Hierarchy graph rooted at ${rootName}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4c9bff" />
            <stop offset="55%" stopColor="#1573fe" />
            <stop offset="100%" stopColor="#0b4bb4" />
          </linearGradient>
          <linearGradient id={leafGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef4ff" />
          </linearGradient>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1573fe" floodOpacity="0.28" />
          </filter>
        </defs>

        {edges.map(([from, to], i) => {
          const f = nodes[from];
          const t = nodes[to];
          const midY = f.y + (t.y - f.y) / 2;
          const d = `M ${f.x} ${f.y} C ${f.x} ${midY}, ${t.x} ${midY}, ${t.x} ${t.y}`;
          return (
            <path
              key={i}
              d={d}
              stroke="rgba(21, 115, 254, 0.45)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {nodes.map((n, i) => {
          const isRoot = i === 0;
          const isLeaf = !hasChild.has(i);
          return (
            <g key={i} className={`gnode${isRoot ? ' is-root' : ''}${isLeaf ? ' is-leaf' : ''}`}>
              {isRoot && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R + RIM}
                  fill="none"
                  stroke="rgba(21,115,254,0.3)"
                  strokeWidth="1.4"
                  strokeDasharray="3 4"
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={R}
                fill={isLeaf ? `url(#${leafGradId})` : `url(#${gradId})`}
                stroke={isLeaf ? 'rgba(21,115,254,0.55)' : 'rgba(255,255,255,0.85)'}
                strokeWidth="2"
                filter={`url(#${shadowId})`}
              />
              <text
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"
                fontWeight="700"
                fill={isLeaf ? '#0b4bb4' : '#ffffff'}
                style={{ userSelect: 'none' }}
              >
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CycleGraphView({ root }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 48;
  return (
    <div className="graph-wrap cycle">
      <svg
        className="graph cycle-graph"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Cyclic component with root ${root}`}
      >
        <defs>
          <marker id={`cy-arrow-${root}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#b16a00" />
          </marker>
          <linearGradient id={`cy-grad-${root}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5a524" />
            <stop offset="100%" stopColor="#b16a00" />
          </linearGradient>
          <filter id={`cy-shadow-${root}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#b16a00" floodOpacity="0.35" />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245, 165, 36, 0.35)" strokeWidth="1.6" strokeDasharray="3 5" />
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.5} ${cy - r}`}
          fill="none"
          stroke="rgba(245, 165, 36, 0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd={`url(#cy-arrow-${root})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={22}
          fill={`url(#cy-grad-${root})`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          filter={`url(#cy-shadow-${root})`}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="15"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fill="#fff"
          style={{ userSelect: 'none' }}
        >
          {root}
        </text>
      </svg>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 5.5V3h2.5M11 5.5V3H8.5M3 8.5V11h2.5M11 8.5V11H8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HierarchyCard({ h, onExpand }) {
  const [view, setView] = useState('graph');

  if (h.has_cycle) {
    return (
      <div className="hierarchy cyclic">
        <div className="hier-header">
          <span className="root-label">
            Root <strong>{h.root}</strong>
          </span>
          <div className="hier-header-right">
            <button
              type="button"
              className="icon-btn"
              onClick={onExpand}
              aria-label="Expand graph to fullscreen"
              title="Expand"
            >
              <ExpandIcon />
            </button>
            <span className="badge badge-cycle">cycle detected</span>
          </div>
        </div>
        <CycleGraphView root={h.root} />
        <div className="cycle-note">
          This group forms a cycle — no valid root-to-leaf tree can be produced.
        </div>
      </div>
    );
  }

  const rootKey = Object.keys(h.tree)[0];
  return (
    <div className="hierarchy">
      <div className="hier-header">
        <span className="root-label">
          Root <strong>{h.root}</strong>
        </span>
        <div className="hier-header-right">
          <div className="view-toggle" role="tablist" aria-label="Switch hierarchy view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'graph'}
              className={view === 'graph' ? 'active' : ''}
              onClick={() => setView('graph')}
            >
              Graph
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'tree'}
              className={view === 'tree' ? 'active' : ''}
              onClick={() => setView('tree')}
            >
              Tree
            </button>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onExpand}
            aria-label="Expand graph to fullscreen"
            title="Expand"
          >
            <ExpandIcon />
          </button>
          <span className="badge badge-depth">depth {h.depth}</span>
        </div>
      </div>
      {view === 'graph' ? (
        <GraphView rootName={rootKey} subtree={h.tree[rootKey]} />
      ) : (
        <ul className="tree">
          {rootKey && <TreeNode name={rootKey} subtree={h.tree[rootKey]} />}
        </ul>
      )}
    </div>
  );
}

function FullGraphModal({ h, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!h) return null;

  const rootKey = h.has_cycle ? null : Object.keys(h.tree)[0];

  return (
    <div
      className="fg-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Full graph rooted at ${h.root}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fg-modal">
        <div className="fg-head">
          <div className="fg-title">
            <span className="root-label">
              Root <strong>{h.root}</strong>
            </span>
            {h.has_cycle ? (
              <span className="badge badge-cycle">cycle detected</span>
            ) : (
              <span className="badge badge-depth">depth {h.depth}</span>
            )}
          </div>
          <button
            type="button"
            className="fg-close"
            onClick={onClose}
            aria-label="Close expanded graph"
          >
            ✕
          </button>
        </div>
        <div className="fg-body">
          {h.has_cycle ? (
            <CycleGraphView root={h.root} />
          ) : (
            <GraphView rootName={rootKey} subtree={h.tree[rootKey]} />
          )}
        </div>
        <div className="fg-foot">
          <span className="field-hint">Press Esc or click outside to close</span>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [input, setInput] = useState(EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const abortRef = useRef(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  const parsedPreview = useMemo(() => {
    try {
      return parseInput(input);
    } catch {
      return [];
    }
  }, [input]);

  const canSubmit = !loading && input.trim().length > 0;

  async function submit(event) {
    event?.preventDefault?.();
    if (!canSubmit) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = parseInput(input);
      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        signal: controller.signal,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && json.error) || `Request failed (${res.status})`);
      }
      setResult(json);
    } catch (e) {
      if (e.name === 'AbortError') {
        setError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The server may be sleeping — try again.`);
      } else if (e.message === 'Failed to fetch') {
        setError('Could not reach the API. Make sure the dev server is running on port 3000.');
      } else {
        setError(e.message || 'Something went wrong');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e) {
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  async function copyJson() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Unable to copy to clipboard');
    }
  }

  function loadExample() {
    setInput(EXAMPLE);
    setError(null);
  }

  function clearAll() {
    setInput('');
    setResult(null);
    setError(null);
  }

  return (
    <>
      <BgGraph />
      <span className="bg-orb o1" aria-hidden="true" />
      <span className="bg-orb o2" aria-hidden="true" />
      <span className="bg-orb o3" aria-hidden="true" />

      <nav className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <BrandLogo className="brand-logo" />
            <span className="brand-name">
              <span className="n1">Hierarchia</span>
              <span className="n2">SRM Full Stack · Round 1</span>
            </span>
          </div>
          <span className="topbar-spacer" />
          <span className="api-chip">POST /bfhl</span>
        </div>
      </nav>

      <main>
        <header className="hero">
          <span className="eyebrow">Live API · CORS enabled</span>
          <h1>
            Analyze hierarchies with <span className="accent">confidence</span>.
          </h1>
          <p className="subtitle">
            Paste edges like <code>A-&gt;B</code>, one per line or as a JSON array. The service validates every
            entry, constructs trees with a first-parent-wins rule, detects cycles, and returns an
            evaluator-ready structured summary.
          </p>
        </header>

        <form className="card input-card" onSubmit={submit}>
          <div className="field-head">
            <label htmlFor="edges" className="field-label">Input edges</label>
            <span className="count-chip">{parsedPreview.length} parsed</span>
          </div>
          <textarea
            id="edges"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={'A->B\nA->C\nB->D'}
          />
          <div className="controls">
            <span className="field-hint">
              Accepts one-per-line or a JSON array like <code>{'["A->B", "A->C"]'}</code>
            </span>
            <div className="btn-row">
              <button type="button" className="btn" onClick={loadExample}>
                Load example
              </button>
              <button type="button" className="btn" onClick={clearAll}>
                Clear
              </button>
              <button type="submit" className="btn primary" disabled={!canSubmit}>
                <span>{loading ? 'Analyzing…' : 'Analyze'}</span>
                <span className="kbd">{isMac ? '⌘' : 'Ctrl'} ↵</span>
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="error" role="alert">
            <span className="dot" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="result">
            <div className="card identity">
              <div className="field">
                <div className="label">user_id</div>
                <div className="value">{result.user_id}</div>
              </div>
              <div className="field">
                <div className="label">email_id</div>
                <div className="value">{result.email_id}</div>
              </div>
              <div className="field">
                <div className="label">college_roll_number</div>
                <div className="value">{result.college_roll_number}</div>
              </div>
            </div>

            <div className="summary">
              <div className="stat">
                <div className="stat-label">Total trees</div>
                <div className="stat-value">{result.summary.total_trees}</div>
              </div>
              <div className="stat gold">
                <div className="stat-label">Total cycles</div>
                <div className="stat-value">{result.summary.total_cycles}</div>
              </div>
              <div className="stat navy">
                <div className="stat-label">Largest tree root</div>
                <div className="stat-value">{result.summary.largest_tree_root || '—'}</div>
              </div>
            </div>

            {result.hierarchies.length > 0 && (
              <>
                <div className="section-title">
                  Hierarchies
                  <span className="count">{result.hierarchies.length}</span>
                </div>
                <div className="hierarchies">
                  {result.hierarchies.map((h, i) => (
                    <HierarchyCard
                      key={`${h.root}-${i}`}
                      h={h}
                      onExpand={() => setExpanded(h)}
                    />
                  ))}
                </div>
              </>
            )}

            {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
              <div className="two-col">
                {result.invalid_entries.length > 0 && (
                  <div className="card pad">
                    <div className="section-title" style={{ margin: 0 }}>
                      Invalid entries
                      <span className="count">{result.invalid_entries.length}</span>
                    </div>
                    <div className="chips">
                      {result.invalid_entries.map((v, i) => (
                        <span key={i} className="chip invalid">
                          {v === '' ? '∅ (empty)' : String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.duplicate_edges.length > 0 && (
                  <div className="card pad">
                    <div className="section-title" style={{ margin: 0 }}>
                      Duplicate edges
                      <span className="count">{result.duplicate_edges.length}</span>
                    </div>
                    <div className="chips">
                      {result.duplicate_edges.map((v, i) => (
                        <span key={i} className="chip duplicate">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="raw">
              <details>
                <summary>View raw JSON response</summary>
                <pre>{JSON.stringify(result, null, 2)}</pre>
                <div className="raw-wrap copy-btn">
                  <button type="button" className="btn" onClick={copyJson}>
                    Copy JSON
                  </button>
                  <span className={`copy-status ${copied ? 'show' : ''}`}>Copied to clipboard</span>
                </div>
              </details>
            </div>
          </section>
        )}

        <footer>
          <span>SRM Full Stack · Round 1</span>
          <span className="sep">·</span>
          <span>POST /bfhl</span>
          <span className="sep">·</span>
          <span>Built with Next.js</span>
        </footer>
      </main>

      {expanded && <FullGraphModal h={expanded} onClose={() => setExpanded(null)} />}
    </>
  );
}
