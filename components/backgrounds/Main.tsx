import { AnimatedGridPattern } from "@/components/ui/AnimatedGridPattern"
import { cn } from "@/lib/utils/styling"

export default function MainBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-50">
            <div className="border-2 absolute inset-8" />
            <div className="bg-gray-500 absolute bottom-5.5 right-16 px-2">nano-celk</div>

            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn("mask-[radial-gradient(800px_circle_at_center,white,transparent)]", "skew-y-12")}
            />
        </div>
    )
}
