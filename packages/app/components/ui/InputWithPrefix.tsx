import { cn } from "@app/lib/client/utils/styling"
import { type ComponentProps, forwardRef } from "react"

type InputWithPrefixProps = ComponentProps<"input"> & {
    prefix: string
}

export const InputWithPrefix = forwardRef<HTMLInputElement, InputWithPrefixProps>(
    ({ className, prefix, "aria-invalid": ariaInvalid, disabled, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "flex h-8 w-full border border-border bg-background focus-within:border-border-active",
                    ariaInvalid && "border-destructive",
                    disabled && "opacity-50 cursor-default",
                )}
            >
                <span className="flex items-center px-2 text-sm text-muted-foreground border-r border-border select-none">
                    {prefix}
                </span>
                <input
                    className={cn(
                        "flex-1 bg-transparent px-2 text-base placeholder:text-foreground/50 focus-visible:outline-none disabled:cursor-default md:text-sm",
                        className,
                    )}
                    aria-invalid={ariaInvalid}
                    disabled={disabled}
                    ref={ref}
                    {...props}
                />
            </div>
        )
    },
)

InputWithPrefix.displayName = "InputWithPrefix"
