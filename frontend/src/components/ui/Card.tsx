import * as React from "react"
import { cn } from "@/components/ui/Button"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "elevated" | "interactive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#14141A]/90 text-[#1A1A1E] dark:text-[#F5F5F7] shadow-xs backdrop-blur-xl transition-all duration-200",
      variant === "elevated" && "shadow-xl shadow-black/[0.04] dark:shadow-black/60 border-black/[0.1] dark:border-white/[0.12]",
      variant === "interactive" && "hover:border-[#6C5CE7]/40 hover:shadow-md cursor-pointer",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-bold text-sm leading-none tracking-tight text-[#1A1A1E] dark:text-[#F5F5F7]", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
