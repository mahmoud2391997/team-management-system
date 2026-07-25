import Link from 'next/link'
import Image from 'next/image'
import DemoButton from '@/components/demo-button'

export default function AuthNavbar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b px-6 py-3 lg:px-12">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <Image src="/image.png" alt="Team Management Platform" width={32} height={32} />
        </div>
        <span className="text-lg font-semibold">TeamHub</span>
      </Link>
      <div className="flex items-center gap-3">
        <DemoButton />
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
      </div>
    </header>
  )
}
