import { cn } from "@app/lib/client/utils/styling"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { type ButtonHTMLAttributes, forwardRef, type MouseEvent, useState } from "react"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-foreground text-background hover:bg-foreground/80",
                outline: "bg-transparent border border-border-active hover:bg-foreground/10",
                "outline-b2": "bg-transparent border-2 border-border-active hover:bg-foreground/10",
                ghost: "bg-transparent text-foreground hover:bg-foreground/10",
                link: "bg-transparent px-0! hover:underline underline-offset-4 text-foreground",
                "active-tab": "bg-transparent text-foreground cursor-default",
                "inactive-tab": "bg-transparent text-foreground/50 hover:bg-foreground/10",
            },
            size: {
                default: "h-8 px-3 py-1.5 text-sm",
                sm: "h-7 px-2 text-sm",
                lg: "h-9 px-4 text-lg",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    isLoading?: boolean
    asChild?: boolean
    disabledText?: string
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading = false, asChild = false, disabledText, onClick, ...props }, ref) => {
        const [isLoadingInternally, setIsLoadingInternally] = useState(false)

        const Comp = asChild ? Slot : "button"

        /**
         * Handles the `onClick` event with support for async functions.
         */
        const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!onClick || isLoading || isLoadingInternally) return

            setIsLoadingInternally(true)

            try {
                await onClick(event)
            } catch (error) {
                console.error("An error occurred on the 'Button' component:", error)
            }

            setIsLoadingInternally(false)
        }

        // Handle "asChild" case, pass "onClick" through but don't modify children
        if (asChild) {
            const asChildProps = {
                ...props,
                ...(onClick && { onClick: handleClick }),
            }

            return (
                <Comp
                    className={cn(buttonVariants({ className, size, variant }))}
                    data-slot="button"
                    {...asChildProps}
                />
            )
        }

        // Regular button handling, if the button is loading, we replace the
        // default props with loading props, note that it takes priority
        // over the disabled state
        if (isLoading || isLoadingInternally) {
            props["aria-busy"] = true
            props["aria-label"] = "Loading"
            props.title = "Loading"
            props.disabled = true

            // If the button is loading, we replace the children with an animated icon
            props.children = (
                <div className="relative flex items-center justify-center">
                    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin w-6 h-6" />
                    </div>
                    <div className="opacity-0">{props.children}</div>
                </div>
            )
        }

        // If the button is disabled, we keep the children as is in order to keep the same size,
        // we simply set the opacity to 0 for the children and add the disabled text on top of it
        if (!isLoading && !isLoadingInternally && props.disabled && disabledText) {
            props["aria-label"] = disabledText
            props.title = disabledText
            props.disabled = true

            props.children = (
                <div className="relative">
                    <div className="opacity-0 pointer-events-none">{props.children}</div>
                    <div className="absolute inset-0 flex items-center justify-center text-base">{disabledText}</div>
                </div>
            )
        }

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                data-slot="button"
                ref={ref}
                onClick={handleClick}
                {...props}
            />
        )
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, "href" | "className"> &
    VariantProps<typeof buttonVariants> & {
        href: string
        className?: string
        isExternal?: boolean
    }

function LinkButton({ className, variant, size, href, isExternal, ...props }: LinkButtonProps) {
    return (
        <Link
            className={cn(buttonVariants({ className, size, variant }))}
            href={href}
            {...(isExternal ? { rel: "noopener noreferrer", target: "_blank" } : {})}
            {...props}
        />
    )
}

export { LinkButton }

type IconButtonBase = {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    "aria-label": string
    className?: string
}

type IconButtonProps = Omit<React.ComponentProps<"button">, "children"> &
    VariantProps<typeof buttonVariants> &
    IconButtonBase

function IconButton({ icon: Icon, className, variant, size = "icon", ...props }: IconButtonProps) {
    return (
        <button className={cn(buttonVariants({ className, size, variant }))} data-slot="button" {...props}>
            <Icon />
        </button>
    )
}

type IconButtonLinkProps = Omit<React.ComponentProps<typeof Link>, "className" | "children"> &
    VariantProps<typeof buttonVariants> &
    IconButtonBase & {
        isExternal?: boolean
    }

function IconButtonLink({
    icon: Icon,
    className,
    variant,
    size = "icon",
    href,
    isExternal,
    ...props
}: IconButtonLinkProps) {
    return (
        <Link
            className={cn(buttonVariants({ className, size, variant }))}
            href={href}
            {...(isExternal ? { rel: "noopener noreferrer", target: "_blank" } : {})}
            {...props}
        >
            <Icon />
        </Link>
    )
}

export { IconButton, IconButtonLink }
