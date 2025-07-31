import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Axtar Get - AI Söhbət",
  description: "Güclü AI köməkçi sistemi ilə sizə dəqiq məlumatlar təqdim edir",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
