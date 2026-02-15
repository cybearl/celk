import { Page, usePageContext } from "@app/components/contexts/Page"
import { useSessionContext } from "@app/components/contexts/Session"
import { Button } from "@app/components/ui/Button"
import { TabsList, TabsTrigger } from "@app/components/ui/Tabs"

export default function PageTriggers() {
    const { session } = useSessionContext()
    const { currentPage } = usePageContext()

    return (
        <TabsList>
            <TabsTrigger value={Page.Home} asChild>
                <Button variant={currentPage === Page.Home ? "default-active" : "default-inactive"}>Home</Button>
            </TabsTrigger>
            <TabsTrigger value={Page.SignUp} hidden={!!session}>
                <Button variant={currentPage === Page.SignUp ? "default-active" : "default-inactive"}>Sign Up</Button>
            </TabsTrigger>
            <TabsTrigger value={Page.SignIn} hidden={!!session}>
                <Button variant={currentPage === Page.SignIn ? "default-active" : "default-inactive"}>Sign In</Button>
            </TabsTrigger>
            <TabsTrigger value={Page.Dashboard} hidden={!session}>
                <Button variant={currentPage === Page.Dashboard ? "default-active" : "default-inactive"}>
                    Dashboard
                </Button>
            </TabsTrigger>
            <TabsTrigger value={Page.Settings} hidden={!session}>
                <Button variant={currentPage === Page.Settings ? "default-active" : "default-inactive"}>
                    Settings
                </Button>
            </TabsTrigger>
            <TabsTrigger value={Page.Profile} hidden={!session}>
                <Button variant={currentPage === Page.Profile ? "default-active" : "default-inactive"}>Profile</Button>
            </TabsTrigger>
        </TabsList>
    )
}
