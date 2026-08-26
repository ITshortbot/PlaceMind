import * as React from "react"
import { cn } from "@/components/ui/Button"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#14141A] px-3.5 py-2.5 text-xs font-medium text-[#1A1A1E] dark:text-[#F5F5F7] shadow-xs transition-colors placeholder:text-[#8A8A92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
