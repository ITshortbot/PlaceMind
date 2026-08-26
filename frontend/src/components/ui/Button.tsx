import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#6C5CE7] text-white hover:bg-[#5b4cdb] shadow-md shadow-[#6C5CE7]/25",
        primary:
          "bg-[#6C5CE7] text-white hover:bg-[#5b4cdb] shadow-md shadow-[#6C5CE7]/25",
        secondary:
          "bg-black/[0.04] dark:bg-white/[0.06] text-[#1A1A1E] dark:text-[#F5F5F7] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.08]",
        outline:
          "border border-black/[0.12] dark:border-white/[0.12] bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#1A1A1E] dark:text-[#F5F5F7]",
        ghost:
          "hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#1A1A1E] dark:hover:text-[#F5F5F7]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm",
        success:
          "bg-[#16A34A] text-white hover:bg-[#15803d] shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        md: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[11px]",
        lg: "h-11 rounded-2xl px-6 text-sm font-bold",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
