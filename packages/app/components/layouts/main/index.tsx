import { useSessionContext } from "@app/components/contexts/Session"
import MainLayoutSection from "@app/components/layouts/main/Section"
import MainLayoutPageTriggers from "@app/components/triggers/MainLayoutPage"
import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import { Tabs } from "@app/components/ui/Tabs"
import useTabs from "@app/hooks/useTabs"
import { cn } from "@app/lib/client/utils/styling"
import type { ReactNode } from "react"

/**
 * The pages for the main layout.
 */
export enum MainLayoutPage {
    HOME = "home",
    DASHBOARD = "dashboard",
    SETTINGS = "settings",
    PROFILE = "profile",
    SIGN_UP = "sign-up",
    SIGN_IN = "sign-in",
}

type MainLayoutProps = {
    topRightSection?: ReactNode
    bottomLeftSection?: ReactNode
    bottomRightSection?: ReactNode
    children?: ReactNode
}

export default function MainLayout({
    topRightSection,
    bottomLeftSection,
    bottomRightSection,
    children,
}: MainLayoutProps) {
    const { session } = useSessionContext()

    const {
        initialTab: initialPage,
        currentTab: currentPage,
        onTabChange: onPageChange,
    } = useTabs(MainLayoutPage, session ? MainLayoutPage.DASHBOARD : MainLayoutPage.HOME, "url", "page")

    return (
        <div className="h-screen w-screen overflow-hidden absolute opacity-80">
            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn(
                    "w-[125%] h-[125%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border",
                    "skew-y-12",
                    "mask-[radial-gradient(circle_at_center,white_0%,transparent_50%)]",
                )}
            />

            <div className="border-2 border-foreground absolute inset-8 z-0" />

            {topRightSection && <MainLayoutSection position="top-right">{topRightSection}</MainLayoutSection>}
            {bottomLeftSection && <MainLayoutSection position="bottom-left">{bottomLeftSection}</MainLayoutSection>}
            {bottomRightSection && <MainLayoutSection position="bottom-right">{bottomRightSection}</MainLayoutSection>}

            <Tabs defaultValue={initialPage} onValueChange={value => onPageChange(value as MainLayoutPage)}>
                <MainLayoutSection position="top-left">
                    <MainLayoutPageTriggers currentPage={currentPage} />
                </MainLayoutSection>

                <div className="absolute inset-14 overflow-hidden z-10">{children}</div>
            </Tabs>
        </div>
    )
}
