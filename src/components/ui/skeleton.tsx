import { cn } from "@/lib/utils"

// Flat block, no shimmer (design system v1: data-light, reduced motion friendly).
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-sm bg-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
