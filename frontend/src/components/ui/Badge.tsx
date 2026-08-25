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
      'bg-[#6C5CE7]/15 border-[#6C5CE7]/35 text-[#5B46D6] dark:text-[#7D6FF0]',
    neutral:
      'bg-black/[0.05] dark:bg-[#1C1C21] border-black/[0.08] dark:border-white/[0.08] text-[#5A5A63] dark:text-[#A1A1AA]',
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
