import type { Metadata } from 'next'
import './globals.css'
import ThemeInitializer from '@/components/ThemeInitializer'

export const metadata: Metadata = {
  title: 'ForgeLab - Online Værktøjer',
  description: 'Et samlet værktøjssuite med forskellige online værktøjer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  )
}
