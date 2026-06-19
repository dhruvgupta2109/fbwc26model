'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  pauseOnHover?: boolean;
}

export function GradientText({
  children,
  className = '',
  colors = ['#e6edf3', '#38bdf8', '#fbbf24', '#f472b6'],
  animationSpeed = 7,
  direction = 'horizontal',
  pauseOnHover = true
}: GradientTextProps) {
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const duration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (paused) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += delta;
    const cycle = elapsedRef.current % (duration * 2);
    progress.set(cycle < duration ? (cycle / duration) * 100 : 100 - ((cycle - duration) / duration) * 100);
  });

  useEffect(() => {
    elapsedRef.current = 0;
    progress.set(0);
  }, [duration, progress]);

  const backgroundPosition = useTransform(progress, (value) => (direction === 'vertical' ? `50% ${value}%` : `${value}% 50%`));
  const gradientAngle = direction === 'vertical' ? 'to bottom' : direction === 'diagonal' ? 'to bottom right' : 'to right';
  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(${gradientAngle}, ${[...colors, colors[0]].join(', ')})`,
    backgroundSize: direction === 'vertical' ? '100% 300%' : '300% 100%',
    backgroundRepeat: 'repeat'
  };

  return (
    <motion.span
      className={`animated-gradient-text ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      style={{ ...gradientStyle, backgroundPosition }}
    >
      {children}
    </motion.span>
  );
}
