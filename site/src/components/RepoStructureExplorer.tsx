import { useMemo, useState } from 'react';

type TreeNode = {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children: TreeNode[];
};

const REPO_PATHS = [
  'aiAgentProjectTasks',
  'aiAgentProjectTasks/2026-05-12-phase-7-overarching_plan-Natural-result-level-interface-discovery.md',
  'aiAgentProjectTasks/completed',
  'aiAgentProjectTasks/completed/phase1',
  'aiAgentProjectTasks/completed/phase1/2026-04-27-1134-Set-Up-and-training-data.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-27-1828-Step-3.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-27-1828-Steps-4-5.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-27-1828-Steps-6-7.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-27-1828-Steps-next.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-29-1059-Upstream-calculator-learning-experiments.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-29-1219-Upstream-calculator-learning-experiments.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-29-1245-Dumber-model-calculator-reliance.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-29-1320-Next-calculator-protocol-experiments.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-29-2120-thorough-evaluation-of-implementation.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-1158-Next-research-charter.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-1202-Track-1-interface-read-position.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-1202-Track-2-training-signal-protocol-supervision.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-1202-Track-3-causal-diagnostics-codebooks.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-1202-Track-4-optimization-estimators.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-Calculator-required-bottleneck-experiment.md',
  'aiAgentProjectTasks/completed/phase1/2026-04-30-Strict-calculator-required-bottleneck.md',
  'aiAgentProjectTasks/completed/phase2',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-fifth-task-Post-supervision-retention-stabilization.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-first-task-Adaptive-calculator-interface-bottleneck.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-fourth-task-Warm-started-interface-retention.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-second-task-Stabilize-adaptive-interface-objective.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-sixth-task-Lower-LR-retention-replication-and-protocol-decoding.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-01-phase-2-third-task-Canonical-diagnostics-and-staged-interface-stabilizer.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-03-phase-2-eighth-task-Low-variance-action-loss-continuations-from-selected-retention-checkpoints.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-03-phase-2-seventh-task-Action-loss-aligned-self-training-under-retention-window.md',
  'aiAgentProjectTasks/completed/phase2/2026-05-05-phase-2-ninth-task-Full-action-enumeration-teacher-before-upstream-unfreezing.md',
  'aiAgentProjectTasks/completed/phase3',
  'aiAgentProjectTasks/completed/phase3/2026-05-06-phase-3-first-task-Joint-pair-action-interface.md',
  'aiAgentProjectTasks/completed/phase3/2026-05-06-phase-3-fourth-task-Matched-retention-ladder-for-joint-identity-curriculum.md',
  'aiAgentProjectTasks/completed/phase3/2026-05-06-phase-3-overarching-task-Joint-interface-and-identifiability.md',
  'aiAgentProjectTasks/completed/phase3/2026-05-06-phase-3-second-task-Identifiability-curriculum-after-joint-smoke-collapse.md',
  'aiAgentProjectTasks/completed/phase3/2026-05-06-phase-3-third-task-Dense-replication-and-retention-stabilization-for-joint-identity-curriculum.md',
  'aiAgentProjectTasks/completed/phase4',
  'aiAgentProjectTasks/completed/phase4/2026-05-06-phase-4-first-task-Identifiable-sum-plus-left-operand-protocol.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-06-phase-4-identifiability-first-protocol-teaching.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-06-phase-4-second-task-Operand-aware-calculator-signal-for-identifiable-target.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-06-phase-4-third-task-ASAP-learned-interface-warm-start-and-teacher-zero-retention.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-07-phase-4-fifth-task-Minimum-supervision-and-partial-protocol-completion-boundary.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-07-phase-4-fourth-task-Operand-span-protocol-retention-replication-and-supervision-boundary.md',
  'aiAgentProjectTasks/completed/phase4/2026-05-08-phase-4-sixth-task-Boundary-closure-before-phase-wrap.md',
  'aiAgentProjectTasks/completed/phase5',
  'aiAgentProjectTasks/completed/phase5/2026-05-08-phase-5-first-task-Upstream-unfreeze-stability-smoke.md',
  'aiAgentProjectTasks/completed/phase5/2026-05-08-phase-5-second-task-Upstream-assisted-partial-handoff-completion.md',
  'aiAgentProjectTasks/completed/phase5/2026-05-08-phase-5-third-task-Cross-seed-upstream-assisted-completion-replication.md',
  'aiAgentProjectTasks/completed/phase5/2026-05-09-phase-5-closure-Upstream-discovery-after-protocol-teaching.md',
  'aiAgentProjectTasks/completed/phase5/2026-05-09-phase-5-fourth-task-Controlled-no-handoff-upstream-discovery-smoke.md',
  'aiAgentProjectTasks/completed/phase6',
  'aiAgentProjectTasks/completed/phase6/2026-05-10-phase-6-first-task-Identifiable-full-enum-local-target-sharpness-and-smoke.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-10-phase-6-overarching_plan-Identifiable-local-interface-discovery.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-10-phase-6-second-task-Matched-local-target-teaching-and-retention-gate.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-11-phase-6-fifth-task-Exact-expected-answer-loss-interface-discovery.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-11-phase-6-fourth-task-Strict-local-target-decay-and-minimum-teaching-boundary.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-11-phase-6-seventh-task-Relaxed-bridge-replication-stochastic-and-upstream-open.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-11-phase-6-sixth-task-Gumbel-Concrete-hard-forward-interface-bridge.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-11-phase-6-third-task-Strict-random-upstream-local-target-discovery.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-12-phase-6-eighth-task-Natural-sum-only-relaxed-bridge.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-12-phase-6-eleventh-task-Phase-6-closure-landscape-diagnostic-and-next-phase-decision.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-12-phase-6-ninth-task-Sum-only-semantic-decoder-gate-and-natural-bridge-readiness.md',
  'aiAgentProjectTasks/completed/phase6/2026-05-12-phase-6-tenth-task-Sum-only-answer-decoder-interaction-and-natural-bridge.md',
  'aiAgentProjectTasks/completed/phase7',
  'aiAgentProjectTasks/completed/phase7/2026-05-12-phase-7-first-task-Natural-joint-pair-result-group-bridge-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-12-phase-7-second-task-Natural-joint-pair-stage1-result-discovery-and-retention-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-13-phase-7-fifth-task-Frozen-feature-result-separability-and-minimal-upstream-open-boundary-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-13-phase-7-fourth-task-Natural-result-space-boundary-target-learning-signal.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-13-phase-7-seventh-task-Exact-grid-retained-positive-seed-replication.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-13-phase-7-sixth-task-Full-grid-upstream-open-result-boundary-retention-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-13-phase-7-third-task-Natural-result-space-interface-diagnostic.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-14-phase-7-eighth-task-Multi-sample-result-space-policy-gradient-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-14-phase-7-ninth-task-Exact-result-marginal-answer-loss-gradient-gate.md',
  'aiAgentProjectTasks/completed/phase7/2026-05-14-phase-7-tenth-task-Gradient-friendly-result-decoder-alignment-gate.md',
  'aiAgentWorkHistory',
  'aiAgentWorkHistory/phase1',
  'aiAgentWorkHistory/phase1/2026-04-27-1134-Set-Up-and-training-data.md',
  'aiAgentWorkHistory/phase1/2026-04-27-1258-Training-ready-data-batches.md',
  'aiAgentWorkHistory/phase1/2026-04-27-1828-Step-3-tiny-transformer.md',
  'aiAgentWorkHistory/phase1/2026-04-29-0000-Steps-4-5-model-a-baseline-runs.md',
  'aiAgentWorkHistory/phase1/2026-04-29-dumber-model-calculator-reliance.md',
  'aiAgentWorkHistory/phase1/2026-04-29-reinforce-calculator-actions.md',
  'aiAgentWorkHistory/phase1/2026-04-29-step-8-latent-protocol-diagnostics.md',
  'aiAgentWorkHistory/phase1/2026-04-29-steps-6-7-latent-calculator-hook.md',
  'aiAgentWorkHistory/phase1/2026-04-29-thorough-evaluation-of-implementation.md',
  'aiAgentWorkHistory/phase1/2026-04-29-upstream-calculator-learning-experiments.md',
  'aiAgentWorkHistory/phase1/2026-04-30-next-calculator-protocol-experiments.md',
  'aiAgentWorkHistory/phase1/2026-04-30-non-bottleneck-merge-handoff.md',
  'aiAgentWorkHistory/phase1/2026-04-30-non-bottleneck-protocol-experiments.md',
  'aiAgentWorkHistory/phase1/2026-04-30-strict-calculator-required-bottleneck.md',
  'aiAgentWorkHistory/phase1/2026-04-30-track-1-interface-read-position.md',
  'aiAgentWorkHistory/phase1/2026-04-30-track-2-training-signal-protocol-supervision.md',
  'aiAgentWorkHistory/phase1/2026-04-30-track-3-causal-diagnostics-codebooks.md',
  'aiAgentWorkHistory/phase1/2026-04-30-track-4-optimization-estimators.md',
  'aiAgentWorkHistory/phase2',
  'aiAgentWorkHistory/phase2/2026-05-01-adaptive-calculator-interface-bottleneck.md',
  'aiAgentWorkHistory/phase2/2026-05-01-canonical-diagnostics-staged-interface-stabilizer.md',
  'aiAgentWorkHistory/phase2/2026-05-01-lower-lr-retention-replication-private-protocol.md',
  'aiAgentWorkHistory/phase2/2026-05-01-post-supervision-retention-stabilization.md',
  'aiAgentWorkHistory/phase2/2026-05-01-stabilize-adaptive-interface-objective.md',
  'aiAgentWorkHistory/phase2/2026-05-01-warm-started-interface-retention.md',
  'aiAgentWorkHistory/phase2/2026-05-03-action-loss-aligned-self-training-retention-window.md',
  'aiAgentWorkHistory/phase2/2026-05-05-full-enum-action-loss-teacher.md',
  'aiAgentWorkHistory/phase2/2026-05-05-low-variance-action-loss-continuations.md',
  'aiAgentWorkHistory/phase3',
  'aiAgentWorkHistory/phase3/2026-05-06-dense-replication-retention-stabilization.md',
  'aiAgentWorkHistory/phase3/2026-05-06-identifiability-curriculum-after-joint-smoke-collapse.md',
  'aiAgentWorkHistory/phase3/2026-05-06-joint-pair-action-interface.md',
  'aiAgentWorkHistory/phase3/2026-05-06-matched-retention-ladder.md',
  'aiAgentWorkHistory/phase3/2026-05-06-next-retention-ladder-task-planning.md',
  'aiAgentWorkHistory/phase4',
  'aiAgentWorkHistory/phase4/2026-05-06-learned-interface-warm-start-teacher-zero-retention.md',
  'aiAgentWorkHistory/phase4/2026-05-06-operand-aware-calculator-output-signal.md',
  'aiAgentWorkHistory/phase4/2026-05-06-sum-left-operand-answer-format.md',
  'aiAgentWorkHistory/phase4/2026-05-07-minimum-supervision-partial-completion-boundary.md',
  'aiAgentWorkHistory/phase4/2026-05-07-operand-span-retention-replication.md',
  'aiAgentWorkHistory/phase4/2026-05-08-boundary-closure-before-phase-wrap.md',
  'aiAgentWorkHistory/phase5',
  'aiAgentWorkHistory/phase5/2026-05-08-cross-seed-upstream-assisted-completion-replication.md',
  'aiAgentWorkHistory/phase5/2026-05-08-upstream-assisted-partial-handoff-completion.md',
  'aiAgentWorkHistory/phase5/2026-05-08-upstream-unfreeze-stability-smoke.md',
  'aiAgentWorkHistory/phase5/2026-05-09-no-handoff-upstream-discovery-smoke.md',
  'aiAgentWorkHistory/phase5/2026-05-09-phase-5-closure.md',
  'aiAgentWorkHistory/phase6',
  'aiAgentWorkHistory/phase6/2026-05-10-identifiable-full-enum-local-target-sharpness-and-smoke.md',
  'aiAgentWorkHistory/phase6/2026-05-10-matched-local-target-teaching-and-retention-gate.md',
  'aiAgentWorkHistory/phase6/2026-05-11-exact-expected-answer-loss-interface-discovery.md',
  'aiAgentWorkHistory/phase6/2026-05-11-gumbel-concrete-interface-bridge.md',
  'aiAgentWorkHistory/phase6/2026-05-11-strict-local-target-decay-boundary.md',
  'aiAgentWorkHistory/phase6/2026-05-11-strict-random-upstream-local-target-discovery.md',
  'aiAgentWorkHistory/phase6/2026-05-12-natural-sum-only-relaxed-bridge.md',
  'aiAgentWorkHistory/phase6/2026-05-12-phase-6-closure-landscape-diagnostic.md',
  'aiAgentWorkHistory/phase6/2026-05-12-relaxed-bridge-replication-stochastic-upstream.md',
  'aiAgentWorkHistory/phase6/2026-05-12-sum-only-interaction-decoder-natural-bridge.md',
  'aiAgentWorkHistory/phase6/2026-05-12-sum-only-semantic-decoder-gate.md',
  'aiAgentWorkHistory/phase7',
  'aiAgentWorkHistory/phase7/2026-05-12-joint-pair-result-group-bridge-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-12-joint-pair-stage1-result-discovery.md',
  'aiAgentWorkHistory/phase7/2026-05-13-exact-grid-retained-positive-seed-replication.md',
  'aiAgentWorkHistory/phase7/2026-05-13-full-grid-upstream-open-result-boundary-retention-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-13-next-learning-signal-task-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-13-next-task-exact-grid-seed-replication-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-13-next-task-full-grid-upstream-open-boundary-retention-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-13-result-feature-separability-and-upstream-open-boundary-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-13-result-feature-separability-task-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-13-result-space-boundary-target-learning-signal.md',
  'aiAgentWorkHistory/phase7/2026-05-13-result-space-interface-diagnostic.md',
  'aiAgentWorkHistory/phase7/2026-05-14-exact-result-marginal-answer-loss-gradient-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-14-gradient-friendly-result-decoder-alignment-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-14-multisample-result-space-policy-gradient-gate.md',
  'aiAgentWorkHistory/phase7/2026-05-14-next-big-bet-policy-gradient-task-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-14-next-task-exact-result-marginal-planning.md',
  'aiAgentWorkHistory/phase7/2026-05-14-next-task-gradient-friendly-decoder-planning.md',
  'factSheets',
  'factSheets/PHASE_1_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_2_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_3_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_4_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_5_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_6_EXPERIMENT_FACT_SHEET.md',
  'factSheets/PHASE_7_EXPERIMENT_FACT_SHEET.md',
];

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: 'calculatorInAModel', path: '', type: 'folder', children: [] };
  const nodes = new Map<string, TreeNode>([['', root]]);

  paths.forEach((path) => {
    const parts = path.split('/');
    let parent = root;

    parts.forEach((part, index) => {
      const nodePath = parts.slice(0, index + 1).join('/');
      const isFile = index === parts.length - 1 && /\.[^.]+$/.test(part);
      let node = nodes.get(nodePath);

      if (!node) {
        node = { name: part, path: nodePath, type: isFile ? 'file' : 'folder', children: [] };
        nodes.set(nodePath, node);
        parent.children.push(node);
      }

      parent = node;
    });
  });

  return sortTree(root.children);
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    })
    .map((node) => ({ ...node, children: sortTree(node.children) }));
}

function countFiles(node: TreeNode): number {
  if (node.type === 'file') return 1;
  return node.children.reduce((total, child) => total + countFiles(child), 0);
}

function countFolders(node: TreeNode): number {
  if (node.type === 'file') return 0;
  return node.children.reduce((total, child) => total + (child.type === 'folder' ? 1 : 0) + countFolders(child), 0);
}

export default function RepoStructureExplorer() {
  const tree = useMemo(() => buildTree(REPO_PATHS), []);
  const [openPaths, setOpenPaths] = useState<Set<string>>(
    () => new Set(['aiAgentProjectTasks', 'aiAgentProjectTasks/completed', 'aiAgentWorkHistory', 'factSheets']),
  );

  const totalFiles = tree.reduce((total, node) => total + countFiles(node), 0);
  const totalFolders = tree.reduce((total, node) => total + 1 + countFolders(node), 0);

  function toggle(path: string) {
    setOpenPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  return (
    <figure className="not-prose my-8">
      <style>{`
        .repo-tree-branch {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transform: translateY(-4px);
          transition: grid-template-rows 280ms ease, opacity 200ms ease, transform 280ms ease;
        }

        .repo-tree-branch.is-open {
          grid-template-rows: 1fr;
          opacity: 1;
          transform: translateY(0);
        }

        .repo-tree-branch-inner {
          overflow: hidden;
        }
      `}</style>

      <div className="overflow-hidden rounded border border-slate-200 bg-[#f8fafc] shadow-sm">
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">calculatorInAModel memory folders</p>
              <p className="mt-1 font-mono text-xs text-slate-500">aiAgentProjectTasks / aiAgentWorkHistory / factSheets</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">{totalFolders} folders</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">{totalFiles} files</span>
            </div>
          </div>
        </div>

        <div className="max-h-[44rem] overflow-auto p-3 sm:p-4">
          <div className="min-w-[36rem] rounded border border-slate-200 bg-white p-2 font-mono text-[0.78rem] leading-5 text-slate-700">
            {tree.map((node) => (
              <TreeRow key={node.path} node={node} level={0} openPaths={openPaths} onToggle={toggle} />
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-2 text-center text-xs text-slate-500">
        Click folders to expand the current repo tree snapshot used by the experiment.
      </figcaption>
    </figure>
  );
}

function TreeRow({
  node,
  level,
  openPaths,
  onToggle,
}: {
  node: TreeNode;
  level: number;
  openPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isFolder = node.type === 'folder';
  const isOpen = isFolder && openPaths.has(node.path);
  const fileCount = isFolder ? countFiles(node) : 0;
  const folderCount = isFolder ? node.children.filter((child) => child.type === 'folder').length : 0;

  return (
    <div>
      <button
        type="button"
        disabled={!isFolder}
        className={`group flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition ${
          isFolder ? 'hover:bg-sky-50 focus-visible:bg-sky-50' : 'cursor-default'
        }`}
        onClick={() => {
          if (isFolder) onToggle(node.path);
        }}
        aria-expanded={isFolder ? isOpen : undefined}
        style={{ paddingLeft: `${level * 1.35 + 0.5}rem` }}
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center transition ${
            isOpen ? 'rotate-90 text-sky-600' : isFolder ? 'text-slate-400' : 'text-transparent'
          }`}
          aria-hidden="true"
        >
          <ChevronIcon />
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          {isFolder ? <FolderIcon open={isOpen} /> : <FileIcon />}
        </span>
        <span className={`min-w-0 break-words ${isFolder ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{node.name}</span>
        {isFolder && (
          <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-500">
            {folderCount > 0 ? `${folderCount} folders / ` : ''}
            {fileCount} files
          </span>
        )}
      </button>
      {isFolder && (
        <div className={`repo-tree-branch ${isOpen ? 'is-open' : ''}`}>
          <div className="repo-tree-branch-inner">
            <div className="border-l border-slate-200" style={{ marginLeft: `${level * 1.35 + 1.05}rem` }}>
              {node.children.map((child) => (
                <TreeRow key={child.path} node={child} level={level + 1} openPaths={openPaths} onToggle={onToggle} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg fill="none" height="18" viewBox="0 0 20 18" width="20">
      <path
        d="M2.5 4.5h5l1.6 2h8.4v8.25a1.25 1.25 0 0 1-1.25 1.25h-12.5a1.25 1.25 0 0 1-1.25-1.25z"
        fill={open ? '#e0f2fe' : '#fef3c7'}
        stroke={open ? '#0284c7' : '#d97706'}
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M2.5 7h15" stroke={open ? '#0284c7' : '#d97706'} strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path d="M4.5 2.5h5.2l3.8 3.8v9.2h-9z" fill="#f8fafc" stroke="#64748b" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M9.7 2.7v3.8h3.7M6.6 9h4.8M6.6 12h4.8" stroke="#64748b" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}
