import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logoutAction } from './actions'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')
    const isLoginPage = false // We can't easily detect path in layout server component without headers, 
    // but layout wraps pages. 
    // Actually, login page should logically NOT use this layout if this layout ENFORCES auth.
    // Better app structure: 
    // /admin/layout.tsx (Enforces Auth)
    // /admin/login/page.tsx (Public) -> Should NOT be under /admin layout? 
    // In Next.js App Router, /admin/login is child of /admin/layout.

    // WORKAROUND: We check if we are already in the login flow? 
    // No, easiest is to move login out or handle it.
    // BUT, let's just check the cookie. 

    // Wait, if I put this check in /admin/layout.tsx, it will run for /admin/login too, creating a redirect loop if not careful.
    // Strategy: 
    // 1. Move login to /login-admin? No, user asked for /admin.
    // 2. Use Route Groups (admin)/layout.tsx and (auth)/login/page.tsx? 
    // 3. Just check if the route segment is 'login' - hard in Server Layout.

    // ALTERNATIVE:
    // Let the Middleware handle protection? Start with simple Check.
    // If I access /admin/login, this layout runs.

    // Let's rely on the fact that we can't easily exclude 1 route from a layout in the same folder.
    // Refactor:
    // src/app/(admin)/admin/layout.tsx -> Protected
    // src/app/(admin)/admin/page.tsx
    // src/app/admin-login/page.tsx -> Public

    // OR keep it simple:
    // make /admin/layout.tsx render children if no session BUT verify in the PAGEs? No, repetitive.

    // Best approach for single "admin" folder:
    // Middleware is best. 
    // BUT user asked for simple "password in env var".

    // Let's do this:
    // /app/admin/layout.tsx will only provide UI (navbar).
    // /app/admin/page.tsx will check auth.
    // /app/admin/surveys/page.tsx will check auth.

    // OR better:
    // Create a separate component <AdminGuard> that checks cookies?

    // Simpler: 
    // I will move the "Layout" logic to a wrapper component or just use the layout for UI and check session in each page? 
    // No, that's error prone.

    // I will use Route Groups to separate the layout:
    // src/app/admin/(authenticated)/layout.tsx -> Checks auth, renders Sidebar.
    // src/app/admin/(authenticated)/page.tsx -> Dashboard
    // src/app/admin/login/page.tsx -> Login (No auth check)

    // But moving files around might be confusing. 
    // I'll stick to: /app/admin/layout.tsx checks session. 
    // IF session is missing AND we are not on login page... content is hidden?
    // We can't know the URL easily in Server Layout. 

    // OK, I will implement a Middleware for /admin. Use `src/middleware.ts`.

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {children}
        </div>
    )
}
