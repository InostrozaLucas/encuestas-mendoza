"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Thermometer } from "@/components/survey/Thermometer"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Activity, Users, FileText, TrendingUp, UserCheck } from "lucide-react"

// Mock Data
const CAMPAIGN_DATA = [
    { name: "Candidato A", votes: 450, fill: "#3b82f6" },
    { name: "Candidato B", votes: 320, fill: "#ef4444" },
    { name: "Candidato C", votes: 210, fill: "#10b981" },
    { name: "NS/NC", votes: 120, fill: "#9ca3af" },
]

const REGION_DATA = [
    { name: "Norte", mobile: 400, desktop: 240 },
    { name: "Sur", mobile: 300, desktop: 139 },
    { name: "Este", mobile: 200, desktop: 980 },
    { name: "Oeste", mobile: 278, desktop: 390 },
]

export default function AdminDashboard() {
    const [managementScore, setManagementScore] = React.useState<number | null>(7)

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Sidebar (Mock) */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-10">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Political Insight
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium">
                        <Activity className="w-5 h-5" />
                        Dashboard
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer">
                        <FileText className="w-5 h-5" />
                        Encuestas
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer">
                        <Users className="w-5 h-5" />
                        Panelistas
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard General</h2>
                        <p className="text-gray-500 mt-1">Visión general del rendimiento de encuestas activas.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium">
                            Última actualización: Hace 5 min
                        </div>
                    </div>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Respuestas Totales</CardTitle>
                            <FileText className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12,450</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +180 hoy
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Encuestas Activas</CardTitle>
                            <Activity className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-gray-500 mt-1">2 en borrador</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Tasa de Completitud</CardTitle>
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">87.5%</div>
                            <p className="text-xs text-green-600 mt-1">+2.1% esta semana</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Usuarios Únicos</CardTitle>
                            <UserCheck className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">10,230</div>
                            <p className="text-xs text-gray-500 mt-1">Dispositivos verificados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Main Chart */}
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Intención de Voto (Consolidado)</CardTitle>
                            <CardDescription>Resultados agregados de la última encuesta nacional.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={CAMPAIGN_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                                            {CAMPAIGN_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thermometer / KPI Widget */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Termómetro de Gestión</CardTitle>
                            <CardDescription>Aprobación promedio del gobierno.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center pt-8">
                            <div className="relative w-full max-w-[200px] aspect-square flex items-center justify-center mb-8">
                                {/* Radial/Gauge placeholder or simple centered score */}
                                <div className="text-6xl font-black text-gray-900">
                                    {managementScore === null ? '?' : managementScore}<span className="text-2xl text-gray-400 font-medium">/10</span>
                                </div>
                            </div>

                            <div className="w-full px-4">
                                <Thermometer
                                    value={managementScore}
                                    onValueChange={setManagementScore}
                                    minLabel="Desaprobación"
                                    maxLabel="Aprobación"
                                />
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Deslice para simular cambios en el índice de aprobación.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity / Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente por Región</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={REGION_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="mobile" stackId="a" fill="#3b82f6" name="Móvil" />
                                    <Bar dataKey="desktop" stackId="a" fill="#e2e8f0" name="Escritorio" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
