import { type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  emoji: string;
  speed?: 'fast' | 'slow';
  triggerAt?: number;
  repeat?: boolean;
  children: ReactNode;
};

export default function EmojiExpand({
  emoji,
  speed = 'fast',
  triggerAt,
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

  const animClass =
    speed === 'slow' ? 'animate-emoji-expand-slow' : 'animate-emoji-expand-fast';

  return (
    <span ref={ref} className="relative inline-block">
      {fireCount > 0 && (
        <span
          key={`expand-${fireCount}`}
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 -z-10 ${animClass}`}
        >
          {emoji}
        </span>
      )}
      <span className="relative">{children}</span>
    </span>
  );
}
