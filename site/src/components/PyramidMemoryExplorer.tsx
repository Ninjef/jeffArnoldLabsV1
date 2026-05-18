import { useId, useState } from 'react';

type MemoryLayer = {
  id: string;
  title: string;
  subtitle?: string;
  points: string;
  icon: 'document' | 'flask' | 'fact' | 'folder' | 'tasks';
  titleY: number;
  iconY: number;
  subtitleY?: number;
  detailY: number;
  fill: string;
  stroke: string;
  text: string;
  detail: string[];
};

const APEX_X = 500;
const APEX_Y = 30;
const BASE_Y = 965;
const BASE_HALF_WIDTH = 675;

function edgeX(y: number, side: -1 | 1) {
  const progress = (y - APEX_Y) / (BASE_Y - APEX_Y);
  return APEX_X + side * BASE_HALF_WIDTH * progress;
}

function trapezoidPoints(topY: number, bottomY: number) {
  return `${edgeX(topY, -1)},${topY} ${edgeX(topY, 1)},${topY} ${edgeX(bottomY, 1)},${bottomY} ${edgeX(bottomY, -1)},${bottomY}`;
}

function trianglePoints(bottomY: number) {
  return `${APEX_X},${APEX_Y} ${edgeX(bottomY, 1)},${bottomY} ${edgeX(bottomY, -1)},${bottomY}`;
}

const LAYERS: MemoryLayer[] = [
  {
    id: 'claude',
    title: 'Claude.md',
    points: trianglePoints(205),
    icon: 'document',
    iconY: 88,
    titleY: 174,
    detailY: 214,
    fill: '#f4efff',
    stroke: '#c9b4ee',
    text: '#2d1165',
    detail: [
      'The repo entry point: the thesis, current status, research guardrails, and where the agent should look next.',
      'Keeps the agent from re-discovering old non-results like “oracle outputs work.”',
    ],
  },
  {
    id: 'experiment',
    title: 'Overarching Experiment',
    subtitle: 'Purpose.md + Solution_ideas.md',
    points: trapezoidPoints(225, 405),
    icon: 'flask',
    iconY: 246,
    titleY: 338,
    subtitleY: 374,
    detailY: 414,
    fill: '#eef8ff',
    stroke: '#7bcaff',
    text: '#0b3856',
    detail: [
      'OVERARCHING_EXPERIMENT_PURPOSE.md is the north star: can a neural model learn to use a calculator inside its own computation?',
      'SOLUTION_IDEAS.md is the idea bank for training signals, estimators, scaffolds, and next mechanisms.',
    ],
  },
  {
    id: 'facts',
    title: 'Fact Sheets',
    subtitle: 'One .md file for each phase',
    points: trapezoidPoints(425, 605),
    icon: 'fact',
    iconY: 476,
    titleY: 545,
    subtitleY: 583,
    detailY: 614,
    fill: '#ecfff7',
    stroke: '#5ee0b0',
    text: '#083f36',
    detail: [
      'factSheets/PHASE_* compress whole stretches of experiments into useful facts, metrics, failures, and interpretation.',
      'This is the “please remember this next time” layer: less noisy than raw work history, more grounded than a general overview.',
    ],
  },
  {
    id: 'phase-docs',
    title: 'Overarching Phase Documents',
    points: trapezoidPoints(625, 770),
    icon: 'folder',
    iconY: 648,
    titleY: 740,
    detailY: 779,
    fill: '#fff9e8',
    stroke: '#f5c84c',
    text: '#63300a',
    detail: [
      'Phase plans define a bounded research direction, such as retention after teaching or natural result-level interface discovery.',
      'They give future agents a smaller local map: what this phase is testing, what counts as progress, and what should be skipped.',
    ],
  },
  {
    id: 'tasks',
    title: 'AI Agent Project Tasks by Phase',
    subtitle: '+ Work History',
    points: trapezoidPoints(790, 965),
    icon: 'tasks',
    iconY: 842,
    titleY: 915,
    subtitleY: 950,
    detailY: 970,
    fill: '#fff8ef',
    stroke: '#f4b36b',
    text: '#5a1f0f',
    detail: [
      'aiAgentProjectTasks/ holds the specific next moves, grouped by phase, including completed task specs.',
      'aiAgentWorkHistory/ records what actually happened: commands run, experiments completed, result summaries, and the trail back to evidence.',
    ],
  },
];

function splitLines(text?: string) {
  return text ? text.split('|') : [];
}

export default function PyramidMemoryExplorer() {
  const [openLayer, setOpenLayer] = useState<string | null>(null);
  const titleId = useId();
  const selected = LAYERS.find((layer) => layer.id === openLayer);

  function toggleLayer(id: string) {
    setOpenLayer((current) => (current === id ? null : id));
  }

  return (
    <figure className="not-prose my-8">
      <style>{`
        .memory-layer polygon {
          filter: drop-shadow(9px 14px 13px rgba(15, 23, 42, 0.11));
          transition: transform 260ms ease, filter 260ms ease, opacity 260ms ease;
          transform-box: fill-box;
          transform-origin: center;
        }

        .memory-layer text,
        .memory-layer .memory-icon {
          pointer-events: none;
          transition: transform 260ms ease, opacity 260ms ease;
          transform-box: fill-box;
          transform-origin: center;
        }

        .memory-layer:hover polygon,
        .memory-layer:focus-visible polygon,
        .memory-layer.is-open polygon {
          filter: drop-shadow(12px 18px 17px rgba(15, 23, 42, 0.16));
          transform: translateY(-4px);
        }

        .memory-layer:hover text,
        .memory-layer:hover .memory-icon,
        .memory-layer:focus-visible text,
        .memory-layer:focus-visible .memory-icon,
        .memory-layer.is-open text,
        .memory-layer.is-open .memory-icon {
          transform: translateY(-4px);
        }

        .memory-drawer {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transform: translateY(-8px);
          transition: grid-template-rows 360ms ease, opacity 260ms ease, transform 360ms ease;
        }

        .memory-drawer.is-open {
          grid-template-rows: 1fr;
          opacity: 1;
          transform: translateY(0);
        }

        .memory-drawer-inner {
          overflow: hidden;
        }
      `}</style>

      <div className="overflow-hidden rounded border border-slate-200 bg-[#fffdfa] p-3 shadow-sm sm:p-4">
        <div className="relative mx-auto max-w-5xl">
          <svg
            aria-labelledby={titleId}
            className="block h-auto w-full"
            role="img"
            viewBox="-210 0 1420 985"
          >
            <title id={titleId}>Interactive pyramid showing the memory files used by the research agent</title>
            {LAYERS.map((layer) => {
              const isOpen = layer.id === openLayer;
              return (
                <g
                  key={layer.id}
                  aria-expanded={isOpen}
                  className={`memory-layer cursor-pointer outline-none ${isOpen ? 'is-open' : ''}`}
                  onClick={() => toggleLayer(layer.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleLayer(layer.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <polygon
                    fill={layer.fill}
                    points={layer.points}
                    stroke={layer.stroke}
                    strokeLinejoin="round"
                    strokeWidth={isOpen ? 3 : 2}
                  />
                  <Icon kind={layer.icon} stroke={layer.text} y={layer.iconY} />
                  <text
                    fill={layer.text}
                    fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize={layer.id === 'claude' ? 34 : layer.id === 'experiment' || layer.id === 'phase-docs' || layer.id === 'tasks' ? 31 : 34}
                    fontWeight="800"
                    textAnchor="middle"
                    x="500"
                    y={layer.titleY}
                  >
                    {layer.title}
                  </text>
                  {splitLines(layer.subtitle).map((line, index) => (
                    <text
                      key={line}
                      fill="#0f172a"
                      fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                      fontSize={layer.id === 'tasks' ? 23 : 21}
                      fontWeight="500"
                      textAnchor="middle"
                      x="500"
                      y={(layer.subtitleY ?? layer.titleY + 32) + index * 30}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>

          <div
            className={`memory-drawer ${selected ? 'is-open' : ''}`}
            aria-live="polite"
          >
            <div className="memory-drawer-inner">
              {selected && (
                <div
                  className="mx-auto mt-3 max-w-3xl rounded border bg-white/95 p-4 shadow-sm"
                  style={{ borderColor: selected.stroke }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border"
                      style={{ background: selected.fill, borderColor: selected.stroke, color: selected.text }}
                      aria-hidden="true"
                    >
                      <MiniIcon kind={selected.icon} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: selected.text }}>
                        {selected.id === 'experiment' ? 'Overarching Experiment' : selected.title}
                      </p>
                      <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
                        {selected.detail.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-500">
        Tap a layer to expand the memory behind that part of the pyramid.
      </figcaption>
    </figure>
  );
}

function Icon({ kind, stroke, y }: { kind: MemoryLayer['icon']; stroke: string; y: number }) {
  const common = {
    className: 'memory-icon',
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 5,
  };

  if (kind === 'document') {
    return (
      <g {...common}>
        <path d={`M486 ${y}h26l16 16v44h-42z`} />
        <path d={`M512 ${y}v16h16`} />
        <path d={`M496 ${y + 29}h22M496 ${y + 42}h22M496 ${y + 55}h14`} />
      </g>
    );
  }

  if (kind === 'flask') {
    return (
      <g {...common}>
        <path d={`M490 ${y}h20M497 ${y}v22l-21 36h48l-21-36V${y}`} />
        <path d={`M487 ${y + 43}c8 5 20-5 29 1`} />
      </g>
    );
  }

  if (kind === 'fact') {
    return (
      <g {...common}>
        <rect height="34" rx="6" width="34" x="483" y={y} />
        <path d={`M492 ${y + 17}l7 8 12-18`} />
      </g>
    );
  }

  if (kind === 'folder') {
    return (
      <g {...common}>
        <path d={`M474 ${y + 15}h25l7-10h22v10h26v34h-80z`} />
        <path d={`M474 ${y + 24}h80`} />
      </g>
    );
  }

  return (
    <g {...common}>
      <path d={`M478 ${y}h11M500 ${y}h11M522 ${y}h11M478 ${y + 18}h11M500 ${y + 18}h11M522 ${y + 18}h11M478 ${y + 36}h11M500 ${y + 36}h11M522 ${y + 36}h11`} />
    </g>
  );
}

function MiniIcon({ kind }: { kind: MemoryLayer['icon'] }) {
  const labels = {
    document: '▤',
    flask: '⚗',
    fact: '✓',
    folder: '▰',
    tasks: '☷',
  };

  return <span className="text-lg leading-none">{labels[kind]}</span>;
}
