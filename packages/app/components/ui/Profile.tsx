import { useSessionContext } from "@app/components/contexts/Session"

export default function Profile() {
    const { session } = useSessionContext()

    if (!session) return null
    return (
        <div className="flex pb-2 px-4 gap-2 justify-center items-center">
            <div className="pb-1.5 text-end">
                <p className="text-foreground font-medium">{session?.user.displayUsername}</p>
                <p className="text-foreground text-xs">{session?.user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted"></div>
        </div>
    )
}
