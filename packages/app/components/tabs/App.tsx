import { Button } from "@app/components/ui/Button"
import { Tabs, TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import auth from "@app/lib/auth"
import { useCallback, useState } from "react"

enum AppTab {
    Home = "home",
    Dashboard = "dashboard",
    Settings = "settings",
    Profile = "profile",
    SignUp = "sign-up",
    SignIn = "sign-in",
}

type AppTabsProps = {
    onTabChange?: (tab: AppTab) => void
}

export default function AppTabs({ onTabChange }: AppTabsProps) {
    const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.Home)

    const handleTabChange = useCallback(
        (tab: AppTab) => {
            setCurrentTab(tab)
            onTabChange?.(tab)
        },
        [onTabChange],
    )

    return (
        <Tabs value={currentTab} onValueChange={(tab: string) => handleTabChange(tab as AppTab)}>
            <TabsList>
                <TabsTrigger value={AppTab.Home} asChild>
                    <Button variant={currentTab === AppTab.Home ? "default-active" : "default-inactive"}>Home</Button>
                </TabsTrigger>
                <TabsTrigger value={AppTab.Dashboard}>
                    <Button variant={currentTab === AppTab.Dashboard ? "default-active" : "default-inactive"}>
                        Dashboard
                    </Button>
                </TabsTrigger>
                <TabsTrigger value={AppTab.Settings}>
                    <Button variant={currentTab === AppTab.Settings ? "default-active" : "default-inactive"}>
                        Settings
                    </Button>
                </TabsTrigger>
                <TabsTrigger value={AppTab.Profile}>
                    <Button variant={currentTab === AppTab.Profile ? "default-active" : "default-inactive"}>
                        Profile
                    </Button>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
