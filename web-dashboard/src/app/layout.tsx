import type { Metadata } from 'next'
import './globals.css'
import '../styles/design-system.css'

export const metadata: Metadata = {
  title: 'Yellow Claude Orchestra',
  description: 'マルチエージェント開発システム - Producer-Director-Actor モデル',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}