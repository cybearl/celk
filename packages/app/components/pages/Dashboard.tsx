import { useSessionContext } from "@app/components/contexts/Session"
import AddressesDashboardTab from "@app/components/tabs/dashboard/Addresses"
import AddressListsDashboardTab from "@app/components/tabs/dashboard/AddressLists"
import TreeViewDashboardTab from "@app/components/tabs/dashboard/TreeView"
import { Button } from "@app/components/ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/Select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app/components/ui/Tabs"
import type { AddressSelectModel, SerializedAddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel, SerializedAddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { useAddresses } from "@app/hooks/api/useAddresses"
import { useAddressLists } from "@app/hooks/api/useAddressLists"
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
    dynamicConfig: DynamicConfigSelectModel | null
    initialAddresses: SerializedAddressSelectModel[]
    initialAddressLists: SerializedAddressListSelectModel[]
}

export default function DashboardPage({ dynamicConfig, initialAddresses, initialAddressLists }: DashboardPageProps) {
    const { session } = useSessionContext()

    const { data: addresses } = useAddresses(initialAddresses as unknown as AddressSelectModel[])
    const { data: addressLists } = useAddressLists(initialAddressLists as unknown as AddressListSelectModel[])

    const { currentTab, handleTabChange } = useTabs(DASHBOARD_TAB, DASHBOARD_TAB.ADDRESSES, "url", "dashboard-tab")

    if (session?.user.isLocked) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-foreground font-medium text-lg">Your account is currently locked.</p>
            </div>
        )
    }

    return (
        <div className="h-full">
            <Tabs
                value={currentTab}
                onValueChange={value => handleTabChange(value as DASHBOARD_TAB)}
                className="h-full"
            >
                <div className="relative flex justify-center items-center">
                    <div className="absolute bg-foreground h-0.5 inset-x-0 mt-0.5 hidden sm:block" />

                    <div className="sm:hidden w-full pb-2">
                        <Select value={currentTab} onValueChange={value => handleTabChange(value as DASHBOARD_TAB)}>
                            <SelectTrigger className="w-full" size="xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={DASHBOARD_TAB.ADDRESSES}>Addresses</SelectItem>
                                <SelectItem value={DASHBOARD_TAB.ADDRESS_LISTS}>Address Lists</SelectItem>
                                <SelectItem value={DASHBOARD_TAB.TREE_VIEW}>Tree View</SelectItem>
                                {session?.isAdmin && (
                                    <SelectItem value={DASHBOARD_TAB.ADMIN_PANEL}>Admin Panel</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <TabsList className="relative bg-background hidden sm:block">
                        <TabsTrigger value={DASHBOARD_TAB.ADDRESSES} asChild>
                            <Button
                                variant={currentTab === DASHBOARD_TAB.ADDRESSES ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Addresses
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value={DASHBOARD_TAB.ADDRESS_LISTS} asChild>
                            <Button
                                variant={currentTab === DASHBOARD_TAB.ADDRESS_LISTS ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Lists
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value={DASHBOARD_TAB.TREE_VIEW} asChild>
                            <Button
                                variant={currentTab === DASHBOARD_TAB.TREE_VIEW ? "active-tab" : "inactive-tab"}
                                size="sm"
                            >
                                Tree View
                            </Button>
                        </TabsTrigger>
                        {session?.isAdmin && (
                            <TabsTrigger value={DASHBOARD_TAB.ADMIN_PANEL} asChild>
                                <Button
                                    variant={currentTab === DASHBOARD_TAB.ADMIN_PANEL ? "active-tab" : "inactive-tab"}
                                    size="sm"
                                >
                                    AP
                                </Button>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <TabsContent value={DASHBOARD_TAB.ADDRESSES} className="sm:mt-4">
                    <AddressesDashboardTab dynamicConfig={dynamicConfig} addresses={addresses} />
                </TabsContent>

                <TabsContent value={DASHBOARD_TAB.ADDRESS_LISTS} className="sm:mt-4">
                    <AddressListsDashboardTab
                        dynamicConfig={dynamicConfig}
                        addresses={addresses}
                        addressLists={addressLists}
                    />
                </TabsContent>

                <TabsContent value={DASHBOARD_TAB.TREE_VIEW} className="sm:mt-4">
                    <TreeViewDashboardTab addresses={addresses} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
