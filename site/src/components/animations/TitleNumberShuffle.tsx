import { useEffect, useState, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

const DIGIT_COUNT = 3;
const SHUFFLE_MS = 520;
const FRAME_MS = 55;
const FINAL = '∑';

function randomDigits(): string {
  let s = '';
  for (let i = 0; i < DIGIT_COUNT; i++) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}

export default function TitleNumberShuffle({
  triggerAt,
  color = '#64748b',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });
  const [display, setDisplay] = useState<string>('');

  useEffect(() => {
    if (fireCount === 0) return;
    setDisplay(randomDigits());
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= SHUFFLE_MS) {
        setDisplay(FINAL);
        window.clearInterval(interval);
      } else {
        setDisplay(randomDigits());
      }
    }, FRAME_MS);
    return () => window.clearInterval(interval);
  }, [fireCount]);

  return (
    <span ref={ref} className="relative inline-block">
      {children}
      {fireCount > 0 && (
        <span
          key={fireCount}
          aria-hidden="true"
          className="pointer-events-none absolute font-mono animate-title-number-fade"
          style={{
            left: 'calc(100% + 0.5em)',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.55em',
            letterSpacing: '0.05em',
            color,
            padding: '0.15em 0.4em',
            borderRadius: '0.25em',
            border: `1px solid ${color}`,
            background: 'rgba(148, 163, 184, 0.08)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          [{display}]
        </span>
      )}
    </span>
  );
}
