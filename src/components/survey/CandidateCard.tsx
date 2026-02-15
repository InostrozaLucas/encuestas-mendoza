"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { getStorageUrl } from "@/lib/storage"

interface CandidateCardProps {
    id: string
    name: string
    imageUrl: string
    description?: string
    selected?: boolean
    onClick: () => void
}

export function CandidateCard({
    id,
    name,
    imageUrl,
    description,
    selected,
    onClick,
}: CandidateCardProps) {
    // Resolve the image URL — handles both full URLs and Supabase storage paths
    const fullImageUrl = getStorageUrl(imageUrl) || "/placeholder.png"

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 bg-white",
                selected
                    ? "border-[hsl(var(--primary))] bg-blue-50/30 shadow-md ring-2 ring-[hsl(var(--primary))/20]"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
            )}
        >
            {selected && (
                <div className="absolute top-3 right-3 bg-[hsl(var(--primary))] text-white p-1 rounded-full shadow-sm">
                    <Check className="w-4 h-4" />
                </div>
            )}

            <div className={cn(
                "relative w-24 h-24 mb-4 rounded-full overflow-hidden shadow-sm border-2",
                selected ? "border-[hsl(var(--primary))]" : "border-gray-100"
            )}>
                <Image
                    src={fullImageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center leading-tight">
                {name}
            </h3>

            {description && (
                <p className="text-sm text-gray-500 text-center mt-1">
                    {description}
                </p>
            )}
        </motion.div>
    )
}

