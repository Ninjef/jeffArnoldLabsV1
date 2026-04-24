import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

type Streak = {
  path: string;
  endX: number;
  endY: number;
  delayMs: number;
  width: number;
};

function buildStreaks(seed: number): Streak[] {
  const cx = 30;
  const cy = 30;
  const targets = [
    { x: 58, y: 14, jitter: [0.3, -0.4, 0.6, -0.2] },
    { x: 58, y: 46, jitter: [-0.3, 0.4, 0.2, -0.6] },
    { x: 48, y: 4,  jitter: [0.4, 0.3, -0.5, 0.2] },
    { x: 48, y: 56, jitter: [-0.4, -0.3, 0.5, -0.2] },
  ];
  return targets.map((t, i) => {
    const dx = t.x - cx;
    const dy = t.y - cy;
    const steps = 4;
    const points: Array<[number, number]> = [[cx, cy]];
    for (let s = 1; s < steps; s++) {
      const along = s / steps;
      const perpX = -dy / Math.hypot(dx, dy);
      const perpY = dx / Math.hypot(dx, dy);
      const jitter = t.jitter[s - 1] * 6;
      const baseX = cx + dx * along + perpX * jitter;
      const baseY = cy + dy * along + perpY * jitter;
      points.push([baseX, baseY]);
    }
    points.push([t.x, t.y]);
    const d = points
      .map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ');
    return {
      path: d,
      endX: t.x,
      endY: t.y,
      delayMs: (i * 55 + (seed % 3) * 30) % 200,
      width: 1.8 + (i % 2) * 0.4,
    };
  });
}

export default function TitleSparkFizzle({
  triggerAt,
  color = '#60a5fa',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

  const streaks = useMemo(() => buildStreaks(fireCount), [fireCount]);

  const glow = `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 8px ${color})`;

  return (
    <span ref={ref} className="relative inline-block">
      {children}
      {fireCount > 0 && (
        <span
          key={fireCount}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: 'calc(100% + 0.25em)',
            top: '50%',
            width: '1.8em',
            height: '1.8em',
            transform: 'translateY(-50%)',
          }}
        >
          <svg
            viewBox="0 0 60 60"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {streaks.map((s, i) => {
              const strokeStyle: CSSProperties = {
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animationDelay: `${s.delayMs}ms`,
                filter: glow,
              };
              const popStyle: CSSProperties = {
                animationDelay: `${s.delayMs}ms`,
                filter: glow,
                transformOrigin: `${s.endX}px ${s.endY}px`,
              };
              return (
                <g key={i}>
                  <path
                    pathLength={1}
                    d={s.path}
                    fill="none"
                    stroke={color}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-title-crackle-streak"
                    style={strokeStyle}
                  />
                  <circle
                    cx={s.endX}
                    cy={s.endY}
                    r={2}
                    fill={color}
                    className="animate-title-crackle-pop"
                    style={popStyle}
                  />
                </g>
              );
            })}
          </svg>
        </span>
      )}
    </span>
  );
}
