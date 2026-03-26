import { useSessionContext } from "@app/components/contexts/Session"
import { Button } from "@app/components/ui/Button"
import toast from "@app/components/ui/Toast"
import { authClient } from "@app/lib/client/connectors/authClient"
import { useCallback } from "react"

export default function SettingsPage() {
    const { refetchSession } = useSessionContext()

    /**
     * Handle the sign-out process.
     */
    const handleSignOut = useCallback(async () => {
        await authClient.signOut()
        await refetchSession()
    }, [refetchSession])

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <Button onClick={handleSignOut}>Sign Out</Button>
            <Button
                onClick={() =>
                    toast.success(
                        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium consequuntur a quod aut cumque impedit sapiente perspiciatis maiores laudantium vel, mollitia molestiae vero officiis magni voluptate exercitationem ipsa placeat magnam.",
                    )
                }
            >
                Success Toast
            </Button>
            <Button
                onClick={() =>
                    toast.warning(
                        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium consequuntur a quod aut cumque impedit sapiente perspiciatis maiores laudantium vel, mollitia molestiae vero officiis magni voluptate exercitationem ipsa placeat magnam.",
                    )
                }
            >
                Warning Toast
            </Button>
            <Button
                onClick={() =>
                    toast.error(
                        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium consequuntur a quod aut cumque impedit sapiente perspiciatis maiores laudantium vel, mollitia molestiae vero officiis magni voluptate exercitationem ipsa placeat magnam.",
                    )
                }
            >
                Error Toast
            </Button>
            <Button
                onClick={() =>
                    toast.info(
                        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium consequuntur a quod aut cumque impedit sapiente perspiciatis maiores laudantium vel, mollitia molestiae vero officiis magni voluptate exercitationem ipsa placeat magnam.",
                    )
                }
            >
                Info Toast
            </Button>
        </div>
    )
}
