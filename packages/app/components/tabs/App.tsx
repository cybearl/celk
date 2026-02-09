import { Button } from "@app/components/ui/Button"
import { Tabs, TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import { useState } from "react"

enum AppTab {
    Home = "home",
    Dashboard = "dashboard",
    Settings = "settings",
    Profile = "profile",
}

export default function AppTabs() {
    const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.Home)

    return (
        <Tabs value={currentTab} onValueChange={(tab: string) => setCurrentTab(tab as AppTab)}>
            <TabsList>
                <TabsTrigger value={AppTab.Home} asChild>
                    <Button variant="default">Home</Button>
                </TabsTrigger>
                <TabsTrigger value={AppTab.Dashboard}>Dashboard</TabsTrigger>
                <TabsTrigger value={AppTab.Settings}>Settings</TabsTrigger>
                <TabsTrigger value={AppTab.Profile}>Profile</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
