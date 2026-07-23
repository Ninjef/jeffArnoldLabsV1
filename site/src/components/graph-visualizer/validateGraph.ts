import type { GraphData, GraphEdge, GraphNode } from './types';
import { MAX_EDGES, MAX_NODES } from './types';

export type ValidationResult =
  | { ok: true; data: GraphData }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse raw JSON text and validate it against the graph data contract.
 * Returns the typed data on success, or a human-readable error message.
 */
export function parseAndValidate(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Invalid JSON: ${message}` };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: 'Top-level value must be an object with "nodes" and "edges" arrays.' };
  }

  const { nodes, edges } = parsed as { nodes?: unknown; edges?: unknown };

  if (!Array.isArray(nodes)) {
    return { ok: false, error: '"nodes" must be an array.' };
  }
  if (!Array.isArray(edges)) {
    return { ok: false, error: '"edges" must be an array.' };
  }

  if (nodes.length > MAX_NODES) {
    return { ok: false, error: `Too many nodes: ${nodes.length} (limit is ${MAX_NODES}).` };
  }
  if (edges.length > MAX_EDGES) {
    return { ok: false, error: `Too many edges: ${edges.length} (limit is ${MAX_EDGES}).` };
  }

  const ids = new Set<string>();
  const validNodes: GraphNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!isObject(node)) {
      return { ok: false, error: `Node at index ${i} must be an object.` };
    }
    const { id, label, type, properties } = node as Record<string, unknown>;
    if (typeof id !== 'string' || id.length === 0) {
      return { ok: false, error: `Node at index ${i} is missing a non-empty string "id".` };
    }
    if (ids.has(id)) {
      return { ok: false, error: `Duplicate node id: "${id}".` };
    }
    if (label !== undefined && typeof label !== 'string') {
      return { ok: false, error: `Node "${id}" has a non-string "label".` };
    }
    if (type !== undefined && typeof type !== 'string') {
      return { ok: false, error: `Node "${id}" has a non-string "type".` };
    }
    if (properties !== undefined && !isObject(properties)) {
      return { ok: false, error: `Node "${id}" has non-object "properties".` };
    }
    ids.add(id);
    // Fields validated above; cast through unknown since the input type is a
    // generic record that doesn't structurally overlap with GraphNode.
    validNodes.push(node as unknown as GraphNode);
  }

  const validEdges: GraphEdge[] = [];

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!isObject(edge)) {
      return { ok: false, error: `Edge at index ${i} must be an object.` };
    }
    const { source, target, type, label, properties } = edge as Record<string, unknown>;
    if (typeof source !== 'string' || source.length === 0) {
      return { ok: false, error: `Edge at index ${i} is missing a non-empty string "source".` };
    }
    if (typeof target !== 'string' || target.length === 0) {
      return { ok: false, error: `Edge at index ${i} is missing a non-empty string "target".` };
    }
    if (!ids.has(source)) {
      return { ok: false, error: `Edge at index ${i} references unknown source node "${source}".` };
    }
    if (!ids.has(target)) {
      return { ok: false, error: `Edge at index ${i} references unknown target node "${target}".` };
    }
    if (type !== undefined && typeof type !== 'string') {
      return { ok: false, error: `Edge at index ${i} has a non-string "type".` };
    }
    if (label !== undefined && typeof label !== 'string') {
      return { ok: false, error: `Edge at index ${i} has a non-string "label".` };
    }
    if (properties !== undefined && !isObject(properties)) {
      return { ok: false, error: `Edge at index ${i} has non-object "properties".` };
    }
    // Fields validated above; cast through unknown (see node cast note).
    validEdges.push(edge as unknown as GraphEdge);
  }

  return { ok: true, data: { nodes: validNodes, edges: validEdges } };
}
