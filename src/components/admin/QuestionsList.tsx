'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Trash2, ArrowUp, ArrowDown, Edit } from 'lucide-react'

import { Question } from '@/types/admin'

export default function QuestionsList({ surveyId, onEdit }: { surveyId: string, onEdit: (q: Question) => void }) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)

    // Expose refresh function or re-fetch on simple state change
    const fetchQuestions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('survey_id', surveyId)
            .order('order', { ascending: true })

        if (!error && data) {
            setQuestions(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchQuestions()
    }, [surveyId])

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return
        await supabase.from('questions').delete().eq('id', id)
        fetchQuestions()
    }

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === questions.length - 1) return

        const newQuestions = [...questions]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const temp = newQuestions[index]
        newQuestions[index] = newQuestions[targetIndex]
        newQuestions[targetIndex] = temp

        // Update local UI first
        setQuestions(newQuestions)

        // Then update DB order
        for (let i = 0; i < newQuestions.length; i++) {
            await supabase.from('questions').update({ order: i }).eq('id', newQuestions[i].id)
        }
    }

    // Expose a ref or simple prop to trigger reload? 
    // For now we will rely on parent triggering or this component handling the initial load only, 
    // but the parent 'page' needs to tell this list to refresh when a new question is added.
    // I can listen to supabase subscription or just expose a refresh method if I lift state up.
    // Simplest: This component handles LISTING. The parent handles "New Question" mode closure and tells this list to refresh.
    // Let's make this component just receive questions or fetch them?
    // I will export a Refresh Context? No.
    // I will attach key={refreshTrigger} in parent.

    if (loading && questions.length === 0) return <div>Cargando preguntas...</div>

    if (questions.length === 0) return <div className="text-center py-8 text-slate-500">No hay preguntas en esta encuesta.</div>

    return (
        <div className="space-y-4">
            {questions.map((q, idx) => (
                <Card key={q.id} className="relative group">
                    <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center cursor-pointer" onClick={() => onEdit(q)}>
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    {idx + 1}
                                </span>
                                <div>
                                    <div className="font-medium hover:underline">{q.content.question}</div>
                                    <div className="text-xs text-slate-500 uppercase">{q.type.replace('_', ' ')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => handleMove(idx, 'up')} disabled={idx === 0}>
                                    <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleMove(idx, 'down')} disabled={idx === questions.length - 1}>
                                    <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(q)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
