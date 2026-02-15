import { Page } from "@app/components/contexts/Page"
import MainLayout from "@app/components/layouts/main"
import SignInPage from "@app/components/pages/SignIn"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"

export default function Homepage() {
    return (
        <MainLayout
            topRightSection={<p className="text-foreground font-medium px-2">1,151,448,484</p>}
            bottomLeftSection={<p className="text-foreground font-medium pb-1.5 px-2">v{PUBLIC_ENV.version}</p>}
            bottomRightSection={<p className="text-foreground font-medium pb-1.5 px-2">nano-celk</p>}
        >
            <Scrollbar>
                <TabsContent value={Page.Home} className="w-full h-full">
                    HOME
                </TabsContent>

                <TabsContent value={Page.Dashboard} className="w-full h-full">
                    DASHBOARD
                </TabsContent>

                <TabsContent value={Page.Profile} className="w-full h-full">
                    PROFILE
                </TabsContent>

                <TabsContent value={Page.Settings} className="w-full h-full">
                    SETTINGS
                </TabsContent>

                <TabsContent value={Page.SignUp} className="w-full h-full">
                    SIGN UP
                </TabsContent>

                <TabsContent value={Page.SignIn} className="w-full h-full">
                    <SignInPage />
                </TabsContent>
            </Scrollbar>
        </MainLayout>
    )
}
