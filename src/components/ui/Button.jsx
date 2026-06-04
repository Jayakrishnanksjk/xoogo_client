import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow hover:bg-brand-dark transition-colors",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 transition-colors",
        outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors",
        secondary: "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200/80 transition-colors",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 px-2 text-xs rounded-md",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  label,
  startIcon: StartIcon,
  endIcon: EndIcon,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {asChild ? (
        children
      ) : children ? (
        children
      ) : (
        <>
          {StartIcon && <StartIcon className="size-4 shrink-0" />}
          {label && <span>{label}</span>}
          {EndIcon && <EndIcon className="size-4 shrink-0" />}
        </>
      )}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
