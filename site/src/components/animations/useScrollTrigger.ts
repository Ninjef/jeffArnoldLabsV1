import { useEffect, useRef, useState } from 'react';

export type ScrollTriggerOptions = {
  triggerAt?: number;
  once?: boolean;
};

export function useScrollTrigger<T extends HTMLElement>(
  options: ScrollTriggerOptions = {},
) {
  const { triggerAt = 0.5, once = false } = options;
  const ref = useRef<T | null>(null);
  const [fireCount, setFireCount] = useState(0);
  const hasFiredRef = useRef(false);
  const insideRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const t = Math.min(Math.max(triggerAt, 0), 1);
    const topPct = -(t * 100);
    const bottomPct = -((1 - t) * 100);
    const rootMargin = `${topPct}% 0px ${bottomPct}% 0px`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !insideRef.current) {
          insideRef.current = true;
          if (once && hasFiredRef.current) return;
          hasFiredRef.current = true;
          setFireCount((c) => c + 1);
        } else if (!entry.isIntersecting) {
          insideRef.current = false;
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerAt, once]);

  return { ref, fireCount };
}
