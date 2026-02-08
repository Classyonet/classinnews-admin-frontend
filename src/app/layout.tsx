import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { Toasts } from '@/components/ui/toasts'
import { DynamicFavicon } from '@/components/dynamic-favicon'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClassinNews Admin',
  description: 'Admin dashboard for ClassinNews platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <DynamicFavicon />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  )
}
