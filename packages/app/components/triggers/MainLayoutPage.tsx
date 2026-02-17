import { useSessionContext } from "@app/components/contexts/Session"
import { MainLayoutPage } from "@app/components/layouts/main"
import { Button } from "@app/components/ui/Button"
import { TabsList, TabsTrigger } from "@app/components/ui/Tabs"

type MainLayoutPageTriggersProps = {
    currentPage: MainLayoutPage
}

export default function MainLayoutPageTriggers({ currentPage }: MainLayoutPageTriggersProps) {
    const { session } = useSessionContext()

    return (
        <TabsList>
            <TabsTrigger value={MainLayoutPage.HOME} asChild>
                <Button variant={currentPage === MainLayoutPage.HOME ? "default-active" : "default-inactive"}>
                    Home
                </Button>
            </TabsTrigger>
            <TabsTrigger value={MainLayoutPage.SIGN_UP} hidden={!!session}>
                <Button variant={currentPage === MainLayoutPage.SIGN_UP ? "default-active" : "default-inactive"}>
                    Sign Up
                </Button>
            </TabsTrigger>
            <TabsTrigger value={MainLayoutPage.SIGN_IN} hidden={!!session}>
                <Button variant={currentPage === MainLayoutPage.SIGN_IN ? "default-active" : "default-inactive"}>
                    Sign In
                </Button>
            </TabsTrigger>
            <TabsTrigger value={MainLayoutPage.DASHBOARD} hidden={!session}>
                <Button variant={currentPage === MainLayoutPage.DASHBOARD ? "default-active" : "default-inactive"}>
                    Dashboard
                </Button>
            </TabsTrigger>
            <TabsTrigger value={MainLayoutPage.SETTINGS} hidden={!session}>
                <Button variant={currentPage === MainLayoutPage.SETTINGS ? "default-active" : "default-inactive"}>
                    Settings
                </Button>
            </TabsTrigger>
            <TabsTrigger value={MainLayoutPage.PROFILE} hidden={!session}>
                <Button variant={currentPage === MainLayoutPage.PROFILE ? "default-active" : "default-inactive"}>
                    Profile
                </Button>
            </TabsTrigger>
        </TabsList>
    )
}
