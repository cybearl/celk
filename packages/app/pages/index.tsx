import { useSessionContext } from "@app/components/contexts/Session"
import MainLayout from "@app/components/layouts/main"
import DashboardPage from "@app/components/pages/Dashboard"
import SettingsPage from "@app/components/pages/Settings"
import Flash from "@app/components/ui/Flash"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"
import { MAIN_LAYOUT_PAGE } from "@app/config/pages"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"
import type { SerializedAddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel, SerializedDynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { useAttemptsSync } from "@app/hooks/api/useAttemptsSync"
import { useBalancesSync } from "@app/hooks/api/useBalancesSync"
import { useDynamicConfig } from "@app/hooks/api/useDynamicConfig"
import { appRouter } from "@app/lib/server/trpc/routers/_app"
import { withSession } from "@app/lib/server/utils/session"
import type { NextApiRequest, NextApiResponse } from "next"

/**
 * The props for the homepage component, passed from the server-side via `getServerSideProps`.
 */
type HomepageProps = {
    initialDynamicConfig: SerializedDynamicConfigSelectModel | null
    initialAddresses: SerializedAddressSelectModel[]
    initialAddressLists: SerializedAddressListSelectModel[]
}

/**
 * The main server-side function for the application, preloads every necessary data before
 * the page is rendered.
 */
export const getServerSideProps = withSession<HomepageProps>(async (ctx, session) => {
    let initialDynamicConfig: SerializedDynamicConfigSelectModel | null = null
    let initialAddresses: SerializedAddressSelectModel[] = []
    let initialAddressLists: SerializedAddressListSelectModel[] = []

    if (session) {
        const caller = appRouter.createCaller({
            session,
            req: ctx.req as unknown as NextApiRequest,
            res: ctx.res as unknown as NextApiResponse,
        })

        const dynamicConfigRow = await caller.dynamicConfig.get()
        initialDynamicConfig = {
            ...dynamicConfigRow,
            updatedAt: dynamicConfigRow.updatedAt.toISOString(),
        }

        const addressRows = await caller.addresses.getAll()

        initialAddresses = addressRows.map(row => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            balanceCheckedAt: row.balanceCheckedAt?.toISOString() ?? null,
        }))

        const addressListRows = await caller.addressLists.getAll()

        initialAddressLists = addressListRows.map(row => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        }))
    }

    return {
        props: {
            initialDynamicConfig,
            initialAddresses,
            initialAddressLists,
        },
    }
})

export default function Homepage({ initialDynamicConfig, initialAddresses, initialAddressLists }: HomepageProps) {
    const { data: dynamicConfig } = useDynamicConfig(initialDynamicConfig as unknown as DynamicConfigSelectModel | null)
    const { session } = useSessionContext()

    // Sync the address balances
    useBalancesSync(session && dynamicConfig ? dynamicConfig.balanceCheckerDelayMs : null)

    // Sync the attempt counts for the config, addresses, and address lists
    // at a regular interval defined in the config
    useAttemptsSync(session && dynamicConfig ? dynamicConfig.workerReportIntervalMs : null)

    return (
        <MainLayout
            topRightSection={
                <p className="text-foreground font-medium px-4">
                    <Flash value={(dynamicConfig?.attempts ?? 0n).toLocaleString("en-US")} />
                </p>
            }
            bottomLeftSection={
                <p className="text-foreground font-medium pb-1.5 px-4">@cybearl/celk :: {PUBLIC_ENV.version}</p>
            }
        >
            <Scrollbar className="px-4">
                <TabsContent value={MAIN_LAYOUT_PAGE.HOME} className="w-full h-full">
                    HOME
                </TabsContent>

                {session ? (
                    <>
                        <TabsContent value={MAIN_LAYOUT_PAGE.DASHBOARD} className="w-full h-full">
                            <DashboardPage
                                dynamicConfig={dynamicConfig}
                                initialAddresses={initialAddresses}
                                initialAddressLists={initialAddressLists}
                            />
                        </TabsContent>

                        {!session.user.isLocked && (
                            <TabsContent value={MAIN_LAYOUT_PAGE.SETTINGS} className="w-full h-full">
                                <SettingsPage />
                            </TabsContent>
                        )}
                    </>
                ) : (
                    <></>
                )}

                <TabsContent value={MAIN_LAYOUT_PAGE.ABOUT} className="w-full h-full">
                    ABOUT
                </TabsContent>
            </Scrollbar>
        </MainLayout>
    )
}
