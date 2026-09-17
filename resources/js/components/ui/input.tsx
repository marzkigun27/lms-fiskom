import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-[3px] border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-lg bg-card px-3 py-1 text-base neo-shadow transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:shadow-[4px_4px_0px_0px_var(--color-ring)] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px]",
        "aria-invalid:border-destructive aria-invalid:shadow-[4px_4px_0px_0px_var(--color-destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
