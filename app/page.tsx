import { getCurrentUser } from '@/lib/auth'
import { ensureDemoMode } from '@/lib/demo/mode'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Briefcase, CheckSquare, Shield, ArrowRight } from 'lucide-react'
import DemoButton from '@/components/demo-button'

export default async function HomePage() {
  const user = await getCurrentUser()
  const demoMode = await ensureDemoMode()

  if (user?.profile?.team_id) {
    redirect('/dashboard')
  } else if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b px-6 py-3 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <Image src="/image.png" alt="Team Management Platform" width={32} height={32} />
          </div>
          <span className="text-lg font-semibold">TeamHub</span>
        </div>
        <div className="flex items-center gap-3">
          <DemoButton />
          {!demoMode && (
            <>
              <Link
                href="/auth/login"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/auth/create-team"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create a Team
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Built for modern teams
        </div>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Manage your team,
          <br />
          <span className="text-muted-foreground">without the clutter</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Organize departments, track employees, assign tasks, and monitor progress — all from a single dashboard.
        </p>
        {demoMode ? (
          <div className="mt-10 flex flex-col items-center gap-4">
            <DemoButton hero />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              No signup needed — explore the full app instantly
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/create-team"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create a Team
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-6 text-sm font-medium hover:bg-accent transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-6 text-sm font-medium hover:bg-accent transition-colors"
            >
              Login
            </Link>
          </div>
        )}
        {!demoMode && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <DemoButton className="h-10 rounded-lg" />
          </div>
        )}
      </section>

      <section className="shrink-0 border-t bg-muted/30 px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
            Everything you need
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users, title: 'Employees', desc: 'Manage team members across departments.' },
              { icon: Briefcase, title: 'Departments', desc: 'Create departments and assign managers.' },
              { icon: CheckSquare, title: 'Task Tracking', desc: 'Track tasks with priorities and deadlines.' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Admin, manager, and employee roles.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="shrink-0 border-t px-6 py-3 text-center text-xs text-muted-foreground">
        Team Management System
      </footer>
    </div>
  )
}
