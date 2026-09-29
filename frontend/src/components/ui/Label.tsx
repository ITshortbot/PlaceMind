import * as React from "react"
import { cn } from "@/components/ui/Button"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[11px] font-semibold tracking-wide text-[#6B6B76] dark:text-[#A1A1AA] uppercase leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none block mb-1.5",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
