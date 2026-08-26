// ============================================================================
// File: frontend/src/components/ui/Badge.tsx
// Description: Semantic badges with calibrated contrast for both Light and Dark modes
// ============================================================================

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center font-semibold rounded-full border transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 leading-tight gap-1',
    md: 'text-xs px-3 py-1 leading-none gap-1.5',
  };

  const variantStyles = {
    success:
      'bg-[#22C55E]/15 border-[#22C55E]/35 text-[#15803D] dark:text-[#22C55E]',
    warning:
      'bg-[#F5A623]/15 border-[#F5A623]/35 text-[#B45309] dark:text-[#F5A623]',
    danger:
      'bg-[#F04438]/15 border-[#F04438]/35 text-[#B91C1C] dark:text-[#F04438]',
    info:
      'bg-[#38BDF8]/15 border-[#38BDF8]/35 text-[#0369A1] dark:text-[#38BDF8]',
    accent:
      'bg-[#FACC15]/20 border-[#FACC15]/50 text-[#854D0E] dark:text-[#FACC15] font-bold',
    neutral:
      'bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.08] dark:border-white/[0.1] text-[#4A4A52] dark:text-[#D4D4D8]',
  };

  return (
    <span
      className={twMerge(clsx(base, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
}
