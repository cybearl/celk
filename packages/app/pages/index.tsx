import { useSessionContext } from "@app/components/contexts/Session"
import MainLayout from "@app/components/layouts/main"
import Dashboard from "@app/components/pages/Dashboard"
import SettingsPage from "@app/components/pages/Settings"
import Scrollbar from "@app/components/ui/Scrollbar"
import { TabsContent } from "@app/components/ui/Tabs"
import { PUBLIC_ENV } from "@app/config/env"
import { MAIN_LAYOUT_PAGE } from "@app/config/pages"
import type { SerializedAddressSelectModel } from "@app/db/schema/address"
import { withSession } from "@app/lib/server/utils/session"

/**
 * The props for the homepage component, passed from the server-side via `getServerSideProps`.
 */
type HomepageProps = {
    addresses: SerializedAddressSelectModel[]
}

/**
 * The main server-side function for the application, preloads every necessary data before
 * the page is rendered.
 */
export const getServerSideProps = withSession<HomepageProps>(async (_ctx, session) => {
    let addresses: SerializedAddressSelectModel[] = []

    if (session) {
        const { default: scAddress } = await import("@app/db/schema/address")
        const { db } = await import("@app/lib/server/connectors/db")
        const { eq } = await import("drizzle-orm")

        const addressRows = await db.select().from(scAddress).where(eq(scAddress.userId, session.userId))

        addresses = addressRows.map(addressRow => ({
            ...addressRow,
            balance: addressRow.balance?.toString() ?? null,
            attempts: addressRow.attempts.toString(),
            createdAt: addressRow.createdAt.toISOString(),
            updatedAt: addressRow.updatedAt.toISOString(),
            balanceCheckedAt: addressRow.balanceCheckedAt?.toISOString() ?? null,
        }))
    }

    return {
        props: { addresses },
    }
})

export default function Homepage({ addresses }: HomepageProps) {
    const { session } = useSessionContext()

    return (
        <MainLayout
            topRightSection={<p className="text-foreground font-medium px-4">1,151,448,484</p>}
            bottomLeftSection={
                <p className="text-foreground font-medium pb-1.5 px-4">@cybearl/celk :: {PUBLIC_ENV.version}</p>
            }
        >
            <Scrollbar>
                <TabsContent value={MAIN_LAYOUT_PAGE.HOME} className="w-full h-full">
                    HOME
                </TabsContent>

                {session ? (
                    <>
                        <TabsContent value={MAIN_LAYOUT_PAGE.DASHBOARD} className="w-full h-full">
                            <Dashboard addresses={addresses} />
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
