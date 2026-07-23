// Shared list of interactive demos, surfaced on both the landing page and the
// /demos index. Demos have no publish date. They're living pages, not posts.

export interface Demo {
  slug: string;
  title: string;
  description: string;
}

export const DEMOS: Demo[] = [
  {
    slug: 'memory-steering',
    title: 'Memory Steering',
    description: 'Explore the interactive 3D embedding viewers from zero-shot latent space steering.',
  },
  {
    slug: 'graph-visualizer',
    title: 'Graph Visualizer',
    description: 'Paste a JSON node-edge dataset and explore it as a force-directed graph.',
  },
];
