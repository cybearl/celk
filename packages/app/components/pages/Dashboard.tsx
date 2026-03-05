import { useSessionContext } from "@app/components/contexts/Session"
import AddressesDashboardTab from "@app/components/tabs/dashboard/Addresses"
import TreeViewDashboardTab from "@app/components/tabs/dashboard/TreeView"
import { Button } from "@app/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"
import useTabs from "@app/hooks/useTabs"

/**
 * The tabs for the dashboard.
 */
export enum DASHBOARD_TAB {
    ADDRESSES = "addresses",
    ADDRESS_LISTS = "address_lists",
    TREE_VIEW = "tree_view",
    ADMIN_PANEL = "admin_panel",
}

type DashboardPageProps = {
    initialAddresses: SerializedAddressSelectModel[]
}

export default function DashboardPage({ initialAddresses }: DashboardPageProps) {
    const { session } = useSessionContext()

    const { currentTab, onTabChange } = useTabs(DASHBOARD_TAB, DASHBOARD_TAB.ADDRESSES, "url", "dashboard-tab")

    return (
        <div className="h-full ">
            <Tabs value={currentTab} onValueChange={value => onTabChange(value as DASHBOARD_TAB)} className="h-full">
                <div className="relative flex justify-center items-center">
                    <div className="absolute bg-foreground h-0.5 inset-x-0 mt-0.5" />

                    <TabsList className="relative bg-background">
                        <TabsTrigger value={DASHBOARD_TAB.ADDRESSES} asChild>
                            <Button variant={currentTab === DASHBOARD_TAB.ADDRESSES ? "active-tab" : "inactive-tab"}>
                                Addresses
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value={DASHBOARD_TAB.ADDRESS_LISTS} asChild>
                            <Button
                                variant={currentTab === DASHBOARD_TAB.ADDRESS_LISTS ? "active-tab" : "inactive-tab"}
                            >
                                Address Lists {session?.user.isLocked && "(Locked)"}
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value={DASHBOARD_TAB.TREE_VIEW} asChild>
                            <Button variant={currentTab === DASHBOARD_TAB.TREE_VIEW ? "active-tab" : "inactive-tab"}>
                                Tree View
                            </Button>
                        </TabsTrigger>
                        {session?.isAdmin && (
                            <TabsTrigger value={DASHBOARD_TAB.ADMIN_PANEL} asChild>
                                <Button
                                    variant={currentTab === DASHBOARD_TAB.ADMIN_PANEL ? "active-tab" : "inactive-tab"}
                                >
                                    Admin Panel
                                </Button>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <TabsContent value={DASHBOARD_TAB.ADDRESSES} className="mt-4">
                    <AddressesDashboardTab initialAddresses={initialAddresses} />
                </TabsContent>

                <TabsContent value={DASHBOARD_TAB.TREE_VIEW} className="mt-4">
                    <TreeViewDashboardTab initialAddresses={initialAddresses} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
