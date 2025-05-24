import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground animate-shine",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover-scale",
        ghost: "hover:bg-accent hover:text-accent-foreground hover-lift",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "relative overflow-hidden bg-[hsl(var(--brand))] text-black hover:bg-[hsl(var(--brand))] hover:shadow-[0_0_20px_2px_hsla(var(--brand)/0.3)] before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(90deg,hsl(var(--brand)),hsl(var(--brand-foreground)),hsl(var(--brand)))] before:bg-[length:200%_100%] before:animate-shimmer after:absolute after:inset-0 after:-z-10 after:bg-[hsl(var(--brand)_/_50%)] after:blur-xl after:animate-pulse-slow hover:after:animate-glow",
        shine: "relative overflow-hidden bg-background border border-[hsl(var(--brand)/0.3)] text-foreground hover:border-[hsl(var(--brand))] shadow-sm hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[hsl(var(--brand)/0.2)] animate-shine",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xl: "h-12 rounded-md px-10 text-base"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
