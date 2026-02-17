import MainLayout, { MainLayoutPage } from "@app/components/layouts/main"
import SignInPage from "@app/components/pages/SignIn"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"

export default function Homepage() {
    return (
        <MainLayout
            topRightSection={<p className="text-foreground font-medium px-2">1,151,448,484</p>}
            bottomLeftSection={<p className="text-foreground font-medium pb-1.5 px-2">@cybearl/celk</p>}
            bottomRightSection={<p className="text-foreground font-medium pb-1.5 px-2">v{PUBLIC_ENV.version}</p>}
        >
            <Scrollbar>
                <TabsContent value={MainLayoutPage.HOME} className="w-full h-full">
                    HOME
                </TabsContent>

                <TabsContent value={MainLayoutPage.DASHBOARD} className="w-full h-full">
                    DASHBOARD
                </TabsContent>

                <TabsContent value={MainLayoutPage.PROFILE} className="w-full h-full">
                    PROFILE
                </TabsContent>

                <TabsContent value={MainLayoutPage.SETTINGS} className="w-full h-full">
                    SETTINGS
                </TabsContent>

                <TabsContent value={MainLayoutPage.SIGN_UP} className="w-full h-full">
                    SIGN UP
                </TabsContent>

                <TabsContent value={MainLayoutPage.SIGN_IN} className="w-full h-full">
                    <SignInPage />
                </TabsContent>
            </Scrollbar>
        </MainLayout>
    )
}
