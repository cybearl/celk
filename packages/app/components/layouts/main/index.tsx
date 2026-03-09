import { useSessionContext } from "@app/components/contexts/Session"
import AuthDialog from "@app/components/dialogs/Auth"
import MainLayoutSection from "@app/components/layouts/main/Section"
import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import { Button } from "@app/components/ui/Button"
import Profile from "@app/components/ui/Profile"
import { Tabs, TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import { LOGGED_IN_ONLY_PAGES, MAIN_LAYOUT_PAGE } from "@app/config/pages"
import useTabs from "@app/hooks/useTabs"
import { cn } from "@app/lib/client/utils/styling"
import { type ReactNode, useEffect, useRef } from "react"

type MainLayoutProps = {
    topRightSection?: ReactNode
    bottomLeftSection?: ReactNode
    children?: ReactNode
}

export default function MainLayout({ topRightSection, bottomLeftSection, children }: MainLayoutProps) {
    const { session } = useSessionContext()

    const prevSessionRef = useRef(session)

    const { currentTab: currentPage, handleTabChange: handlePageChange } = useTabs(
        MAIN_LAYOUT_PAGE,
        session ? MAIN_LAYOUT_PAGE.DASHBOARD : MAIN_LAYOUT_PAGE.HOME,
        "url",
        "page",
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: Only on session state change
    useEffect(() => {
        const prevSession = prevSessionRef.current
        prevSessionRef.current = session

        // Prevents running this at every mount, only run when the
        // session state changes (i.e. user logs in or out)
        if (!prevSession && session) {
            handlePageChange(MAIN_LAYOUT_PAGE.DASHBOARD)
        } else if (prevSession && !session && LOGGED_IN_ONLY_PAGES.includes(currentPage)) {
            handlePageChange(MAIN_LAYOUT_PAGE.HOME)
        }
    }, [session])

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

            <div className="border-2 border-border-active absolute inset-5 sm:inset-8 z-0" />

            {topRightSection && (
                <MainLayoutSection position="top-right" className="hidden sm:block">
                    {topRightSection}
                </MainLayoutSection>
            )}
            {bottomLeftSection && (
                <MainLayoutSection className="hidden sm:block" position="bottom-left">
                    {bottomLeftSection}
                </MainLayoutSection>
            )}

            <Tabs value={currentPage} onValueChange={value => handlePageChange(value as MAIN_LAYOUT_PAGE)}>
                <MainLayoutSection position="top-left">
                    <TabsList>
                        <TabsTrigger value={MAIN_LAYOUT_PAGE.HOME} asChild>
                            <Button
                                variant={currentPage === MAIN_LAYOUT_PAGE.HOME ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Home
                            </Button>
                        </TabsTrigger>

                        <TabsTrigger value={MAIN_LAYOUT_PAGE.DASHBOARD} hidden={!session}>
                            <Button
                                variant={currentPage === MAIN_LAYOUT_PAGE.DASHBOARD ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Dashboard
                            </Button>
                        </TabsTrigger>

                        <TabsTrigger value={MAIN_LAYOUT_PAGE.SETTINGS} hidden={!session}>
                            <Button
                                variant={currentPage === MAIN_LAYOUT_PAGE.SETTINGS ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Settings
                            </Button>
                        </TabsTrigger>

                        <TabsTrigger value={MAIN_LAYOUT_PAGE.ABOUT} asChild>
                            <Button
                                variant={currentPage === MAIN_LAYOUT_PAGE.ABOUT ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                About
                            </Button>
                        </TabsTrigger>
                    </TabsList>
                </MainLayoutSection>

                <div className="absolute inset-y-10 inset-x-8 sm:inset-14 overflow-hidden z-10 mb-4">{children}</div>
            </Tabs>

            <MainLayoutSection position="bottom-right">{session ? <Profile /> : <AuthDialog />}</MainLayoutSection>
        </div>
    )
}
