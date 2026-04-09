'use client';

import React from 'react';
import { motion } from 'framer-motion';

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
  /** Dot size (default: 8) */
  dotSize?: number;
  /** Spacing between dots (default: 10) */
  spacing?: number;
  /** Animation duration (default: 30) */
  duration?: number;
  /** Color cycle duration (default: 6) */
  colorCycleDuration?: number;
  /** Background color (default: 'var(--background)') */
  backgroundColor?: string;
  /** Opacity (default: 1) */
  opacity?: number;
};

export function GradientDots({
  dotSize = 8,
  spacing = 10,
  duration = 30,
  colorCycleDuration = 6,
  backgroundColor = 'var(--background)',
  opacity = 1,
  className,
  ...props
}: GradientDotsProps) {
  const hexSpacing = spacing * 1.732; // Hexagonal spacing calculation

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        backgroundColor,
        opacity,
        zIndex: -1,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, #ef4444, transparent 60%),
          radial-gradient(circle at 50% 50%, #f97316, transparent 60%),
          radial-gradient(circle at 50% 50%, #dc2626, transparent 60%),
          radial-gradient(ellipse at 50% 50%, #991b1b, transparent 60%)
        `,
        backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
        backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
      }}
      animate={{
        backgroundPosition: [
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px`,
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
        ],
        filter: ['hue-rotate(0deg)', 'hue-rotate(30deg)'],
      }}
      transition={{
        backgroundPosition: {
          duration: duration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
        filter: {
          duration: colorCycleDuration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
      }}
      {...props}
    />
  );
}
