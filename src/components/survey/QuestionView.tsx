"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CandidateCard } from "./CandidateCard"
import { Thermometer } from "./Thermometer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export type QuestionType = "single_choice_image" | "thermometer" | "single_choice"

export interface Option {
    id: string
    label: string
    imageUrl?: string
    description?: string
}

export interface Question {
    id: string
    type: QuestionType
    text: string
    options?: Option[]
    required?: boolean
    thermometerConfig?: {
        min: number
        max: number
        step: number
    }
}

interface QuestionViewProps {
    question: Question
    onNext: (answer: any) => void
    isLastQuestion: boolean
    isSubmitting?: boolean
}

export function QuestionView({ question, onNext, isLastQuestion, isSubmitting = false }: QuestionViewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [thermometerValue, setThermometerValue] = useState<number[]>([5])

    const handleNext = () => {
        if (question.type === "thermometer") {
            onNext(thermometerValue[0])
        } else {
            if (selectedOption) {
                onNext(selectedOption)
            }
        }
        // Reset state for next question (though typically this component might unmount or we'd reset in useEffect)
        setSelectedOption(null)
        setThermometerValue([5])
    }

    const canProceed = () => {
        if (question.type === "thermometer") return true
        return !!selectedOption
    }

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col h-full justify-between min-h-[80vh]">
            <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex-1 flex flex-col"
            >
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 text-center leading-snug">
                    {question.text}
                </h2>

                <div className="flex-1 flex flex-col justify-center gap-4">
                    {question.type === "single_choice_image" && question.options && (
                        <div className="grid grid-cols-2 gap-4">
                            {question.options.map((option) => (
                                <CandidateCard
                                    key={option.id}
                                    id={option.id}
                                    name={option.label}
                                    imageUrl={option.imageUrl || "/placeholder.png"}
                                    selected={selectedOption === option.id}
                                    onClick={() => setSelectedOption(option.id)}
                                />
                            ))}
                        </div>
                    )}

                    {question.type === "thermometer" && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="mb-6 flex justify-center">
                                <div className="text-4xl font-bold text-[hsl(var(--primary))]">
                                    {thermometerValue[0]}
                                </div>
                            </div>
                            <Thermometer
                                value={thermometerValue}
                                onValueChange={setThermometerValue}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="mt-8">
                <Button
                    size="lg"
                    className="w-full text-lg h-14 rounded-xl shadow-lg shadow-blue-500/20"
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                >
                    {isSubmitting ? "Enviando..." : (isLastQuestion ? "Finalizar" : "Continuar")}
                    {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
            </div>
        </div>
    )
}
