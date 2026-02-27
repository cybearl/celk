import { useSessionContext } from "@app/components/contexts/Session"
import AuthDialog from "@app/components/dialogs/Auth"
import MainLayoutSection from "@app/components/layouts/main/Section"
import MainLayoutPageTriggers from "@app/components/triggers/MainLayoutPage"
import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import Profile from "@app/components/ui/Profile"
import { Tabs } from "@app/components/ui/Tabs"
import { LOGGED_IN_ONLY_PAGES, MAIN_LAYOUT_PAGE } from "@app/config/pages"
import useTabs from "@app/hooks/useTabs"
import { cn } from "@app/lib/client/utils/styling"
import { type ReactNode, useEffect } from "react"

type MainLayoutProps = {
    topRightSection?: ReactNode
    bottomLeftSection?: ReactNode
    children?: ReactNode
}

export default function MainLayout({ topRightSection, bottomLeftSection, children }: MainLayoutProps) {
    const { session } = useSessionContext()

    const { currentTab: currentPage, onTabChange: onPageChange } = useTabs(
        MAIN_LAYOUT_PAGE,
        session ? MAIN_LAYOUT_PAGE.DASHBOARD : MAIN_LAYOUT_PAGE.HOME,
        "url",
        "page",
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: Only on session state change
    useEffect(() => {
        if (session) onPageChange(MAIN_LAYOUT_PAGE.DASHBOARD)
        else if (!session && LOGGED_IN_ONLY_PAGES.includes(currentPage)) onPageChange(MAIN_LAYOUT_PAGE.HOME)
    }, [session])

    useEffect(() => {
        console.log("current page", currentPage)
    }, [currentPage])

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

            <div className="border-2 border-border-active absolute inset-8 z-0" />

            {topRightSection && <MainLayoutSection position="top-right">{topRightSection}</MainLayoutSection>}
            {bottomLeftSection && <MainLayoutSection position="bottom-left">{bottomLeftSection}</MainLayoutSection>}

            <Tabs value={currentPage} onValueChange={value => onPageChange(value as MAIN_LAYOUT_PAGE)}>
                <MainLayoutSection position="top-left">
                    <MainLayoutPageTriggers currentPage={currentPage} />
                </MainLayoutSection>

                <div className="absolute inset-14 overflow-hidden z-10">{children}</div>
            </Tabs>

            <MainLayoutSection position="bottom-right">{session ? <Profile /> : <AuthDialog />}</MainLayoutSection>
        </div>
    )
}
