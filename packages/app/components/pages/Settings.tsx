import { useSessionContext } from "@app/components/contexts/Session"
import { Button } from "@app/components/ui/Button"
import { authClient } from "@app/lib/client/connectors/auth-client"
import { useCallback } from "react"

export default function SettingsPage() {
    const { refetchSession } = useSessionContext()

    const handleSignOut = useCallback(async () => {
        await authClient.signOut()
        await refetchSession()
    }, [refetchSession])

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
    )
}
