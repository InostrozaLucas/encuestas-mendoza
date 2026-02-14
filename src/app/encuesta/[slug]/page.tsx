"use client"

import { useState, useEffect, use } from "react"
import { useParams } from "next/navigation"
import { QuestionView, Question, QuestionType } from "@/components/survey/QuestionView"
import { AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { Loader2 } from "lucide-react"

export default function SurveyPage({ params }: { params: Promise<{ slug: string }> }) {
    // Unwrap params in Next.js 15+ 
    const unwrappedParams = use(params)
    const slug = unwrappedParams.slug

    const [survey, setSurvey] = useState<{ id: string, title: string, questions: Question[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [visitorId, setVisitorId] = useState<string>("")

    useEffect(() => {
        const setFp = async () => {
            const fp = await FingerprintJS.load()
            const { visitorId } = await fp.get()
            setVisitorId(visitorId)
        }
        setFp()
    }, [])

    useEffect(() => {
        const fetchSurvey = async () => {
            setLoading(true)
            setError(null)
            try {
                // 1. Fetch Survey
                const { data: surveyData, error: surveyError } = await supabase
                    .from('surveys')
                    .select('id, title, status')
                    .eq('slug', slug)
                    .single()

                if (surveyError || !surveyData) {
                    throw new Error("Encuesta no encontrada.")
                }

                if (surveyData.status !== 'active') {
                    throw new Error("Esta encuesta no está activa.")
                }

                // 2. Fetch Questions
                const { data: questionsData, error: questionsError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('survey_id', surveyData.id)
                    .order('order', { ascending: true })

                if (questionsError) throw new Error("Error al cargar preguntas.")

                // 3. Map DB Questions to UI Questions
                const mappedQuestions: Question[] = (questionsData || []).map(q => {
                    const content = q.content as any

                    const uiQuestion: Question = {
                        id: q.id,
                        type: q.type as QuestionType,
                        text: content.question || "Pregunta sin texto", // Default text
                        required: q.is_required
                    }

                    if (['single_choice', 'multiple_choice', 'single_choice_image'].includes(q.type)) {
                        uiQuestion.options = (content.options || []).map((opt: any) => ({
                            id: opt.id,
                            label: opt.text || "",
                            imageUrl: opt.imageUrl,
                            description: opt.description
                        }))
                    }

                    if (q.type === 'slider_scale') {
                        uiQuestion.thermometerConfig = {
                            min: 1, // Default, update if added to DB content
                            max: 10,
                            step: 1
                        }
                    }

                    return uiQuestion
                })

                setSurvey({
                    id: surveyData.id,
                    title: surveyData.title,
                    questions: mappedQuestions
                })

            } catch (err: any) {
                console.error(err)
                setError(err.message || "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchSurvey()
        }
    }, [slug])


    const handleNext = async (answer: any) => {
        if (!survey) return

        const currentQuestion = survey.questions[currentQuestionIndex]
        const newAnswers = { ...answers, [currentQuestion.id]: answer }
        setAnswers(newAnswers)

        const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

        if (isLastQuestion) {
            await submitSurvey(newAnswers)
        } else {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const submitSurvey = async (finalAnswers: Record<string, any>) => {
        if (!survey) return
        setIsSubmitting(true)
        setError(null)

        try {
            // 1. Insert into survey_responses
            const { data: responseData, error: responseError } = await supabase
                .from('survey_responses')
                .insert({
                    survey_id: survey.id,
                    fingerprint_hash: visitorId,
                    ip_hash: "client-ip", // Placeholder
                    started_at: new Date().toISOString(), // Should ideally be tracked from start
                    completed_at: new Date().toISOString(),
                })
                .select()
                .single()

            if (responseError) throw new Error("Error al guardar respuesta: " + responseError.message)

            const responseId = responseData.id

            // 2. Insert Answers
            const answerInserts = Object.keys(finalAnswers).map(questionId => {
                const val = finalAnswers[questionId]
                // Handle array answers (multiple choice) by joining or storing as JSON? 
                // DB schema has `answer_value TEXT` and `answer_json JSONB`.
                // Schema usually has `answer_value TEXT` based on previous creation. 
                // Let's check schema if we can... actually we know it has answer_value TEXT usually.
                // For multiple choice, we likely want to store a comma separated string OR use a different field?
                // Let's assume TEXT stores JSON string if generic, or simple string.
                // Re-reading schema: `answer_value TEXT`. 
                // We will JSON.stringify array values.

                let valueToStore = val
                if (Array.isArray(val) || typeof val === 'object') {
                    valueToStore = JSON.stringify(val)
                } else {
                    valueToStore = String(val)
                }

                return {
                    response_id: responseId,
                    question_id: questionId, // DB ID
                    answer_value: valueToStore
                }
            })

            const { error: answersError } = await supabase
                .from('answers')
                .insert(answerInserts)

            if (answersError) throw new Error("Error al guardar detalles: " + answersError.message)

            setIsCompleted(true)

        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (error || !survey || survey.questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-gray-600">{error || "No hay preguntas disponibles en esta encuesta."}</p>
                </div>
            </div>
        )
    }

    const currentQuestion = survey.questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

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
            </main>
        </div>
    )
}

