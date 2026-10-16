import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Savings badge: orange with #111 text
        deal: "border-transparent bg-deal text-deal-foreground font-bold text-[13px] leading-[18px] px-2 py-[3px]",
        // Order status pills
        placed: "rounded-full border-transparent bg-secondary text-foreground text-[13px] font-bold px-2.5 py-1",
        confirmed: "rounded-full border-transparent bg-accent text-accent-foreground text-[13px] font-bold px-2.5 py-1",
        shipping: "rounded-full border-transparent bg-deal-subtle text-deal-strong text-[13px] font-bold px-2.5 py-1",
        delivered: "rounded-full border-transparent bg-save-subtle text-save text-[13px] font-bold px-2.5 py-1",
        cancelled: "rounded-full border-transparent bg-destructive-subtle text-destructive text-[13px] font-bold px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
