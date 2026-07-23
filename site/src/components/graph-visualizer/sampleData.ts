import type { GraphData } from './types';

// A small, valid dataset that exercises multiple node/edge types, directional
// edges, and arbitrary properties. Pre-populates the textarea so the page
// renders something immediately.
export const sampleGraph: GraphData = {
  nodes: [
    { id: 'alice', label: 'Alice', type: 'person', properties: { role: 'Founder', joined: 2018 } },
    { id: 'bob', label: 'Bob', type: 'person', properties: { role: 'Engineer', joined: 2019 } },
    { id: 'carol', label: 'Carol', type: 'person', properties: { role: 'Designer', joined: 2021 } },
    { id: 'acme', label: 'Acme Inc', type: 'company', properties: { hq: 'Austin, TX' } },
    { id: 'globex', label: 'Globex', type: 'company', properties: { hq: 'Boston, MA' } },
    { id: 'atlas', label: 'Project Atlas', type: 'project', properties: { status: 'active' } },
    { id: 'nimbus', label: 'Project Nimbus', type: 'project', properties: { status: 'archived' } },
    { id: 'austin', label: 'Austin', type: 'place' },
  ],
  edges: [
    { source: 'alice', target: 'acme', type: 'works_at', label: 'since 2018', properties: { title: 'CEO' } },
    { source: 'bob', target: 'acme', type: 'works_at', properties: { title: 'Staff Engineer' } },
    { source: 'carol', target: 'globex', type: 'works_at' },
    { source: 'alice', target: 'atlas', type: 'leads' },
    { source: 'bob', target: 'atlas', type: 'contributes_to' },
    { source: 'carol', target: 'nimbus', type: 'contributes_to' },
    { source: 'acme', target: 'atlas', type: 'sponsors' },
    { source: 'globex', target: 'nimbus', type: 'sponsors' },
    { source: 'acme', target: 'austin', type: 'located_in' },
    { source: 'alice', target: 'bob', type: 'mentors' },
  ],
};

export const sampleGraphJson = JSON.stringify(sampleGraph, null, 2);
