"use client"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ThermometerProps {
    value: number | null
    onValueChange: (value: number | null) => void
    imageUrl?: string
    minLabel?: string
    maxLabel?: string
    disabled?: boolean
}

export function Thermometer({
    value,
    onValueChange,
    imageUrl,
    minLabel = "Muy Mala",
    maxLabel = "Muy Buena",
    disabled = false
}: ThermometerProps) {

    // Internal helper to get slider value (must be array)
    // If value is null (DK), we default to 5 for visual centering but make it grayscale/inactive
    const sliderValue = value === null ? [5] : [value]
    const isDK = value === null

    // Calculate color based on value (1-10)
    // 1 (Red) -> 5 (Yellow) -> 10 (Green)
    const getColor = (val: number) => {
        if (isDK || disabled) return "#e2e8f0" // slate-200

        if (val <= 5) {
            // Red to Yellow
            const percentage = (val - 1) / 4
            return `hsl(${percentage * 60}, 90%, 50%)`
        } else {
            // Yellow to Green
            const percentage = (val - 6) / 4
            return `hsl(${60 + percentage * 60}, 90%, 50%)`
        }
    }

    const currentColor = getColor(sliderValue[0])

    return (
        <div className={cn("w-full flex flex-col items-center", disabled && "opacity-50 pointer-events-none")}>

            {/* Optional Image */}
            {imageUrl && (
                <div className="mb-6 w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm relative">
                    <img
                        src={imageUrl}
                        alt="Candidate or Topic"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Value Display */}
            <div className="mb-6 text-4xl font-bold transition-colors" style={{ color: isDK ? '#94a3b8' : currentColor }}>
                {isDK ? '?' : value}
            </div>

            {/* Slider Container */}
            <div className="w-full px-2 mb-2 relative">
                <Slider
                    value={sliderValue}
                    onValueChange={(vals) => onValueChange(vals[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full h-12 py-4"
                    disabled={disabled}
                />

                {/* Dynamically colored thumb override */}
                <style jsx global>{`
                    span[role="slider"] {
                        background-color: ${currentColor} !important;
                        border-color: white !important;
                        border-width: 4px !important;
                        width: 2rem !important;
                        height: 2rem !important;
                    }
                `}</style>
            </div>

            {/* Labels */}
            <div className="w-full flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-8">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>

            {/* "Don't Know" Button */}
            <Button
                type="button"
                variant={isDK ? "default" : "outline"}
                onClick={() => onValueChange(null)}
                className={cn(
                    "w-full max-w-xs transition-all",
                    isDK ? "bg-slate-600 hover:bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
            >
                <span className={cn(
                    "mr-2 flex h-5 w-5 items-center justify-center rounded-sm border",
                    isDK ? "border-white/50" : "border-slate-300"
                )}>
                    {isDK && <span className="text-[10px]">✓</span>}
                </span>
                No lo conozco / No sabe
            </Button>
        </div>
    )
}

