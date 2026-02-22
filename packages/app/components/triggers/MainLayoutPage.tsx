import { useSessionContext } from "@app/components/contexts/Session"
import { Button } from "@app/components/ui/Button"
import { TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import { MainLayoutPage } from "@app/config/pages"

type MainLayoutPageTriggersProps = {
    currentPage: MainLayoutPage
}

export default function MainLayoutPageTriggers({ currentPage }: MainLayoutPageTriggersProps) {
    const { session } = useSessionContext()

    return (
        <TabsList>
            <TabsTrigger value={MainLayoutPage.HOME} asChild>
                <Button variant={currentPage === MainLayoutPage.HOME ? "active-tab" : "inactive-tab"}>Home</Button>
            </TabsTrigger>

            <TabsTrigger value={MainLayoutPage.DASHBOARD} hidden={!session}>
                <Button variant={currentPage === MainLayoutPage.DASHBOARD ? "active-tab" : "inactive-tab"}>
                    Dashboard
                </Button>
            </TabsTrigger>

            <TabsTrigger value={MainLayoutPage.SETTINGS} hidden={!session}>
                <Button variant={currentPage === MainLayoutPage.SETTINGS ? "active-tab" : "inactive-tab"}>
                    Settings
                </Button>
            </TabsTrigger>

            <TabsTrigger value={MainLayoutPage.ABOUT} asChild>
                <Button variant={currentPage === MainLayoutPage.ABOUT ? "active-tab" : "inactive-tab"}>About</Button>
            </TabsTrigger>
        </TabsList>
    )
}
