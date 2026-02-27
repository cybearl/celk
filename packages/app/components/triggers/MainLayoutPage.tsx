import { useSessionContext } from "@app/components/contexts/Session"
import { Button } from "@app/components/ui/Button"
import { TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import { MAIN_LAYOUT_PAGE } from "@app/config/pages"

type MainLayoutPageTriggersProps = {
    currentPage: MAIN_LAYOUT_PAGE
}

export default function MainLayoutPageTriggers({ currentPage }: MainLayoutPageTriggersProps) {
    const { session } = useSessionContext()

    return (
        <TabsList>
            <TabsTrigger value={MAIN_LAYOUT_PAGE.HOME} asChild>
                <Button variant={currentPage === MAIN_LAYOUT_PAGE.HOME ? "active-tab" : "inactive-tab"}>Home</Button>
            </TabsTrigger>

            <TabsTrigger value={MAIN_LAYOUT_PAGE.DASHBOARD} hidden={!session}>
                <Button variant={currentPage === MAIN_LAYOUT_PAGE.DASHBOARD ? "active-tab" : "inactive-tab"}>
                    Dashboard
                </Button>
            </TabsTrigger>

            <TabsTrigger value={MAIN_LAYOUT_PAGE.SETTINGS} hidden={!session}>
                <Button variant={currentPage === MAIN_LAYOUT_PAGE.SETTINGS ? "active-tab" : "inactive-tab"}>
                    Settings
                </Button>
            </TabsTrigger>

            <TabsTrigger value={MAIN_LAYOUT_PAGE.ABOUT} asChild>
                <Button variant={currentPage === MAIN_LAYOUT_PAGE.ABOUT ? "active-tab" : "inactive-tab"}>About</Button>
            </TabsTrigger>
        </TabsList>
    )
}
