import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import cx from 'classnames'
import { cookieToInitialState } from 'wagmi'
import { config } from '@/config/wagmi'
import Web3ModalProvider from '@/contexts/wagmi'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Token Swap',
  description: 'Token swap test task',
  openGraph: {
    title: 'Token Swap',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Token Swap',
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
      <body
        className={cx(
          inter.className,
          'bg-gradient-radial from-blue-500/50 to-transparent',
        )}
      >
        <Web3ModalProvider initialState={initialState}>
          {children}
        </Web3ModalProvider>
      </body>
    </html>
  )
}
