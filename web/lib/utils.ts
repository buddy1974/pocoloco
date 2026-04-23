import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEdge(edge: string | number | null): string {
  if (edge === null || edge === undefined) return '—'
  const n = typeof edge === 'string' ? parseFloat(edge) : edge
  return `${(n * 100).toFixed(1)}%`
}

export function formatProb(prob: string | number | null): string {
  if (prob === null || prob === undefined) return '—'
  const n = typeof prob === 'string' ? parseFloat(prob) : prob
  return `${(n * 100).toFixed(0)}%`
}

export function confidenceColor(confidence: string): string {
  switch (confidence) {
    case 'HIGH': return 'text-[#00e676] border-[#00e676]'
    case 'MEDIUM': return 'text-[#fbbf24] border-[#fbbf24]'
    case 'LOW': return 'text-[#6b7280] border-[#6b7280]'
    case 'PASS': return 'text-[#374151] border-[#374151]'
    default: return 'text-[#6b7280] border-[#6b7280]'
  }
}
