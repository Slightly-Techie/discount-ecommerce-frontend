import { Minus, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  /** Called instead of onChange(0) when the shopper taps the bin at quantity 1. */
  onRemove?: () => void
  max?: number
  disabled?: boolean
  className?: string
}

// 48px pill. At 1 the minus becomes "remove"; at the stock limit plus is disabled.
export function QuantityStepper({ value, onChange, onRemove, max, disabled, className }: QuantityStepperProps) {
  const atMax = max !== undefined && value >= max
  const showRemove = value <= 1 && onRemove

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <div role="group" aria-label="Quantity" className="inline-flex h-12 items-center rounded-full border border-input">
        <button
          type="button"
          disabled={disabled || (!showRemove && value <= 1)}
          aria-label={showRemove ? "Remove item" : "Decrease quantity"}
          onClick={() => (showRemove ? onRemove?.() : onChange(value - 1))}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:text-[#A9B1AF]",
            showRemove ? "text-destructive" : "text-foreground"
          )}
        >
          {showRemove ? <Trash2 className="h-[18px] w-[18px]" /> : <Minus className="h-5 w-5" strokeWidth={2.25} />}
        </button>
        <span aria-live="polite" className="min-w-8 text-center text-base font-bold tabular-prices">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || atMax}
          aria-label="Increase quantity"
          onClick={() => onChange(value + 1)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:text-[#A9B1AF]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
      {atMax && max !== undefined && (
        <span className="text-xs font-semibold text-deal-text">Only {max} in stock</span>
      )}
    </div>
  )
}
