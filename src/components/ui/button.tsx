import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Design system v1: orange `deal` is the single commerce action per screen,
// teal `default` handles everything else. 48px default height; `sm` keeps a
// 48px hit area through an invisible ::after inset.
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[15px] font-semibold transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:bg-skeleton disabled:text-subtle disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-strong",
        deal: "bg-deal text-deal-foreground hover:bg-deal-hover active:bg-[#D85A08]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[#9A1E14] active:bg-[#821A11] focus-visible:ring-destructive",
        outline:
          "border border-primary bg-background text-primary hover:bg-accent hover:text-accent-foreground active:bg-[#D3EFEB] disabled:bg-background disabled:border-[#C9D0CE]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-skeleton",
        ghost: "text-primary hover:bg-accent hover:text-accent-foreground active:bg-[#D3EFEB] disabled:bg-transparent",
        link: "text-primary underline underline-offset-4 hover:text-primary-strong",
        // Legacy names used by admin and vendor screens
        accent: "bg-deal text-deal-foreground hover:bg-deal-hover active:bg-[#D85A08]",
        success: "bg-save text-white hover:bg-save/90",
        discount: "bg-save text-white hover:bg-save/90",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-10 px-3.5 text-sm after:absolute after:-inset-1 after:content-['']",
        lg: "h-14 px-6 text-base font-bold",
        icon: "h-12 w-12",
        "icon-round": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
