import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { useAppStore } from '../store/useAppStore'

export default function Login() {
  const navigate = useNavigate()
  const requestOtp = useAppStore((s) => s.requestOtp)
  const verifyOtp = useAppStore((s) => s.verifyOtp)

  const [step, setStep] = useState('mobile') // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const isValidMobile = /^[6-9]\d{9}$/.test(mobile)

  const submitMobile = (e) => {
    e.preventDefault()
    if (!isValidMobile) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setError('')
    requestOtp(mobile)
    setStep('otp')
  }

  const submitOtp = (e) => {
    e.preventDefault()
    const result = verifyOtp(otp)
    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">PaperCraft</h1>
          <p className="mt-1 text-sm text-ink-400">Question Paper Builder for Teachers</p>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          {step === 'mobile' ? (
            <form onSubmit={submitMobile} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Teacher Login</h2>
                <p className="text-sm text-ink-400 mt-0.5">Log in with your mobile number.</p>
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="flex gap-2">
                  <span className="flex h-10 w-14 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">+91</span>
                  <Input
                    id="mobile"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-pen-red">{error}</p>}
              <Button type="submit" className="w-full" size="lg">Send OTP</Button>
              <p className="text-center text-xs text-ink-400">
                New teacher? Registration uses the same mobile + OTP flow.
              </p>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('mobile'); setOtp(''); setError('') }}
                className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change number
              </button>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gold-500" /> Verify OTP
                </h2>
                <p className="text-sm text-ink-400 mt-0.5">Enter the code sent to +91 {mobile}.</p>
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
                />
                <p className="mt-1.5 text-xs text-ink-400">Demo mode — use <span className="font-mono font-semibold">1234</span>.</p>
              </div>
              {error && <p className="text-sm text-pen-red">{error}</p>}
              <Button type="submit" className="w-full" size="lg">Verify &amp; Continue</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
