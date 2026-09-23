import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartContext'
import Navbar from '@/components/Navbar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tarto — Fresh Delivery in Tiptur',
  description: 'Order fresh eggs, milk, bread and more. Fast local delivery in Tiptur, Karnataka.',
  metadataBase: new URL('https://tarto.in'),
  openGraph: {
    title: 'Tarto — Fresh Delivery in Tiptur',
    description: 'Order fresh eggs, milk, bread and more. Fast local delivery in Tiptur.',
    url: 'https://tarto.in',
    siteName: 'Tarto',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-[#FAFAF8] text-[#1A1A1A] antialiased`}>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  )
}
