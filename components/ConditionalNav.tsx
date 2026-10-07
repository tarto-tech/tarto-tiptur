'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNav() {
  const pathname = usePathname()
  // Homepage has its own header inside StoreFront
  if (pathname === '/') return null
  return <Navbar />
}
