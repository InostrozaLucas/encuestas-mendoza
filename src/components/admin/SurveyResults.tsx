'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getStorageUrl } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, BarChart3, HelpCircle, TrendingUp, AlertCircle } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuestionData {
    id: string
    type: string
    content: any
    order: number
}

interface AnswerRow {
    question_id: string
    answer_value: any
}

interface QuestionResult {
    question: QuestionData
    answers: AnswerRow[]
}

// ─── Color Palette ───────────────────────────────────────────────────────────

const CHART_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SurveyResults({ surveyId }: { surveyId: string }) {
    const [results, setResults] = useState<QuestionResult[]>([])
    const [totalResponses, setTotalResponses] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchResults() {
            try {
                // 1. Get total completed responses
                const { count: responseCount, error: countError } = await supabase
                    .from('survey_responses')
                    .select('*', { count: 'exact', head: true })
                    .eq('survey_id', surveyId)
                    .not('completed_at', 'is', null)

                if (countError) throw countError
                setTotalResponses(responseCount || 0)

                // 2. Get all questions for this survey
                const { data: questions, error: qError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('survey_id', surveyId)
                    .order('order', { ascending: true })

                if (qError) throw qError
                if (!questions || questions.length === 0) {
                    setResults([])
                    setLoading(false)
                    return
                }

                const questionIds = questions.map(q => q.id)

                // 3. Get all answers for these questions
                const { data: answers, error: aError } = await supabase
                    .from('answers')
                    .select('question_id, answer_value')
                    .in('question_id', questionIds)

                if (aError) throw aError

                // 4. Group answers by question
                const answersByQuestion: Record<string, AnswerRow[]> = {}
                for (const a of (answers || [])) {
                    if (!answersByQuestion[a.question_id]) {
                        answersByQuestion[a.question_id] = []
                    }
                    answersByQuestion[a.question_id].push(a)
                }

                // 5. Build results
                const builtResults: QuestionResult[] = questions.map(q => ({
                    question: q as QuestionData,
                    answers: answersByQuestion[q.id] || []
                }))

                setResults(builtResults)
            } catch (err: any) {
                console.error('Error loading results:', err)
                setError(err.message || 'Error al cargar resultados')
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [surveyId])

    // ─── Loading / Error / Empty states ──────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-500">Cargando resultados...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (totalResponses === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600">Sin respuestas todavía</h3>
                    <p className="text-sm text-slate-400 mt-1">Los resultados aparecerán aquí una vez que se reciban respuestas.</p>
                </CardContent>
            </Card>
        )
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Summary KPI */}
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-full p-3">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/80">Total de Respuestas</p>
                            <p className="text-3xl font-bold">{totalResponses}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Per-question results */}
            {results.map((result, index) => (
                <QuestionResultCard
                    key={result.question.id}
                    result={result}
                    questionNumber={index + 1}
                    totalResponses={totalResponses}
                />
            ))}
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Question Result Card — renders the right visualization based on question type
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionResultCard({ result, questionNumber, totalResponses }: {
    result: QuestionResult
    questionNumber: number
    totalResponses: number
}) {
    const { question, answers } = result
    const content = question.content as any
    const questionText = content?.question || `Pregunta ${questionNumber}`

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Pregunta {questionNumber} · {getTypeLabel(question.type)}
                </CardDescription>
                <CardTitle className="text-lg">{questionText}</CardTitle>
                <p className="text-sm text-slate-500">{answers.length} respuestas</p>
            </CardHeader>
            <CardContent>
                {['single_choice', 'single_choice_image', 'multiple_choice'].includes(question.type) && (
                    <ChoiceResults question={question} answers={answers} />
                )}
                {question.type === 'slider_scale' && (
                    <SliderResults question={question} answers={answers} />
                )}
                {question.type === 'boolean' && (
                    <BooleanResults answers={answers} />
                )}
                {question.type === 'text' && (
                    <TextResults answers={answers} />
                )}
            </CardContent>
        </Card>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Choice Results (single_choice, single_choice_image, multiple_choice)
// ═══════════════════════════════════════════════════════════════════════════════

function ChoiceResults({ question, answers }: { question: QuestionData, answers: AnswerRow[] }) {
    const content = question.content as any
    const options: { id: string, text: string, imageUrl?: string }[] = content?.options || []

    // Count votes per option
    const voteCounts: Record<string, number> = {}
    options.forEach(o => { voteCounts[o.id] = 0 })

    for (const a of answers) {
        const val = typeof a.answer_value === 'string' ? a.answer_value : String(a.answer_value)

        // For multiple_choice, answer_value could be a JSON array string
        if (question.type === 'multiple_choice') {
            try {
                const parsed = JSON.parse(val)
                if (Array.isArray(parsed)) {
                    parsed.forEach(v => {
                        if (voteCounts[v] !== undefined) voteCounts[v]++
                        else voteCounts[String(v)] !== undefined && voteCounts[String(v)]++
                    })
                    continue
                }
            } catch { /* not JSON, treat as single value */ }
        }

        // Single choice
        if (voteCounts[val] !== undefined) {
            voteCounts[val]++
        }
    }

    const totalVotes = Object.values(voteCounts).reduce((sum, c) => sum + c, 0)

    const chartData = options.map(opt => ({
        name: opt.text || opt.id,
        votes: voteCounts[opt.id] || 0,
        percentage: totalVotes > 0 ? Math.round(((voteCounts[opt.id] || 0) / totalVotes) * 100) : 0,
        imageUrl: opt.imageUrl
    }))

    // Sort by votes descending
    chartData.sort((a, b) => b.votes - a.votes)

    return (
        <div className="space-y-4">
            {/* Bar Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tickFormatter={(v) => `${v}`} fontSize={12} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={120}
                            fontSize={12}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(value) => [`${value} votos`, 'Votos']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="votes" radius={[0, 6, 6, 0]} barSize={28}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Progress Bars */}
            <div className="space-y-3 pt-2">
                {chartData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                        {/* Optional candidate image */}
                        {question.type === 'single_choice_image' && item.imageUrl && (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0">
                                <img
                                    src={getStorageUrl(item.imageUrl) || '/placeholder.png'}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900 ml-2 flex-shrink-0">
                                    {item.percentage}% <span className="text-xs font-normal text-slate-400">({item.votes})</span>
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Slider Results (slider_scale / thermometer)
// ═══════════════════════════════════════════════════════════════════════════════

function SliderResults({ question, answers }: { question: QuestionData, answers: AnswerRow[] }) {
    const content = question.content as any
    const minLabel = content?.minLabel || 'Muy Mala'
    const maxLabel = content?.maxLabel || 'Muy Buena'
    const imageUrl = content?.imageUrl

    // Separate numeric answers from DK
    const numericValues: number[] = []
    let dkCount = 0

    for (const a of answers) {
        const val = typeof a.answer_value === 'string' ? a.answer_value : String(a.answer_value)
        if (val === 'DK' || val === 'null' || val === '') {
            dkCount++
        } else {
            const num = parseFloat(val)
            if (!isNaN(num)) numericValues.push(num)
        }
    }

    const totalAnswers = answers.length
    const average = numericValues.length > 0
        ? (numericValues.reduce((s, v) => s + v, 0) / numericValues.length)
        : 0
    const dkPercentage = totalAnswers > 0 ? Math.round((dkCount / totalAnswers) * 100) : 0

    // Distribution for histogram (1-10)
    const distribution: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) distribution[i] = 0
    numericValues.forEach(v => {
        const rounded = Math.round(v)
        if (rounded >= 1 && rounded <= 10) distribution[rounded]++
    })

    const histogramData = Object.entries(distribution).map(([score, count]) => ({
        score: Number(score),
        count,
    }))

    // Color based on average (1=red, 5=yellow, 10=green)
    const getAverageColor = (avg: number) => {
        if (avg <= 3) return '#ef4444'
        if (avg <= 5) return '#f59e0b'
        if (avg <= 7) return '#22c55e'
        return '#16a34a'
    }

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                {/* Average Score */}
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                    {imageUrl && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 mx-auto mb-2">
                            <img
                                src={getStorageUrl(imageUrl) || ''}
                                alt="ref"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Promedio</p>
                    <p className="text-4xl font-black" style={{ color: getAverageColor(average) }}>
                        {average.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">de 10</p>
                </div>

                {/* Respondents */}
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Evaluaron</p>
                    <p className="text-4xl font-black text-indigo-600">{numericValues.length}</p>
                    <p className="text-xs text-slate-400 mt-1">personas</p>
                </div>

                {/* DK */}
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">No Conoce</p>
                    <p className="text-4xl font-black text-amber-500">{dkPercentage}%</p>
                    <p className="text-xs text-slate-400 mt-1">({dkCount} de {totalAnswers})</p>
                </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>

            {/* Histogram */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="score" fontSize={12} tickLine={false} />
                        <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            formatter={(value) => [`${value} respuestas`, 'Cantidad']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                            {histogramData.map((entry) => {
                                const color = entry.score <= 3 ? '#ef4444'
                                    : entry.score <= 5 ? '#f59e0b'
                                        : entry.score <= 7 ? '#22c55e'
                                            : '#16a34a'
                                return <Cell key={entry.score} fill={color} />
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Boolean Results (Si / No)
// ═══════════════════════════════════════════════════════════════════════════════

function BooleanResults({ answers }: { answers: AnswerRow[] }) {
    let yesCount = 0
    let noCount = 0

    for (const a of answers) {
        const val = typeof a.answer_value === 'string' ? a.answer_value.toLowerCase() : String(a.answer_value).toLowerCase()
        if (val === 'true' || val === 'sí' || val === 'si' || val === 'yes') yesCount++
        else noCount++
    }

    const total = yesCount + noCount
    const yesPercent = total > 0 ? Math.round((yesCount / total) * 100) : 0
    const noPercent = total > 0 ? Math.round((noCount / total) * 100) : 0

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="w-10 text-right text-sm font-semibold text-green-600">Sí</span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${yesPercent}%` }}
                    />
                </div>
                <span className="w-20 text-sm font-bold">{yesPercent}% ({yesCount})</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="w-10 text-right text-sm font-semibold text-red-500">No</span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${noPercent}%` }}
                    />
                </div>
                <span className="w-20 text-sm font-bold">{noPercent}% ({noCount})</span>
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Text Results — shows individual text responses
// ═══════════════════════════════════════════════════════════════════════════════

function TextResults({ answers }: { answers: AnswerRow[] }) {
    const texts = answers.map(a =>
        typeof a.answer_value === 'string' ? a.answer_value : String(a.answer_value)
    ).filter(t => t && t !== 'null')

    if (texts.length === 0) {
        return <p className="text-sm text-slate-400 italic">Sin respuestas de texto.</p>
    }

    return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
            {texts.map((text, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border text-sm text-slate-700">
                    "{text}"
                </div>
            ))}
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        single_choice: 'Opción Única',
        single_choice_image: 'Candidatos',
        multiple_choice: 'Opción Múltiple',
        slider_scale: 'Termómetro',
        boolean: 'Sí / No',
        text: 'Texto Libre'
    }
    return labels[type] || type
}
