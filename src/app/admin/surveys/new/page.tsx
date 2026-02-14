'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewSurveyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const slug = formData.get('slug') as string
        const description = formData.get('description') as string

        try {
            const { data, error: insertError } = await supabase
                .from('surveys')
                .insert([{
                    title,
                    slug,
                    description,
                    status: 'draft',
                    config: {}
                }])
                .select()
                .single()

            if (insertError) throw insertError

            router.push(`/admin/surveys/${data.id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Error al crear la encuesta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Nueva Encuesta</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalles Generales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" name="title" placeholder="Ej: Encuesta Presidencial 2026" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input id="slug" name="slug" placeholder="ej: presidenciales-2026" required pattern="^[a-z0-9-]+$" title="Solo letras minúsculas, números y guiones" />
                                <p className="text-xs text-slate-500">La encuesta será accesible en /encuesta/tu-slug</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Textarea id="description" name="description" placeholder="Breve descripción..." />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creando...' : 'Crear Encuesta'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
