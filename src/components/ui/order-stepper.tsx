import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface OrderStep {
  label: string
  /** Timestamp or expectation line, e.g. "Tue 13 Oct, 10:12". */
  time?: string
  state: "done" | "current" | "todo"
}

// Vertical below lg, horizontal from lg. States are named in words, not colour alone.
export function OrderStepper({ steps, className }: { steps: OrderStep[]; className?: string }) {
  return (
    <ol aria-label="Order progress" className={cn("flex flex-col lg:flex-row", className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex min-h-14 gap-3.5 lg:flex-1 lg:flex-col lg:gap-2"
          >
            <div className="flex w-7 flex-col items-center lg:w-full lg:flex-row">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-white",
                  step.state === "done" && "border-primary bg-primary",
                  step.state === "current" && "border-primary bg-background",
                  step.state === "todo" && "border-input bg-background"
                )}
              >
                {step.state === "done" && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                {step.state === "current" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
              {!last && (
                <span
                  className={cn(
                    "min-h-6 w-0.5 flex-1 lg:h-0.5 lg:min-h-0 lg:w-auto",
                    step.state === "done" ? "bg-primary" : "bg-[#C9D0CE]"
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-3.5 lg:pr-4">
              <span className={cn("text-[15px]", step.state === "todo" ? "font-medium text-muted-foreground" : "font-bold")}>
                {step.label}
                {step.state !== "todo" && (
                  <span className="font-medium text-muted-foreground">{step.state === "done" ? " · done" : " · current"}</span>
                )}
              </span>
              {step.time && <span className="text-[13px] text-muted-foreground">{step.time}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
