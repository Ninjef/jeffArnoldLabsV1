import type { ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  emoji?: string;
  impact?: string;
  repeat?: boolean;
  children: ReactNode;
};

export default function TitleQuestionClash({
  triggerAt,
  emoji = '❓',
  impact = '💥',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

  return (
    <span ref={ref} className="relative inline-block">
      <span
        key={`shake-${fireCount}`}
        className={fireCount > 0 ? 'inline-block animate-title-clash-shake' : 'inline-block'}
      >
        {children}
      </span>
      {fireCount > 0 && (
        <>
          <span
            key={`fly-${fireCount}`}
            aria-hidden="true"
            className="pointer-events-none absolute select-none animate-title-clash-fly"
            style={{
              left: '100%',
              top: '50%',
              fontSize: '0.75em',
              lineHeight: 1,
            }}
          >
            {emoji}
          </span>
          <span
            key={`impact-${fireCount}`}
            aria-hidden="true"
            className="pointer-events-none absolute select-none animate-title-clash-impact"
            style={{
              left: '50%',
              top: '45%',
              fontSize: '0.6em',
              lineHeight: 1,
            }}
          >
            {impact}
          </span>
        </>
      )}
    </span>
  );
}
