import { type ReactNode } from 'react';
import { useScrollTrigger } from './useScrollTrigger';

type Props = {
  emoji: string;
  direction?: 'right' | 'left';
  triggerAt?: number;
  repeat?: boolean;
  children: ReactNode;
};

export default function EmojiStretchBlur({
  emoji,
  direction = 'right',
  triggerAt,
  repeat = false,
  children,
}: Props) {
  const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({
    triggerAt,
    once: !repeat,
  });

  const animClass =
    direction === 'left'
      ? 'animate-emoji-stretch-blur-left'
      : 'animate-emoji-stretch-blur';

  return (
    <span ref={ref} className="relative inline-block">
      {fireCount > 0 && (
        <span
          key={`stretch-${fireCount}`}
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
