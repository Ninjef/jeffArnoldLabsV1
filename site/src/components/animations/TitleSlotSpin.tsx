import { useEffect, useState, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

const SYMBOLS = ['7', '?', '+', '*', 'Σ'];
const FINAL = '7|7|7';
const SPIN_MS = 620;
const FRAME_MS = 60;

function randomReels(): string {
  return Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]).join('|');
}

export default function TitleSlotSpin({
  triggerAt,
  color = '#dc2626',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (fireCount === 0) return;
    setDisplay(randomReels());
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= SPIN_MS) {
        setDisplay(FINAL);
        window.clearInterval(interval);
      } else {
        setDisplay(randomReels());
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
          className="pointer-events-none absolute font-mono animate-title-slot-spin"
          style={{
            left: 'calc(100% + 0.45em)',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.48em',
            color,
            padding: '0.12em 0.35em',
            border: `1px solid ${color}`,
            borderRadius: '0.25em',
            background: 'rgba(254, 242, 242, 0.9)',
            boxShadow: `0 0 10px ${color}25`,
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
