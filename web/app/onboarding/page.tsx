'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepWelcome from './_components/StepWelcome'
import StepModules from './_components/StepModules'
import StepLeagues from './_components/StepLeagues'
import StepImport from './_components/StepImport'
import StepTelegram from './_components/StepTelegram'

const STEPS = ['Welcome', 'Strategies', 'Leagues', 'Spreadsheet', 'Telegram']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else complete()
  }

  async function complete() {
    await fetch('/api/user/complete-onboarding', { method: 'POST' })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
                 style={{ backgroundColor: i <= step ? 'var(--accent-green)' : 'var(--bg-elevated)' }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {STEPS[step]}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg rounded-lg border p-8"
           style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepModules onNext={next} />}
        {step === 2 && <StepLeagues onNext={next} />}
        {step === 3 && <StepImport onNext={next} />}
        {step === 4 && <StepTelegram onNext={complete} />}
      </div>
    </div>
  )
}
