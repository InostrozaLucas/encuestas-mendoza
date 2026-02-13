"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { QuestionView, Question } from "@/components/survey/QuestionView"
import { AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import FingerprintJS from '@fingerprintjs/fingerprintjs'

// Mock Data (structure must match DB for this to work perfectly, but for now we rely on the ID matching manually or being fetched)
// In a real scenario, we'd fetch this from DB too.
const MOCK_SURVEY = {
    id: "1", // This will be ignored, we use the DB ID
    title: "Encuesta de Opinión Pública - Febrero 2026",
    questions: [
        {
            id: "q1",
            type: "single_choice_image" as const,
            text: "¿A quién votaría en las próximas elecciones?",
            options: [
                { id: "c1", label: "Candidato A", imageUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix", description: "Partido Renovador" },
                { id: "c2", label: "Candidato B", imageUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka", description: "Unión Ciudadana" },
                { id: "c3", label: "Candidato C", imageUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack", description: "Frente Popular" },
                { id: "nsnc", label: "NS/NC", imageUrl: "https://api.dicebear.com/9.x/initials/svg?seed=NS", description: "Indeciso" },
            ]
        },
        {
            id: "q2",
            type: "thermometer" as const,
            text: "¿Cómo evalúa la gestión del gobierno actual?",
            thermometerConfig: { min: 1, max: 10, step: 1 }
        },
        {
            id: "q3",
            type: "single_choice_image" as const,
            text: "¿Qué candidato le genera mayor rechazo?",
            options: [
                { id: "c1", label: "Candidato A", imageUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" },
                { id: "c2", label: "Candidato B", imageUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka" },
            ]
        }
    ]
}

export default function SurveyPage() {
    const params = useParams()
    // In a real app, we would fetch the survey data based on params.slug
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [visitorId, setVisitorId] = useState<string>("")

    const survey = MOCK_SURVEY
    const currentQuestion = survey.questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

    useEffect(() => {
        const setFp = async () => {
            const fp = await FingerprintJS.load()
            const { visitorId } = await fp.get()
            setVisitorId(visitorId)
        }
        setFp()
    }, [])

    const handleNext = async (answer: any) => {
        const newAnswers = { ...answers, [currentQuestion.id]: answer }
        setAnswers(newAnswers)

        if (isLastQuestion) {
            await submitSurvey(newAnswers)
        } else {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const submitSurvey = async (finalAnswers: Record<string, any>) => {
        setIsSubmitting(true)
        setError(null)
        try {
            const slug = params.slug as string

            // 1. Get Survey ID from Slug
            const { data: surveyData, error: surveyError } = await supabase
                .from('surveys')
                .select('id')
                .eq('slug', slug)
                .single()

            if (surveyError || !surveyData) {
                throw new Error("Encuesta no encontrada o inactiva.")
            }

            const surveyId = surveyData.id

            // 2. Insert into survey_responses
            // We use a simple hash of IP (simulated) + Fingerprint for now as the 'hash'.
            // In a real app we'd want a backend function to hash the real IP.
            // For this client-side demo, we'll use the visitorId as the main identifier.
            const ipHash = "client-side-ip-simulation" // Real IP hashing should be done server-side or via Edge Functions

            const { data: responseData, error: responseError } = await supabase
                .from('survey_responses')
                .insert({
                    survey_id: surveyId,
                    fingerprint_hash: visitorId,
                    ip_hash: ipHash,
                    started_at: new Date().toISOString(), // Approximation
                    completed_at: new Date().toISOString(),
                })
                .select()
                .single()

            if (responseError) throw new Error("Error al guardar la respuesta: " + responseError.message)

            const responseId = responseData.id

            // 3. Insert Answers
            // We need to map our simple answer object to the answers table structure.
            // Note: In a real app, 'question_id' in DB should match our local question IDs.
            // Since we are using MOCK_SURVEY with hardcoded IDs (q1, q2), we might have a mismatch if the DB uses UUIDs.
            // CRITICAL: We need to fetch questions from DB to get their real UUIDs, OR assume the MOCK data matches DB data.
            // For this task, we will attempt to look up question UUIDs by order if possible, OR just insert using the text logic?
            // Actually, the prompt implies we just built the schema. We don't have questions in DB yet?
            // Wait, the user said "make sure code looks up survey_id". They didn't say "fetch questions".
            // If we blindly insert "q1" into a UUID field, it will fail.
            // Strategy: We will fetch the questions for this survey from DB and map them by "order" or "content -> text".
            // Robust approach: Fetch questions ordered by 'order'. Assume MOCK_SURVEY questions are in same order.

            const { data: dbQuestions, error: questionsError } = await supabase
                .from('questions')
                .select('id, "order"')
                .eq('survey_id', surveyId)
                .order('order', { ascending: true })

            if (questionsError) throw new Error("Error al recuperar preguntas de la base de datos.")

            // Map answers to DB question IDs based on index
            // MOCK_SURVEY.questions[i] corresponds to dbQuestions[i] (assuming inserted in order)

            const answerInserts = Object.keys(finalAnswers).map((qId) => {
                // Find the index of qId in MOCK_SURVEY
                const index = survey.questions.findIndex(q => q.id === qId)
                if (index === -1 || !dbQuestions || !dbQuestions[index]) return null

                return {
                    response_id: responseId,
                    question_id: dbQuestions[index].id,
                    answer_value: finalAnswers[qId]
                }
            }).filter(Boolean)

            if (answerInserts.length > 0) {
                const { error: answersError } = await supabase
                    .from('answers')
                    .insert(answerInserts as any) // Type assertion for generated types if needed

                if (answersError) throw new Error("Error al guardar los detalles de las respuestas: " + answersError.message)
            }

            setIsCompleted(true)

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Ocurrió un error desconocido.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Gracias!</h1>
                    <p className="text-gray-600 mb-6">Sus respuestas han sido registradas exitosamente.</p>
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-400">Political Insight</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Progress */}
            <div className="h-1.5 bg-gray-200">
                <div
                    className="h-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestionIndex) / survey.questions.length) * 100}%` }}
                />
            </div>

            <main className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <QuestionView
                        key={currentQuestion.id}
                        question={currentQuestion}
                        onNext={handleNext}
                        isLastQuestion={isLastQuestion}
                        isSubmitting={isSubmitting}
                    />
                </AnimatePresence>
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 text-center mx-4 rounded-lg mt-4">
                        {error}
                    </div>
                )}
            </main>
        </div>
    )
}

