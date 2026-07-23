// Data contract for the Graph Visualizer demo.
//
// A user pastes JSON of this shape. Edges are directional: source -> target.

export interface GraphNode {
  /** Unique identifier for the node. Required. */
  id: string;
  /** Display text. Falls back to `id` when omitted. */
  label?: string;
  /** Category used to color the node and build the legend. */
  type?: string;
  /** Arbitrary metadata shown on hover / click. */
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  /** Id of the source node. Required; must reference an existing node. */
  source: string;
  /** Id of the target node. Required; must reference an existing node. */
  target: string;
  /** Category used to color the edge. */
  type?: string;
  /** Display text for the edge. */
  label?: string;
  /** Arbitrary metadata shown on hover / click. */
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Internal shapes handed to react-force-graph-2d. The simulation mutates
// positional fields (x/y/vx/vy) in place, and rewrites link source/target
// from ids into node references, so those fields are widened accordingly.
// ---------------------------------------------------------------------------

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  /** Color assigned from the palette based on `type`. */
  color: string;
}

export interface SimLink extends Omit<GraphEdge, 'source' | 'target'> {
  // react-force-graph replaces the id strings with node object references.
  source: string | SimNode;
  target: string | SimNode;
  /** Color assigned from the palette based on edge `type`. */
  color: string;
}

export interface SimGraph {
  nodes: SimNode[];
  links: SimLink[];
}

export const MAX_NODES = 1000;
export const MAX_EDGES = 2000;
