import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { config } from '@/config/wagmi'
import Web3ModalProvider from '@/contexts/wagmi'
import '@/styles/globals.css'

export const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Token Swap',
  description: 'Token swap test task',
  openGraph: {
    title: 'Kitty AI',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kitty AI',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialState = cookieToInitialState(config, headers().get('cookie'))

  return (
    <html lang='en'>
      <body className={inter.className}>
        <Web3ModalProvider initialState={initialState}>
          {children}
        </Web3ModalProvider>
      </body>
    </html>
  )
}
