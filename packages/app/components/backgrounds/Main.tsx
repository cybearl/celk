import MainBackgroundSection from "@app/components/sections/MainBackground"
import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import { cn } from "@app/lib/client/utils/styling"
import type { ReactNode } from "react"

type MainBackgroundProps = {
    topLeftSection?: ReactNode
    topRightSection?: ReactNode
    bottomLeftSection?: ReactNode
    bottomRightSection?: ReactNode
}

export default function MainBackground({
    topLeftSection,
    topRightSection,
    bottomLeftSection,
    bottomRightSection,
}: MainBackgroundProps) {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-50">
            <div className="border-2 border-foreground absolute inset-8 z-0" />

            {topLeftSection && <MainBackgroundSection position="top-left">{topLeftSection}</MainBackgroundSection>}
            {topRightSection && <MainBackgroundSection position="top-right">{topRightSection}</MainBackgroundSection>}
            {bottomLeftSection && (
                <MainBackgroundSection position="bottom-left">{bottomLeftSection}</MainBackgroundSection>
            )}
            {bottomRightSection && (
                <MainBackgroundSection position="bottom-right">{bottomRightSection}</MainBackgroundSection>
            )}

            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn(
                    "w-[125%] h-[125%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "skew-y-12",
                    "mask-[radial-gradient(circle_at_center,white_0%,transparent_50%)]",
                )}
            />
        </div>
    )
}
