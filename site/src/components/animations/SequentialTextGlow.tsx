import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type SequenceProps = {
  triggerAt?: number;
  stepMs?: number;
  repeat?: boolean;
  children: ReactNode;
};

type SegmentProps = {
  color: string;
  children: ReactNode;
};

export function GlowSegment({ color, children }: SegmentProps) {
  const style = { '--flash-color': color } as CSSProperties;
  return (
    <span data-glow-segment="" style={style}>
      {children}
    </span>
  );
}

export default function SequentialTextGlow({
  triggerAt,
  stepMs = 400,
  repeat = false,
  children,
}: SequenceProps) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

  useEffect(() => {
    if (fireCount === 0) return;
    const root = ref.current;
    if (!root) return;
    const segments = root.querySelectorAll<HTMLElement>('[data-glow-segment]');
    segments.forEach((el, i) => {
      el.classList.remove('animate-sequence-glow');
      el.style.animationDelay = `${i * stepMs}ms`;
      void el.offsetWidth;
      el.classList.add('animate-sequence-glow');
    });
  }, [fireCount, stepMs, ref]);

  return (
    <span ref={ref} className="inline">
      {children}
    </span>
  );
}
