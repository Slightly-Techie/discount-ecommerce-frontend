import * as React from "react"

import { cn } from "@/lib/utils"

// 48px tall, 16px text (prevents iOS zoom), 3:1 border, focus ring with a white gap.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-3.5 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#C9D0CE] disabled:bg-muted disabled:text-subtle aria-[invalid=true]:border-destructive aria-[invalid=true]:shadow-[inset_0_0_0_1px_hsl(var(--destructive))]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
