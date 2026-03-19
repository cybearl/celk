import { Popover, PopoverContent, PopoverTrigger } from "@app/components/ui/Popover"

type TruncatedDescriptionProps = {
    description: string | null | undefined
}

export default function TruncatedDescription({ description }: TruncatedDescriptionProps) {
    if (!description) return <span className="text-muted-foreground">N/A</span>

    return (
        <Popover>
            <PopoverTrigger className="max-w-48 truncate cursor-pointer underline decoration-dotted underline-offset-2">
                {description}
            </PopoverTrigger>
            <PopoverContent className="">{description}</PopoverContent>
        </Popover>
    )
}
