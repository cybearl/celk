import { useSessionContext } from "@app/components/contexts/Session"
import Avatar from "boring-avatars"

export default function Profile() {
    const { session } = useSessionContext()

    if (!session) return null
    return (
        <div className="flex pb-2 px-4 gap-2 justify-center items-center">
            <div className="pb-1.5 text-end">
                <p className="text-foreground font-medium text-sm sm:text-base">{session?.user.displayUsername}</p>
                <p className="text-foreground text-xs">{session?.user.email}</p>
            </div>
            <div className="size-8 sm:size-10 rounded-full bg-foreground">
                <Avatar name={session?.user.email} variant="marble" className="opacity-95 size-8 sm:size-10" />
            </div>
        </div>
    )
}
