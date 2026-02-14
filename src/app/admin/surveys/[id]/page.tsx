'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import QuestionsList from '@/components/admin/QuestionsList'
import QuestionEditor from '@/components/admin/QuestionEditor'
import { Question } from '@/types/admin'

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    // params is a Promise in Next.js 15+ for async components, but inside client components we use `use` hook or await it in server wrapper.
    // Actually, for client components in Next 15, params is a Promise prop. 
    // Let's use `use()` hook if available (React 19) or just wait. 
    // The user environment has React 19.2.3.
    const { id } = use(params)

    const [survey, setSurvey] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showQuestionEditor, setShowQuestionEditor] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined)
    const [refreshQuestionsKey, setRefreshQuestionsKey] = useState(0)

    useEffect(() => {
        async function fetchSurvey() {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error(error)
                router.push('/admin') // Redirect if not found
                return
            }
            setSurvey(data)
            setLoading(false)
        }
        fetchSurvey()
    }, [id, router])

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Status update logic if needed
        // const status = e.currentTarget.status.value 

        const { error } = await supabase
            .from('surveys')
            .update({
                title: survey.title,
                slug: survey.slug,
                description: survey.description,
                status: survey.status
            })
            .eq('id', id)

        if (error) {
            alert('Error updating survey')
        } else {
            // Optional: Show success toast
        }
        setSaving(false)
    }

    const handleDeleteSurvey = async () => {
        if (!confirm('¿Estás seguro de ELIMINAR esta encuesta y todas sus respuestas? Esta acción no se puede deshacer.')) return

        const { error } = await supabase.from('surveys').delete().eq('id', id)
        if (error) {
            alert('Error eliminando encuesta')
        } else {
            router.push('/admin')
        }
    }

    if (loading) return <div className="p-8">Cargando...</div>
    if (!survey) return <div className="p-8">Encuesta no encontrada</div>

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{survey.title}</h1>
                            <div className="flex items-center gap-2">
                                <Badge>{survey.status}</Badge>
                                <span className="text-sm text-slate-500">/{survey.slug}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDeleteSurvey}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Encuesta
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Config */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateSurvey} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Título</Label>
                                        <Input
                                            value={survey.title}
                                            onChange={e => setSurvey({ ...survey, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug (URL)</Label>
                                        <Input
                                            value={survey.slug}
                                            onChange={e => setSurvey({ ...survey, slug: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                            value={survey.status}
                                            onChange={e => setSurvey({ ...survey, status: e.target.value })}
                                        >
                                            <option value="draft">Borrador</option>
                                            <option value="active">Activa</option>
                                            <option value="closed">Cerrada</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descripción</Label>
                                        <Textarea
                                            value={survey.description || ''}
                                            onChange={e => setSurvey({ ...survey, description: e.target.value })}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Questions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Preguntas</h2>
                            {!showQuestionEditor && (
                                <Button onClick={() => {
                                    setEditingQuestion(undefined)
                                    setShowQuestionEditor(true)
                                }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Pregunta
                                </Button>
                            )}
                        </div>

                        {showQuestionEditor && (
                            <QuestionEditor
                                surveyId={id}
                                initialData={editingQuestion}
                                onSaved={() => {
                                    setShowQuestionEditor(false)
                                    setEditingQuestion(undefined)
                                    setRefreshQuestionsKey(k => k + 1)
                                }}
                                onCancel={() => {
                                    setShowQuestionEditor(false)
                                    setEditingQuestion(undefined)
                                }}
                            />
                        )}

                        <QuestionsList
                            surveyId={id}
                            key={refreshQuestionsKey}
                            onEdit={(q) => {
                                setEditingQuestion(q)
                                setShowQuestionEditor(true)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
