import * as React from "react"
import { cn } from "@/components/ui/Button"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-[#6C5CE7] to-[#38BDF8] transition-all duration-500 ease-out rounded-full"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
