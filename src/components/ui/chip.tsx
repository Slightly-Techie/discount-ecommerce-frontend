import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

// Retailer / filter chip: 40px pill, toggles with aria-pressed. 48px hit area via ::after.
interface ToggleChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  ({ selected = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors duration-fast after:absolute after:-inset-1 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-accent pl-2.5 pr-3.5 font-bold text-accent-foreground"
          : "border-input bg-background text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {selected && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
      {children}
    </button>
  )
)
ToggleChip.displayName = "ToggleChip"

// Applied filter: the whole dark chip is the remove button.
interface RemovableChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function RemovableChip({ label, className, ...props }: RemovableChipProps) {
  return (
    <button
      type="button"
      aria-label={`Remove filter: ${label}`}
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-foreground pl-3.5 pr-1.5 text-sm font-semibold text-background after:absolute after:-inset-1 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {label}
      <span className="flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <X className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </button>
  )
}
