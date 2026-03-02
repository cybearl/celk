import { cn } from "@app/lib/client/utils/styling"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import React from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
    id: string | number
    backgroundColor: string
    icon: IconName
    title: string
    description?: string
}

/** A fully custom toast that still maintains the animations and interactions. */
function Toast({ icon, backgroundColor, title, description }: ToastProps) {
    return (
        <div className="relative bg-black w-full md:max-w-91 p-4 border-2 border-foreground">
            <div className={cn("absolute inset-0", backgroundColor)} />

            <div className="relative w-full flex items-center justify-center gap-4">
                <DynamicIcon name={icon} className="size-0 min-w-6 min-h-6" />
                <p className="text-base text-foreground">{title}</p>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
        </div>
    )
}

/**
 * Toast notification methods.
 */
const toast = {
    success: (title: string, description?: string) => {
        sonnerToast.custom(id => (
            <Toast
                id={id}
                icon="circle-check-big"
                backgroundColor="bg-success/10"
                title={title}
                description={description}
            />
        ))
    },
    warning: (title: string, description?: string) => {
        sonnerToast.custom(id => (
            <Toast
                id={id}
                icon="circle-alert"
                backgroundColor="bg-warning/15"
                title={title}
                description={description}
            />
        ))
    },
    error: (title: string, description?: string) => {
        sonnerToast.custom(id => (
            <Toast id={id} icon="circle-x" backgroundColor="bg-danger/15" title={title} description={description} />
        ))
    },
    info: (title: string, description?: string) => {
        sonnerToast.custom(id => (
            <Toast id={id} icon="info" backgroundColor="bg-info/15" title={title} description={description} />
        ))
    },
}

export default toast
