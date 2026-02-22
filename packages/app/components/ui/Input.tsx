import { cn } from "@app/lib/client/utils/styling"
import { type ComponentProps, forwardRef } from "react"

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full border border-border focus:border-border-active bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-950 placeholder:text-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            ref={ref}
            {...props}
        />
    )
})

Input.displayName = "Input"
export { Input }
