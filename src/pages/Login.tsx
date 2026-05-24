import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useUiStore } from '../store/useUiStore'

type AuthMode = 'login' | 'signup'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured) {
      // Demo mode: bypass auth
      navigate('/')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('✅ Cek email kamu untuk konfirmasi pendaftaran!')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      // Translate common errors to Bahasa Indonesia
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau password salah.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek inbox kamu.')
      } else if (msg.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan login.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!configured) {
      navigate('/')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Google redirect will handle navigation
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--m3-primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--m3-tertiary) 0%, transparent 70%)' }}
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container transition-colors"
        aria-label="Toggle Theme"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {theme === 'dark' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history_edu
            </span>
            <h1
              className="text-display-md font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--m3-primary), var(--m3-tertiary))' }}
            >
              VibeNovel
            </h1>
          </div>
          <p className="text-on-surface-variant text-body-sm">
            Platform AI untuk Penulis Novel KBM Indonesia
          </p>
        </div>

        {/* Demo mode notice */}
        {!configured && (
          <div className="mb-4 p-3 rounded-xl bg-secondary-container/30 border border-secondary-container text-on-surface-variant text-body-sm text-center">
            <span className="material-symbols-outlined text-[16px] align-middle mr-1">info</span>
            Mode Demo — Konfigurasi Supabase untuk menyimpan data
          </div>
        )}

        {/* Form card */}
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          {/* Tab: Login / Signup */}
          <div className="flex bg-surface-container-high rounded-2xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={`flex-1 py-2 rounded-xl text-label-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-container/30 border border-error/30 text-on-error-container text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-secondary-container/30 border border-secondary-container text-on-surface text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0">check_circle</span>
              {success}
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-body-md font-medium hover:bg-surface-container-highest transition-all mb-4 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="text-label-md text-on-surface-variant">atau</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-2">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-2xl py-3 px-4 text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-outline"
              />
            </div>
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-2xl py-3 px-4 text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-outline"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-on-primary font-semibold py-3 px-6 rounded-2xl text-body-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  Memproses...
                </>
              ) : mode === 'login' ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Masuk
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Daftar Sekarang
                </>
              )}
            </button>

            {!configured && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 rounded-2xl text-body-md text-on-surface-variant hover:text-on-surface border border-outline-variant/30 hover:bg-surface-container-high transition-all"
              >
                Coba Demo (tanpa login)
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-label-md text-on-surface-variant mt-6">
          Dengan masuk, kamu setuju dengan{' '}
          <button className="text-primary underline underline-offset-2 hover:opacity-80">
            Ketentuan Layanan
          </button>{' '}
          kami.
        </p>
      </div>
    </div>
  )
}
