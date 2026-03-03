import { cn } from "@app/lib/client/utils/styling"
import { type ComponentProps, forwardRef } from "react"

const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(({ className, ...props }, ref) => {
    return (
        <select
            className={cn(
                "flex h-10 w-full border border-border focus:border-border-active bg-background px-3 py-2 text-base focus-visible:outline-none disabled:cursor-default disabled:opacity-50 md:text-sm",
                className,
            )}
            ref={ref}
            {...props}
        />
    )
})

Select.displayName = "Select"
export { Select }
