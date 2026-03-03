import { useSessionContext } from "@app/components/contexts/Session"
import Avatar from "boring-avatars"

export default function Profile() {
    const { session } = useSessionContext()

    if (!session) return null
    return (
        <div className="flex pb-2 px-4 gap-2 justify-center items-center">
            <div className="pb-1.5 text-end">
                <p className="text-foreground font-medium">{session?.user.displayUsername}</p>
                <p className="text-foreground text-xs">{session?.user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-foreground">
                <Avatar name={session?.user.email} size={40} variant="marble" className="opacity-95" />
            </div>
        </div>
    )
}
