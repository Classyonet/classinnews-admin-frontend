import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { Toasts } from '@/components/ui/toasts'

const inter = Inter({ subsets: ['latin'] })

const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'

async function getBrandingSettings() {
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/settings/branding`, {
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      return data.data
    }
  } catch (error) {
    console.error('Failed to fetch branding:', error)
  }
  return { site_favicon_url: '' }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandingSettings()
  
  const metadata: Metadata = {
    title: 'ClassinNews Admin',
    description: 'Admin dashboard for ClassinNews platform',
  }
  
  if (branding.site_favicon_url) {
    const faviconUrl = branding.site_favicon_url.startsWith('http') 
      ? branding.site_favicon_url 
      : `${ADMIN_API_URL}${branding.site_favicon_url}`
    metadata.icons = {
      icon: faviconUrl,
      shortcut: faviconUrl,
    }
  }
  
  return metadata
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  )
}
