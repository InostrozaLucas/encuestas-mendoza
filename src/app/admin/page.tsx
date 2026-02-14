import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Edit, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { logoutAction } from './actions'

// Helper to fetch surveys
async function getSurveys() {
    const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching surveys:', error)
        return []
    }
    return data
}

export default async function AdminDashboard() {
    const surveys = await getSurveys()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Panel de Administración</h1>
                        <p className="text-slate-500 dark:text-slate-400">Gestiona tus encuestas políticas</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Client comp for Logout */}
                        <form action={logoutAction}>
                            <Button variant="outline">Cerrar Sesión</Button>
                        </form>
                        <Link href="/admin/surveys/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Encuesta
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Survey Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                        <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${survey.status === 'active'
                                        ? 'bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900'
                                        : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                                        }`}>
                                        {survey.status}
                                    </span>
                                    <Link href={`/encuesta/${survey.slug}`} target="_blank">
                                        <Button variant="ghost" size="icon" title="Ver encuesta pública">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                                <CardTitle className="line-clamp-1" title={survey.title}>{survey.title}</CardTitle>
                                <CardDescription>/{survey.slug}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Link href={`/admin/surveys/${survey.id}`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <Edit className="w-4 h-4 mr-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {surveys.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <p>No hay encuestas creadas aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
