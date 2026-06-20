'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const redirectTo = searchParams.get('next') ?? '/home'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) { toast.error(translateError(error.message)); return }

      // If Supabase auto-confirms the session (email confirmation disabled),
      // redirect immediately. Otherwise, show the "check your inbox" screen.
      if (data.session) {
        router.refresh()
        router.push(redirectTo)
      } else {
        setEmailSent(true)
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { toast.error(translateError(error.message)); return }

    // router.refresh() forces the middleware to re-evaluate with the new cookie.
    router.refresh()
    router.push(redirectTo)
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-8 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="font-semibold text-lg">Revisa tu bandeja de entrada</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos un enlace de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Button variant="outline" className="w-full mt-4" onClick={() => setEmailSent(false)}>
            Volver al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Clock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">TimeTracker</CardTitle>
        <CardDescription>
          {isSignUp ? 'Crea tu cuenta gratuita' : 'Inicia sesión en tu cuenta'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cargando...' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            type="button"
            className="text-primary underline underline-offset-2"
            onClick={() => setIsSignUp((v) => !v)}
          >
            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </CardContent>
    </Card>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate email')) return 'Formato de email inválido.'
  return msg
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
