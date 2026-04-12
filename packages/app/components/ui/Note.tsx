import { DynamicIcon, type IconName } from "lucide-react/dynamic"

type NoteProps = {
    icon: IconName
    text: string
}

export default function Note({ icon, text }: NoteProps) {
    return (
        <div className="flex items-start gap-2 rounded border border-border-active bg-foreground/5 px-3 py-2 text-sm">
            <DynamicIcon name={icon} className="size-0 min-w-5 min-h-5 mt-1" />
            <span>{text}</span>
        </div>
    )
}
