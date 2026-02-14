'use client'

import { useActionState } from 'react'
import { loginAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LockKeyhole } from 'lucide-react'

const initialState = {
    error: '',
}

export default function AdminLogin() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-slate-100 dark:bg-slate-800 p-3 rounded-full w-fit">
                        <LockKeyhole className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
                    <CardDescription>
                        Political Insight
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="text-lg"
                            />
                        </div>

                        {state?.error && (
                            <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Verificando...' : 'Ingresar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
