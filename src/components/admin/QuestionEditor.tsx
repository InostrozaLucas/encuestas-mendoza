'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, Plus, GripVertical, ImageIcon } from 'lucide-react'

import { Question } from '@/types/admin'

type QuestionType = 'single_choice_image' | 'multiple_choice' | 'single_choice' | 'slider_scale' | 'boolean' | 'text'

// Assuming a Question type structure for initialData
// interface Question { ... } removed to use imported type

export default function QuestionEditor({ surveyId, initialData, onSaved, onCancel }: { surveyId: string, initialData?: Question, onSaved: () => void, onCancel: () => void }) {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<QuestionType>((initialData?.type as QuestionType) || 'multiple_choice')
    const [questionText, setQuestionText] = useState(initialData?.content?.question || '')

    // Initialize options safely
    const [options, setOptions] = useState<{ id: string, text: string, imageUrl?: string }[]>(
        initialData?.content?.options || [
            { id: '1', text: '' },
            { id: '2', text: '' }
        ]
    )
    const [required, setRequired] = useState(initialData?.is_required ?? true)

    // Options handling
    const addOption = () => {
        setOptions([...options, { id: Math.random().toString(36).substr(2, 9), text: '' }])
    }

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index))
    }

    const updateOptionText = (index: number, text: string) => {
        const newOptions = [...options]
        newOptions[index].text = text
        setOptions(newOptions)
    }

    const handleImageUpload = async (index: number, file: File) => {
        setLoading(true)
        const url = await uploadImage(file)
        if (url) {
            const newOptions = [...options]
            newOptions[index].imageUrl = url
            setOptions(newOptions)
        } else {
            alert('Error uploading image')
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Construct content JSON based on type
        let content: any = { question: questionText }

        if (['multiple_choice', 'single_choice', 'single_choice_image'].includes(type)) {
            content.options = options
        } else if (type === 'slider_scale') {
            content.minLabel = initialData?.content?.minLabel || 'Muy Negativa' // Default or add inputs for these
            content.maxLabel = initialData?.content?.maxLabel || 'Muy Positiva'
        }

        try {
            if (initialData) {
                // UPDATE
                const { error } = await supabase
                    .from('questions')
                    .update({
                        type,
                        content,
                        is_required: required
                    })
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                // INSERT
                // Get current max order
                const { data: maxOrderData } = await supabase
                    .from('questions')
                    .select('order')
                    .eq('survey_id', surveyId)
                    .order('order', { ascending: false })
                    .limit(1)

                const nextOrder = (maxOrderData?.[0]?.order || 0) + 1

                const { error } = await supabase.from('questions').insert({
                    survey_id: surveyId,
                    type,
                    content,
                    order: nextOrder,
                    is_required: required
                })
                if (error) throw error
            }

            onSaved()
        } catch (error) {
            console.error(error)
            alert('Error saving question')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-2 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle>{initialData ? 'Editar Pregunta' : 'Nueva Pregunta'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <Label>Tipo de Pregunta</Label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                            value={type}
                            onChange={(e) => setType(e.target.value as QuestionType)}
                            disabled={!!initialData} // Prevent type change on edit to avoid data loss issues for now
                        >
                            <option value="single_choice">Opción Única (Radio)</option>
                            <option value="multiple_choice">Opción Múltiple (Checkboxes)</option>
                            <option value="single_choice_image">Candidatos (Con Imágen)</option>
                            <option value="slider_scale">Escala (Termómetro)</option>
                            <option value="boolean">Sí / No</option>
                            <option value="text">Texto Libre</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Texto de la Pregunta</Label>
                        <Input
                            value={questionText}
                            onChange={e => setQuestionText(e.target.value)}
                            placeholder="¿Por quién votaría usted?"
                            required
                        />
                    </div>

                    {/* Options Logic */}
                    {['multiple_choice', 'single_choice', 'single_choice_image'].includes(type) && (
                        <div className="space-y-3">
                            <Label>Opciones</Label>
                            {options.map((opt, idx) => (
                                <div key={opt.id} className="flex gap-2 items-start">
                                    <div className="grid gap-2 flex-1">
                                        <Input
                                            value={opt.text}
                                            onChange={e => updateOptionText(idx, e.target.value)}
                                            placeholder={`Opción ${idx + 1}`}
                                            required
                                        />

                                        {type === 'single_choice_image' && (
                                            <div className="flex items-center gap-2">
                                                {opt.imageUrl ? (
                                                    <div className="relative w-12 h-12 rounded overflow-hidden border">
                                                        <img src={opt.imageUrl} alt="preview" className="object-cover w-full h-full" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <Input
                                                    type="file"
                                                    className="text-xs h-9"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Opción
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Pregunta'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

