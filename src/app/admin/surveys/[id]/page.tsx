'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronLeft, Plus, Save, Trash2, BarChart3, Settings, List } from 'lucide-react'
import Link from 'next/link'
import QuestionsList from '@/components/admin/QuestionsList'
import QuestionEditor from '@/components/admin/QuestionEditor'
import SurveyResults from '@/components/admin/SurveyResults'
import { Question } from '@/types/admin'

type Tab = 'questions' | 'results' | 'config'

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)

    const [survey, setSurvey] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showQuestionEditor, setShowQuestionEditor] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined)
    const [refreshQuestionsKey, setRefreshQuestionsKey] = useState(0)
    const [activeTab, setActiveTab] = useState<Tab>('questions')

    useEffect(() => {
        async function fetchSurvey() {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error(error)
                router.push('/admin')
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
            <div className="max-w-5xl mx-auto space-y-8">

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
                                <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold transition-colors dark:border-slate-800 dark:text-slate-50">
                                    {survey.status}
                                </span>
                                <span className="text-sm text-slate-500">/{survey.slug}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDeleteSurvey}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Encuesta
                    </Button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'questions'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        Preguntas
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'results'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Resultados
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Configuración
                    </button>
                </div>

                {/* ── Tab: Questions ── */}
                {activeTab === 'questions' && (
                    <div className="space-y-6">
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
                )}

                {/* ── Tab: Results ── */}
                {activeTab === 'results' && (
                    <SurveyResults surveyId={id} />
                )}

                {/* ── Tab: Config ── */}
                {activeTab === 'config' && (
                    <div className="max-w-lg">
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
                )}
            </div>
        </div>
    )
}


