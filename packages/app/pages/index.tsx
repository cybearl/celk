import { useSessionContext } from "@app/components/contexts/Session"
import MainLayout from "@app/components/layouts/main"
import DashboardPage from "@app/components/pages/Dashboard"
import SettingsPage from "@app/components/pages/Settings"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"
import { MAIN_LAYOUT_PAGE } from "@app/config/pages"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"
import type { SerializedAddressListSelectModel } from "@app/db/schema/addressList"
import { appRouter } from "@app/lib/server/trpc/routers/_app"
import { withSession } from "@app/lib/server/utils/session"
import type { NextApiRequest, NextApiResponse } from "next"

/**
 * The props for the homepage component, passed from the server-side via `getServerSideProps`.
 */
type HomepageProps = {
    initialAddresses: SerializedAddressSelectModel[]
    initialAddressLists: SerializedAddressListSelectModel[]
}

/**
 * The main server-side function for the application, preloads every necessary data before
 * the page is rendered.
 */
export const getServerSideProps = withSession<HomepageProps>(async (ctx, session) => {
    let initialAddresses: SerializedAddressSelectModel[] = []
    let initialAddressLists: SerializedAddressListSelectModel[] = []

    if (session) {
        const caller = appRouter.createCaller({
            session,
            req: ctx.req as unknown as NextApiRequest,
            res: ctx.res as unknown as NextApiResponse,
        })

        const addressRows = await caller.addresses.getAll()

        initialAddresses = addressRows.map(row => ({
            ...row,
            balance: row.balance?.toString() ?? null,
            attempts: row.attempts.toString(),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            balanceCheckedAt: row.balanceCheckedAt?.toISOString() ?? null,
        }))

        const addressListRows = await caller.addressLists.getAll()

        initialAddressLists = addressListRows.map(row => ({
            ...row,
            attempts: row.attempts.toString(),
            lastStatsAttempts: row.lastStatsAttempts?.toString() ?? null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            lastStatsAt: row.lastStatsAt?.toISOString() ?? null,
        }))
    }

    return {
        props: {
            initialAddresses,
            initialAddressLists,
        },
    }
})

export default function Homepage({ initialAddresses, initialAddressLists }: HomepageProps) {
    const { session } = useSessionContext()

    return (
        <MainLayout
            topRightSection={<p className="text-foreground font-medium px-4">1,151,448,484</p>}
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
                                initialAddresses={initialAddresses}
                                initialAddressLists={initialAddressLists}
                            />
                        </TabsContent>

                        <TabsContent value={MAIN_LAYOUT_PAGE.SETTINGS} className="w-full h-full">
                            <SettingsPage />
                        </TabsContent>
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
