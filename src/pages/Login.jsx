import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { authApi } from '../services/authApi'
import { toast } from '../store/uiStore'

export default function Login() {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidMobile = /^[6-9]\d{9}$/.test(mobile)

  const submitMobile = async (e) => {
    e.preventDefault()
    if (!isValidMobile) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setError('')
    setSubmitting(true)
    await authApi.login(mobile)
    setSubmitting(false)
    toast.success(`OTP sent to +91 ${mobile}.`)
    navigate('/verify-otp')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">PaperCraft</h1>
          <p className="mt-1 text-sm text-ink-400">Question papers, done in minutes.</p>
        </Link>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          <form onSubmit={submitMobile} className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Log in or sign up</h2>
              <p className="text-sm text-ink-400 mt-0.5">Enter your mobile number to continue.</p>
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
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-sm text-pen-red">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Sending OTP…' : 'Send OTP'}
            </Button>
            <p className="text-center text-xs text-ink-400">
              New here? We'll set up your account right after OTP verification.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
