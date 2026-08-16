'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        console.error(error.message)
        return
    }
    router.push('/')
}

  return (
    <main className="flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-6 sm:p-8 shadow-lg">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">Log in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            Log in
          </button>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  )
}