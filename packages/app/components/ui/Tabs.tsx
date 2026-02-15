import { cn } from "@app/lib/client/utils/styling"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"
import type { ComponentProps } from "react"
import * as React from "react"

function Tabs({ className, orientation = "horizontal", ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            data-orientation={orientation}
            orientation={orientation}
            className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
            {...props}
        />
    )
}

const tabsListVariants = cva(
    "rounded-lg p-0.75 group-data-[orientation=horizontal]/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list text-slate-500 inline-flex w-fit items-center justify-center gap-0 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
    {
        variants: {
            variant: {
                default: "bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
)

function TabsList({
    className,
    variant = "default",
    ...props
}: ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            data-variant={variant}
            className={cn(tabsListVariants({ variant }), className)}
            {...props}
        />
    )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
    return <TabsPrimitive.Trigger asChild data-slot="tabs-trigger" className={className} {...props} />
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
