"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CandidateCard } from "./CandidateCard"
import { Thermometer } from "./Thermometer"
import { Button } from "@/components/ui/button"

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
    imageUrl?: string    // For Slider Image
    minLabel?: string    // For Slider Min Label
    maxLabel?: string    // For Slider Max Label
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
        if (question.type === "thermometer" || question.type === "slider_scale") {
            // Check if DK is selected
            if (selectedOption === 'DK') {
                onNext('DK')
            } else {
                onNext(thermometerValue[0])
            }
        } else {
            if (selectedOption) {
                onNext(selectedOption)
            }
        }
        // Reset state
        setSelectedOption(null)
        setThermometerValue([5])
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
                                const isSelected = Array.isArray(selectedOption) ? selectedOption.includes(option.id) : selectedOption === option.id;
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

                    {(question.type === "thermometer" || question.type === "slider_scale") && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
                        </div>
                    )}

                    {question.type === "text" && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <textarea
                                className="w-full p-2 border rounded-md"
                                rows={4}
                                placeholder="Escriba su respuesta aquí..."
                                onChange={(e) => setSelectedOption(e.target.value)}
                            />
                        </div>
                    )}

                    {question.type === "boolean" && (
                        <div className="flex flex-col gap-3">
                            <div
                                className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${selectedOption === 'true'
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-gray-200"
                                    }`}
                                onClick={() => setSelectedOption('true')}
                            >
                                <span className="text-lg font-medium">Sí</span>
                            </div>
                            <div
                                className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${selectedOption === 'false'
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-gray-200"
                                    }`}
                                onClick={() => setSelectedOption('false')}
                            >
                                <span className="text-lg font-medium">No</span>
                            </div>
                        </div>
                    )}

                </div>

                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="rounded-full px-8"
                        disabled={isSubmitting} // Can add validation here
                    >
                        {isLastQuestion ? "Finalizar" : "Siguiente"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}


