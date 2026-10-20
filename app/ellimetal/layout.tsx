import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ellimetal · Positioneringssurvey',
  description: 'Strategische positioneringssurvey voor Ellimetal',
}

export default function EllimetalLayout({ children }: { children: React.ReactNode }) {
  return children
}
