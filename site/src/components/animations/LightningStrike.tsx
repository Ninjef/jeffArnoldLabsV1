import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  triggerAt?: number;
  color?: string;
  repeat?: boolean;
  children: ReactNode;
};

export default function LightningStrike({
  triggerAt,
  color = '#7dd3fc',
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });
  const [strikeY, setStrikeY] = useState<number | null>(null);

  useEffect(() => {
    if (fireCount === 0) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setStrikeY(rect.top + window.scrollY + rect.height / 2);
  }, [fireCount, ref]);

  const showOverlay = fireCount > 0 && strikeY !== null;

  return (
    <span ref={ref} className="relative inline-block">
      {showOverlay && <LightningOverlay color={color} strikeY={strikeY} />}
      {children}
    </span>
  );
}

const BAND_HEIGHT = 400;

function LightningOverlay({ color, strikeY }: { color: string; strikeY: number }) {
  if (typeof document === 'undefined') return null;

  const boltStyle: CSSProperties = {
    strokeDasharray: 1,
    strokeDashoffset: 1,
    filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}) drop-shadow(0 0 28px ${color})`,
  };

  const bandStyle: CSSProperties = {
    top: `${strikeY - BAND_HEIGHT / 2}px`,
    height: `${BAND_HEIGHT}px`,
    width: '100vw',
    left: 0,
    ['--bolt-color' as string]: color,
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 bg-white animate-lightning-flash"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-50"
        style={bandStyle}
      >
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            pathLength={1}
            d="M -20 200 L 130 140 L 200 240 L 320 160 L 400 270 L 520 140 L 610 250 L 730 130 L 810 260 L 920 180 L 1020 210"
            fill="none"
            stroke="var(--bolt-color)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-lightning-bolt"
            style={boltStyle}
          />
          <path
            pathLength={1}
            d="M 400 270 L 440 320 L 410 350 L 460 400"
            fill="none"
            stroke="var(--bolt-color)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-lightning-branch"
            style={boltStyle}
          />
        </svg>
      </div>
    </>,
    document.body,
  );
}
