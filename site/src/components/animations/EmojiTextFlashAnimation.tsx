import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  emoji: string;
  color?: string;
  triggerAt?: number;
  repeat?: boolean;
  children: ReactNode;
};

export default function EmojiTextFlashAnimation({
  emoji,
  color = '#ca8a04',
  triggerAt,
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (fireCount === 0) return;
    const el = textRef.current;
    if (!el) return;
    el.classList.remove('animate-text-flash');
    void el.offsetWidth;
    el.classList.add('animate-text-flash');
  }, [fireCount]);

  const flashStyle = { '--flash-color': color } as CSSProperties;

  return (
    <span ref={ref} className="relative inline-block">
      {fireCount > 0 && (
        <span
          key={`emoji-${fireCount}`}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -top-6 animate-emoji-float"
        >
          {emoji}
        </span>
      )}
      <span ref={textRef} style={flashStyle}>
        {children}
      </span>
    </span>
  );
}
