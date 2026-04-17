import { useEffect, useRef, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  children: ReactNode;
  triggerAt?: number;
  bulbStays?: boolean;
};

export default function LightbulbIdea({
  children,
  triggerAt,
  bulbStays = false,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: bulbStays,
  });
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (fireCount === 0) return;
    const el = textRef.current;
    if (!el) return;
    el.classList.remove('animate-idea-glow');
    void el.offsetWidth;
    el.classList.add('animate-idea-glow');
  }, [fireCount]);

  const bulbClass = bulbStays ? 'animate-bulb-float-stay' : 'animate-bulb-float';

  return (
    <span ref={ref} className="relative inline-block">
      {fireCount > 0 && (
        <span
          key={`bulb-${fireCount}`}
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 -top-6 ${bulbClass}`}
        >
          💡
        </span>
      )}
      <span ref={textRef}>{children}</span>
    </span>
  );
}
