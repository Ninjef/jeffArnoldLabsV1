import type { CSSProperties, ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  emoji?: string;
  repeat?: boolean;
  children: ReactNode;
};

const SMOKE: Array<{ left: string; top: string; size: string; delayMs: number }> = [
  { left: '0.1em', top: '1.2em', size: '0.24em', delayMs: 80 },
  { left: '-0.15em', top: '1.38em', size: '0.18em', delayMs: 150 },
  { left: '0.38em', top: '1.42em', size: '0.16em', delayMs: 220 },
];

export default function TitleRocketLaunch({
  triggerAt,
  emoji = '🚀',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

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
            width: '1.4em',
            height: '1.7em',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="absolute select-none animate-title-rocket-launch"
            style={{ left: '0.15em', top: '0.45em', fontSize: '0.8em', lineHeight: 1 }}
          >
            {emoji}
          </span>
          {SMOKE.map((s, i) => {
            const style: CSSProperties = {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delayMs}ms`,
            };
            return (
              <span
                key={i}
                className="absolute block rounded-full bg-slate-300 animate-title-rocket-smoke"
                style={style}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}
