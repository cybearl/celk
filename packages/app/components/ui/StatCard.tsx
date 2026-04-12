type StatCardProps = {
    title: string
    value?: string | number | null
}

export default function StatCard({ title, value }: StatCardProps) {
    return (
        <div className="flex-1 border p-4 flex flex-col gap-2">
            <h4 className="text-base font-medium">{title}</h4>
            <p key={value ?? title} className="text-2xl animate-flash">
                {value ?? "N/A"}
            </p>
        </div>
    )
}
