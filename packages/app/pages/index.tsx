import { useSessionContext } from "@app/components/contexts/Session"
import MainLayout from "@app/components/layouts/main"
import SettingsPage from "@app/components/pages/Settings"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"
import { MAIN_LAYOUT_PAGE } from "@app/config/pages"

export default function Homepage() {
    const { session } = useSessionContext()

    return (
        <MainLayout
            topRightSection={<p className="text-foreground font-medium px-4">1,151,448,484</p>}
            bottomLeftSection={
                <p className="text-foreground font-medium pb-1.5 px-4">@cybearl/celk :: {PUBLIC_ENV.version}</p>
            }
        >
            <Scrollbar>
                <TabsContent value={MAIN_LAYOUT_PAGE.HOME} className="w-full h-full">
                    HOME
                </TabsContent>

                {session ? (
                    <>
                        <TabsContent value={MAIN_LAYOUT_PAGE.DASHBOARD} className="w-full h-full">
                            DASHBOARD
                        </TabsContent>

                        <TabsContent value={MAIN_LAYOUT_PAGE.SETTINGS} className="w-full h-full">
                            <SettingsPage />
                        </TabsContent>
                    </>
                ) : (
                    <></>
                )}

                <TabsContent value={MAIN_LAYOUT_PAGE.ABOUT} className="w-full h-full">
                    ABOUT
                </TabsContent>
            </Scrollbar>
        </MainLayout>
    )
}
