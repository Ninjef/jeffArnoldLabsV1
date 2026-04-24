import type { ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  emoji?: string;
  repeat?: boolean;
  children: ReactNode;
};

export default function TitleBackPeek({
  triggerAt,
  emoji = '👀',
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
          className="pointer-events-none absolute select-none animate-title-back-peek"
          style={{
            left: '100%',
            top: '50%',
            fontSize: '0.7em',
            lineHeight: 1,
            transformOrigin: '50% 50%',
          }}
        >
          {emoji}
        </span>
      )}
    </span>
  );
}
