import { useMemo, useState } from 'react';

type Problem = {
  label: string;
  left: number;
  right: number;
  wrongQueries: Array<[number, number]>;
};

const PROBLEMS: Problem[] = [
  { label: '8 + 1', left: 8, right: 1, wrongQueries: [[4, 22], [8, 0], [7, 2], [6, 1]] },
  { label: '12 + 7', left: 12, right: 7, wrongQueries: [[10, 7], [12, 5], [9, 9], [11, 8]] },
  { label: '24 + 6', left: 24, right: 6, wrongQueries: [[20, 8], [24, 4], [14, 16], [22, 6]] },
];

const MAX_STEPS = 7;

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export default function CalculatorModelTrainer() {
  const [problemIndex, setProblemIndex] = useState(0);
  const [steps, setSteps] = useState(0);
  const problem = PROBLEMS[problemIndex];
  const target = problem.left + problem.right;

  const training = clamp(steps / MAX_STEPS);
  const protocolStrength = clamp(0.12 + training * 0.88);
  const answerConfidence = clamp(0.18 + training * 0.8);
  const loss = clamp(0.92 - training * 0.82);
  const hasLearnedProtocol = steps >= 5;

  const query = useMemo<[number, number]>(() => {
    if (hasLearnedProtocol) return [problem.left, problem.right];
    return problem.wrongQueries[Math.min(steps, problem.wrongQueries.length - 1)];
  }, [hasLearnedProtocol, problem, steps]);

  const calculatorOutput = query[0] + query[1];
  const answer = hasLearnedProtocol ? calculatorOutput : Math.max(0, Math.round(calculatorOutput + (target - calculatorOutput) * training));
  const isRightForRightReason = hasLearnedProtocol && answer === target && calculatorOutput === target;
  const answerBody =
    isRightForRightReason
      ? 'Answer and calculator route are aligned.'
      : answer === target
        ? 'The number is right, but the calculator route still needs work.'
        : `Target is ${target}; update the route and try again.`;

  function trainStep() {
    setSteps((current) => Math.min(current + 1, MAX_STEPS));
  }

  function reset() {
    setSteps(0);
  }

  function chooseProblem(index: number) {
    setProblemIndex(index);
    setSteps(0);
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Toy calculator-in-the-middle model</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Train the routing path until the model asks the calculator the right question.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Choose a training example">
            {PROBLEMS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => chooseProblem(index)}
                className={`rounded border px-2.5 py-1.5 text-xs font-medium transition ${
                  index === problemIndex
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
          <Stage
            eyebrow="Prompt"
            title={`${problem.label} = ?`}
            body="The text enters the network as tokens."
            tone="slate"
          />
          <Connector />
          <Stage
            eyebrow="Internal route"
            title={`${query[0]} + ${query[1]}`}
            body={hasLearnedProtocol ? 'The learned path now matches the prompt.' : 'The route is still a noisy guess.'}
            tone={hasLearnedProtocol ? 'emerald' : 'amber'}
          />
          <Connector />
          <Stage
            eyebrow="Calculator"
            title={`${calculatorOutput}`}
            body="The calculator is exact, but only for the query it receives."
            tone="sky"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <Stage
            eyebrow="Answer decoder"
            title={`${answer}`}
            body={answerBody}
            tone={isRightForRightReason ? 'emerald' : 'rose'}
          />
          <Connector />
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3">
              <Meter label="Protocol strength" value={protocolStrength} color="bg-emerald-500" />
              <Meter label="Answer confidence" value={answerConfidence} color="bg-sky-500" />
              <Meter label="Loss" value={loss} color="bg-rose-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded border border-dashed border-slate-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-700" aria-live="polite">
            <span className="font-semibold text-slate-900">Step {steps}</span>
            <span className="mx-2 text-slate-300">/</span>
            {hasLearnedProtocol
              ? 'The network has learned to feed the calculator the right operands.'
              : 'Backprop is nudging the internal query toward the original operands.'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={trainStep}
              disabled={steps >= MAX_STEPS}
              className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Train step
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center text-slate-300 md:px-1" aria-hidden="true">
      <span className="hidden md:block text-xl">→</span>
      <span className="md:hidden text-lg">↓</span>
    </div>
  );
}

function Stage({
  eyebrow,
  title,
  body,
  tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone: 'slate' | 'amber' | 'emerald' | 'sky' | 'rose';
}) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    sky: 'border-sky-200 bg-sky-50 text-sky-950',
    rose: 'border-rose-200 bg-rose-50 text-rose-950',
  };

  return (
    <div className={`min-h-[8rem] rounded border p-4 ${tones[tone]}`}>
      <p className="text-[0.68rem] font-bold uppercase opacity-65">{eyebrow}</p>
      <p className="mt-2 font-mono text-2xl font-semibold leading-none">{title}</p>
      <p className="mt-3 text-xs leading-5 opacity-75">{body}</p>
    </div>
  );
}

function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-medium text-slate-700">
        <span>{label}</span>
        <span className="font-mono text-slate-500">{percent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: percent(value) }}
        />
      </div>
    </div>
  );
}
