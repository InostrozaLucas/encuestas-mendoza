'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type LoginState = {
    error?: string
    success?: boolean
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const password = formData.get('password') as string
    const adminPassword = process.env.ADMIN_PASSWORD

    if (password === adminPassword) {
        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })
        // We cannot return here if we redirect, but nextjs redirects throw errors, so it is fine.
        // However, for type safety, let's keep it clean.
    } else {
        return { error: 'Contraseña incorrecta', success: false }
    }

    redirect('/admin')
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    redirect('/admin/login')
}
