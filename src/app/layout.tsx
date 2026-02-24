import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Yardım Takip Otomasyonu',
  description: 'Yardım takip ve kişi yönetim sistemi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} antialiased bg-white font-sans`}>
        <AuthProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen bg-white px-8 py-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
