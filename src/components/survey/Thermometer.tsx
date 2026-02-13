"use client"

import React from "react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ThermometerProps {
    value: number[]
    onValueChange: (value: number[]) => void
    min?: number
    max?: number
    step?: number
    className?: string
}

export function Thermometer({
    value,
    onValueChange,
    min = 1,
    max = 10,
    step = 1,
    className
}: ThermometerProps) {
    const getGradientColor = (val: number) => {
        // Basic mapping for preview: 1=red, 5=yellow, 10=green
        // In a real app we might want more complex interpolation
        // This is just for the thumb color or dynamic feedback
        return "bg-[hsl(var(--primary))]"
    }

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative h-12 w-full flex items-center">
                {/* Gradient Track */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-90 shadow-inner" />

                {/* Tick Marks (Optional) */}
                <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-2 bg-white/30" />
                    ))}
                </div>

                <Slider
                    defaultValue={[5]}
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={onValueChange}
                    className="z-10 [&>[data-slot=slider-track]]:bg-transparent [&>[data-slot=slider-track]>[data-slot=slider-range]]:bg-transparent h-12"
                // Note: we might need to customize the Slider primitive to make the track transparent 
                // so our gradient shows through, or style the track via CSS.
                // Shadcn Slider uses Radix. We'll handle this by styling the track in the Slider component or overriding here.
                />
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Muy Malo</span>
                <span>Muy Bueno</span>
            </div>
        </div>
    )
}
