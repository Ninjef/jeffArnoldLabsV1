import type { ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

export default function TitleDreamRipple({
  triggerAt,
  color = '#a78bfa',
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
        <svg
          key={fireCount}
          aria-hidden="true"
          viewBox="0 0 200 14"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-0 h-[0.45em] w-full"
          style={{
            bottom: '-0.15em',
            filter: `drop-shadow(0 0 3px ${color}80)`,
          }}
        >
          <path
            pathLength={1}
            d="M 0 7 Q 12.5 0, 25 7 T 50 7 T 75 7 T 100 7 T 125 7 T 150 7 T 175 7 T 200 7"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            className="animate-title-dream-ripple"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
            }}
          />
        </svg>
      )}
    </span>
  );
}
