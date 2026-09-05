import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Label } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/authApi'
import { toast } from '../../store/uiStore'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const pendingMobile = useAuthStore((s) => s.pendingMobile)
  const accountType = useAuthStore((s) => s.accountType)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Landing here without a number in flight (refresh, deep link) — bounce back
  // declaratively rather than navigating during render.
  if (!pendingMobile) return <Navigate to="/login" replace />

  const submitOtp = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await authApi.verifyOtp(otp)
    setSubmitting(false)
    if (!result.success) {
      setError(result.message)
      return
    }
    if (result.isNewUser) {
      navigate('/select-account-type')
    } else {
      toast.success('Welcome back to PaperCraft.')
      navigate(accountType === 'school' ? '/school' : '/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">PaperCraft</h1>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          <form onSubmit={submitOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change number
            </button>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gold-500" /> Verify OTP
              </h2>
              <p className="text-sm text-ink-400 mt-0.5">Enter the code sent to +91 {pendingMobile}.</p>
            </div>
            <div>
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                className="tracking-[0.5em] text-center text-lg font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-ink-400">Demo mode — use <span className="font-mono font-semibold">1234</span>. Try <span className="font-mono font-semibold">9876543210</span> as the mobile number to sign in as an existing teacher.</p>
            </div>
            {error && <p className="text-sm text-pen-red">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting || otp.length < 4}>
              {submitting ? 'Verifying…' : 'Verify & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
