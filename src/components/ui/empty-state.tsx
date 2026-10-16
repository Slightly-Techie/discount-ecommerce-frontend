import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  /** One primary action, plus optional suggestion chips. */
  action?: React.ReactNode
  className?: string
}

// Lucide icon in a 64px grey circle, a plain title, one line on what to do, one action.
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 px-4 py-12 text-center", className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="max-w-[360px] text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-1.5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
