import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, SimGraph, SimLink, SimNode } from './types';
import { MAX_EDGES, MAX_NODES } from './types';
import { sampleGraphJson } from './sampleData';
import { parseAndValidate } from './validateGraph';

// Distinct, readable palette. Types are assigned colors by first-seen order.
const PALETTE = [
  '#2563eb', // blue
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#dc2626', // red
  '#0891b2', // cyan
  '#ca8a04', // yellow-600
  '#db2777', // pink
  '#4b5563', // gray-600
  '#65a30d', // lime
];
const UNTYPED_NODE_COLOR = '#94a3b8'; // slate-400
const UNTYPED_EDGE_COLOR = '#cbd5e1'; // slate-300

/** Assign a stable color to each distinct type in first-seen order. */
function buildColorMap(types: (string | undefined)[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of types) {
    if (t === undefined) continue;
    if (!map.has(t)) map.set(t, PALETTE[map.size % PALETTE.length]);
  }
  return map;
}

/** Turn validated graph data into the shape react-force-graph consumes. */
function toSimGraph(data: GraphData): { graph: SimGraph; nodeTypes: Map<string, string> } {
  const nodeTypes = buildColorMap(data.nodes.map((n) => n.type));
  const edgeTypes = buildColorMap(data.edges.map((e) => e.type));

  const nodes: SimNode[] = data.nodes.map((n) => ({
    ...n,
    color: n.type ? nodeTypes.get(n.type) ?? UNTYPED_NODE_COLOR : UNTYPED_NODE_COLOR,
  }));
  const links: SimLink[] = data.edges.map((e) => ({
    ...e,
    color: e.type ? edgeTypes.get(e.type) ?? UNTYPED_EDGE_COLOR : UNTYPED_EDGE_COLOR,
  }));

  return { graph: { nodes, links }, nodeTypes };
}

function propertiesToLines(properties: Record<string, unknown> | undefined): string[] {
  if (!properties) return [];
  return Object.entries(properties).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
}

type Selection =
  | { kind: 'node'; node: SimNode }
  | { kind: 'link'; link: SimLink }
  | null;

export default function GraphVisualizer() {
  const [rawText, setRawText] = useState<string>(sampleGraphJson);
  const [graph, setGraph] = useState<SimGraph | null>(null);
  const [legend, setLegend] = useState<Array<{ type: string; color: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ nodes: number; edges: number } | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  // Measure the graph container so the canvas fills it responsively.
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const render = useCallback((text: string) => {
    const result = parseAndValidate(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const { graph: simGraph, nodeTypes } = toSimGraph(result.data);
    setError(null);
    setSelection(null);
    setGraph(simGraph);
    setCounts({ nodes: result.data.nodes.length, edges: result.data.edges.length });
    setLegend(Array.from(nodeTypes, ([type, color]) => ({ type, color })));
  }, []);

  // Render the sample once on mount.
  useEffect(() => {
    render(sampleGraphJson);
  }, [render]);

  const loadSample = useCallback(() => {
    setRawText(sampleGraphJson);
    render(sampleGraphJson);
  }, [render]);

  const nodeLabel = useCallback((node: SimNode) => {
    const title = node.label ?? node.id;
    const lines = [`<strong>${title}</strong>`];
    if (node.type) lines.push(`type: ${node.type}`);
    lines.push(...propertiesToLines(node.properties));
    return lines.join('<br/>');
  }, []);

  const linkLabel = useCallback((link: SimLink) => {
    const lines: string[] = [];
    if (link.label) lines.push(`<strong>${link.label}</strong>`);
    if (link.type) lines.push(`type: ${link.type}`);
    lines.push(...propertiesToLines(link.properties));
    return lines.join('<br/>');
  }, []);

  // Draw node labels on top of the default circles, but only when zoomed in
  // enough (or the graph is small) so large graphs stay legible.
  const drawNodeLabel = useCallback(
    (node: SimNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const nodeCount = graph?.nodes.length ?? 0;
      if (globalScale < 1.5 && nodeCount > 120) return;
      if (node.x === undefined || node.y === undefined) return;
      const text = node.label ?? node.id;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.fillText(text, node.x, node.y + 5 / globalScale + fontSize * 0.2);
    },
    [graph],
  );

  const selectionLines = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'node') {
      const n = selection.node;
      return {
        heading: `Node · ${n.label ?? n.id}`,
        rows: [
          `id: ${n.id}`,
          ...(n.type ? [`type: ${n.type}`] : []),
          ...propertiesToLines(n.properties),
        ],
      };
    }
    const l = selection.link;
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return {
      heading: `Edge · ${src} → ${tgt}`,
      rows: [
        ...(l.label ? [`label: ${l.label}`] : []),
        ...(l.type ? [`type: ${l.type}`] : []),
        ...propertiesToLines(l.properties),
      ],
    };
  }, [selection]);

  return (
    <div className="mt-6 flex flex-col gap-4 lg:flex-row">
      {/* Input column */}
      <div className="flex w-full flex-col gap-3 lg:w-96 lg:shrink-0">
        <label htmlFor="graph-json" className="text-sm font-medium text-slate-700">
          Graph JSON
        </label>
        <textarea
          id="graph-json"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          spellCheck={false}
          className="h-72 w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:border-slate-500 focus:outline-none lg:h-[52vh]"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => render(rawText)}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Render graph
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Load sample
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Directional edges (source → target). Limits: {MAX_NODES} nodes, {MAX_EDGES} edges.
        </p>
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {counts && !error && (
          <div className="text-xs text-slate-500">
            Rendering {counts.nodes} nodes, {counts.edges} edges.
          </div>
        )}
      </div>

      {/* Graph column */}
      <div className="flex w-full flex-col gap-2">
        {legend.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {legend.map(({ type, color }) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                {type}
              </span>
            ))}
          </div>
        )}
        <div
          ref={containerRef}
          className="relative h-[60vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-white lg:h-[70vh]"
        >
          {graph && size.w > 0 && (
            <ForceGraph2D
              width={size.w}
              height={size.h}
              graphData={graph}
              backgroundColor="#ffffff"
              nodeRelSize={5}
              nodeColor={(n) => (n as SimNode).color}
              nodeLabel={(n) => nodeLabel(n as SimNode)}
              nodeCanvasObjectMode={() => 'after'}
              nodeCanvasObject={(n, ctx, scale) => drawNodeLabel(n as SimNode, ctx, scale)}
              linkColor={(l) => (l as SimLink).color}
              linkLabel={(l) => linkLabel(l as SimLink)}
              linkWidth={1.5}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkDirectionalArrowColor={(l) => (l as SimLink).color}
              onNodeClick={(n) => setSelection({ kind: 'node', node: n as SimNode })}
              onLinkClick={(l) => setSelection({ kind: 'link', link: l as SimLink })}
              onBackgroundClick={() => setSelection(null)}
              cooldownTicks={100}
            />
          )}
          {selectionLines && (
            <div className="absolute right-3 top-3 max-h-[80%] w-64 overflow-auto rounded-md border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-800">{selectionLines.heading}</span>
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>
              {selectionLines.rows.length > 0 ? (
                <ul className="space-y-0.5 text-slate-600">
                  {selectionLines.rows.map((row, i) => (
                    <li key={i} className="break-words font-mono">
                      {row}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No additional properties.</p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Drag nodes to reposition · scroll to zoom · drag the background to pan · click a node or
          edge for details.
        </p>
      </div>
    </div>
  );
}
