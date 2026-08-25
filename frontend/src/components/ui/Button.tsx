// ============================================================================
// File: frontend/src/components/ui/Button.tsx
// Description: Liquid-Droplet Connecting Glassmorphic Button with real SVG Gooey bridge
// ============================================================================

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}: ButtonProps) {
  // If variant is primary or glow, render the true liquid-connecting droplet button
  if (variant === 'primary' || variant === 'glow') {
    const sizeConfig = {
      sm: { h: 'h-9', text: 'text-xs', pad: 'px-4', orbSize: 'w-8 h-8', iconSize: 'w-3.5 h-3.5' },
      md: { h: 'h-11', text: 'text-sm', pad: 'px-5', orbSize: 'w-10 h-10', iconSize: 'w-4 h-4' },
      lg: { h: 'h-12', text: 'text-base', pad: 'px-6', orbSize: 'w-11 h-11', iconSize: 'w-4.5 h-4.5' },
    };

    const cfg = sizeConfig[size];

    return (
      <div className={twMerge('inline-flex items-center group cursor-pointer select-none', className)}>
        {/* Gooey Liquid SVG Filter Container that creates the fluid bridge between the main pill and the detached orb */}
        <button
          className="relative inline-flex items-center gooey-container bg-transparent p-1 focus:outline-none cursor-pointer border-none"
          {...props}
        >
          {/* Main Body Capsule */}
          <div className={clsx(
            cfg.h,
            cfg.pad,
            'relative rounded-full bg-[#141417] dark:bg-[#1C1C24] text-white flex items-center justify-center font-bold transition-transform duration-500 ease-out group-hover:scale-102 shadow-lg',
            cfg.text
          )}>
            <span className="relative z-10">{children}</span>
          </div>

          {/* Liquid Detaching Droplet Orb */}
          <div className={clsx(
            cfg.orbSize,
            'rounded-full bg-[#141417] dark:bg-[#1C1C24] text-white flex items-center justify-center -ml-2.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-2.5 group-hover:bg-[#6C5CE7] group-active:translate-x-0 group-active:scale-95'
          )}>
            {icon ? (
              <span className="transition-transform duration-500 group-hover:rotate-45">
                {icon}
              </span>
            ) : (
              <ArrowRight className={clsx(cfg.iconSize, 'transition-transform duration-500 group-hover:-rotate-45')} />
            )}
          </div>
        </button>
      </div>
    );
  }

  // Secondary & Ghost standard glassmorphic styling with organic press
  const baseStyles =
    'group relative inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-[0.95] rounded-full tracking-tight select-none cursor-pointer overflow-hidden btn-liquid';

  const sizeStyles = {
    sm: 'h-9 px-4 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-12 px-7 text-base gap-2.5',
  };

  const variantStyles = {
    secondary:
      'bg-white/80 hover:bg-white/95 dark:bg-[#18181F]/80 dark:hover:bg-[#1E1E28]/95 text-[#1A1A1E] dark:text-[#F5F5F7] border border-white/80 dark:border-white/10 hover:border-[#6C5CE7]/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(108,92,231,0.2)] backdrop-blur-2xl hover:scale-[1.03] font-semibold',
    ghost:
      'bg-transparent hover:bg-white/40 dark:hover:bg-white/5 text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7] border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.08] backdrop-blur-md',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon && (
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            {icon}
          </span>
        )}
      </span>
    </button>
  );
}
