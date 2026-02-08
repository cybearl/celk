import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import { cn } from "@app/lib/utils/styling"

export default function MainBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-50">
            <div className="border-2 border-white absolute inset-8" />
            <div className="bg-white absolute bottom-5.5 right-16 px-2 text-lg text-black font-black">nano-celk</div>

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
