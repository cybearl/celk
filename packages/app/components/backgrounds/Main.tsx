import { AnimatedGridPattern } from "@app/components/ui/AnimatedGridPattern"
import { cn } from "@app/lib/utils/styling"

export default function MainBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-50">
            <div className="border-2 border-foreground absolute inset-8 z-20" />

            <div className="absolute bottom-7 right-16 w-24 h-4 z-20">
                <div className="absolute inset-0 flex items-center">
                    <div className="bg-background w-full h-1 mt-1.5" />
                </div>

                <div className="absolute inset-0 flex justify-center items-center">
                    <p className="text-foreground font-medium">nano-celk</p>
                </div>
            </div>

            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn(
                    "w-[125%] h-[125%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "skew-y-12",
                    "mask-[radial-gradient(circle_at_center,white_0%,transparent_50%)]",
                )}
            />
        </div>
    )
}
