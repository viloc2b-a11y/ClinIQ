import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 font-medium text-xs whitespace-nowrap transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive [a]:hover:bg-destructive/25",
        outline: "text-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        warning:
          "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        danger:
          "border-red-500/35 bg-red-500/10 text-red-900 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
