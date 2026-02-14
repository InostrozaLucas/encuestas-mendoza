"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CandidateCard } from "./CandidateCard"
import { Thermometer } from "./Thermometer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export type QuestionType = "single_choice_image" | "thermometer" | "single_choice" | "multiple_choice" | "slider_scale" | "boolean" | "text"

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
    imageUrl?: string
    minLabel?: string
    maxLabel?: string
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
    const [selectedOption, setSelectedOption] = useState<string | string[] | null>(null)
    const [thermometerValue, setThermometerValue] = useState<number[]>([5])

    const handleMultipleChoiceSelect = (id: string) => {
        const current = Array.isArray(selectedOption) ? selectedOption : []
        if (current.includes(id)) {
            setSelectedOption(current.filter(i => i !== id))
        } else {
            setSelectedOption([...current, id])
        }
    }

    const handleNext = () => {
        if (question.type === "thermometer") {
            // Check if DK is selected
            if (selectedOption === 'DK') {
                onNext('DK') // Or null, depending on backend preference. Let's use 'DK' alias for now.
            } else {
                onNext(thermometerValue[0])
            }
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
        if (Array.isArray(selectedOption)) return selectedOption.length > 0
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

                    {question.type === "single_choice" && question.options && (
                        <div className="flex flex-col gap-3">
                            {question.options.map((option) => (
                                <div
                                    key={option.id}
                                    className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${selectedOption === option.id
                                        ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800"
                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                        }`}
                                    onClick={() => setSelectedOption(option.id)}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${selectedOption === option.id
                                        ? "border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100"
                                        : "border-gray-300"
                                        }`}>
                                        {selectedOption === option.id && <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />}
                                    </div>
                                    <span className="text-lg font-medium">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type === "multiple_choice" && question.options && (
                        <div className="flex flex-col gap-3">
                            {question.options.map((option) => {
                                const isSelected = Array.isArray(selectedOption) ? selectedOption.includes(option.id) : selectedOption === option.id; // Handle mixed state temporarily
                                // Actually, we need to handle state for array.
                                // The current state `selectedOption` is `string | null`. 
                                // We need to refactor state to support array for multiple choice.
                                return (
                                    <div
                                        key={option.id}
                                        className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                            ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                        onClick={() => handleMultipleChoiceSelect(option.id)}
                                    >
                                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center mr-3 ${isSelected
                                            ? "border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100"
                                            : "border-gray-300"
                                            }`}>
                                            {isSelected && <div className="w-3 h-3 text-white dark:text-slate-900 font-bold flex items-center justify-center text-[10px]">✓</div>}
                                        </div>
                                        <span className="text-lg font-medium">{option.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {question.type === "thermometer" && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            {/* Optional Image */}
                            {question.imageUrl && (
                                <div className="mb-6 flex justify-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm relative">
                                        <img
                                            src={question.imageUrl}
                                            alt={question.text}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 flex justify-center">
                                <div className="text-4xl font-bold text-[hsl(var(--primary))]">
                                    {selectedOption === 'DK' ? '?' : thermometerValue[0]}
                                </div>
                            </div>

                            <Thermometer
                                value={selectedOption === 'DK' ? null : thermometerValue[0]}
                                onValueChange={(val) => {
                                    if (val === null) {
                                        setSelectedOption('DK')
                                    } else {
                                        setSelectedOption(null)
                                        setThermometerValue([val])
                                    }
                                }}
                                imageUrl={question.imageUrl}
                                minLabel={question.minLabel}
                                maxLabel={question.maxLabel}
                                disabled={isSubmitting}
                            />

                            {/* Labels */}
                            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3">
                                <span>{question.minLabel || 'Muy Mala'}</span>
                                <span>{question.maxLabel || 'Muy Buena'}</span>
                            </div>

                            {/* Don't Know Option */}
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div
                                    className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${selectedOption === 'DK'
                                        ? "border-slate-400 bg-slate-100 text-slate-900"
                                        : "border-gray-200 hover:bg-slate-50 text-slate-600"
                                        }`}
                                    onClick={() => {
                                        if (selectedOption === 'DK') {
                                            setSelectedOption(null)
                                        } else {
                                            setSelectedOption('DK')
                                        }
                                    }}
                                >
                                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center mr-3 ${selectedOption === 'DK'
                                        ? "border-slate-600 bg-slate-600"
                                        : "border-gray-400 bg-white"
                                        }`}>
                                        {selectedOption === 'DK' && <div className="w-3 h-3 text-white font-bold flex items-center justify-center text-[10px]">✓</div>}
                                    </div>
                                    <span className="text-sm font-medium">No lo conozco / No sabe</span>
                                </div>
                            </div>
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
