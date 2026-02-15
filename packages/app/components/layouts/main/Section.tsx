import { cn } from "@app/lib/client/utils/styling"
import { type ReactNode, useMemo } from "react"

type MainLayoutSectionProps = {
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    children: ReactNode
}

export default function MainLayoutSection({ position, children }: MainLayoutSectionProps) {
    const positionClassName = useMemo(() => {
        switch (position) {
            case "top-left":
                return "top-8 left-16 -translate-y-1/2"
            case "top-right":
                return "top-8 right-16 -translate-y-1/2"
            case "bottom-left":
                return "bottom-8 left-16 translate-y-1/2"
            case "bottom-right":
                return "bottom-8 right-16 translate-y-1/2"
        }
    }, [position])

    const backgroundHiderClassName = useMemo(() => {
        switch (position) {
            case "top-left":
                return "translate-y-1/2"
            case "top-right":
                return "translate-y-1/2"
            case "bottom-left":
                return "-translate-y-1/2"
            case "bottom-right":
                return "-translate-y-1/2"
        }
    }, [position])

    return (
        <div className={cn("absolute z-10 w-fit h-fit", positionClassName)}>
            <div className="absolute inset-0 flex items-center">
                <div className={cn("bg-background w-full h-0.5 -translate-y-1/2", backgroundHiderClassName)} />
            </div>

            <div className="relative flex justify-center items-center">{children}</div>
        </div>
    )
}
