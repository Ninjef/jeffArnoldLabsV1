import type { CSSProperties, ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

const STARTS: Array<{ sx: string; sy: string; delayMs: number }> = [
  { sx: '-34px', sy: '-20px', delayMs: 0 },
  { sx: '-42px', sy: '0px',   delayMs: 90 },
  { sx: '-34px', sy: '20px',  delayMs: 180 },
];

export default function TitleThoughtGather({
  triggerAt,
  color = '#6366f1',
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
            left: 'calc(100% + 1.4em)',
            top: '50%',
            width: 0,
            height: 0,
          }}
        >
          {STARTS.map((s, i) => {
            const style: CSSProperties = {
              ['--sx' as string]: s.sx,
              ['--sy' as string]: s.sy,
              width: '6px',
              height: '6px',
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}80`,
              animationDelay: `${s.delayMs}ms`,
              left: '50%',
              top: '50%',
              marginLeft: `${i * 5 - 5}px`,
            };
            return (
              <span
                key={i}
                className="absolute block rounded-full animate-title-thought-gather"
                style={style}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}
