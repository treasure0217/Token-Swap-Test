'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'

export default function Home() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const handleConnectWallet = () => {
    if (!isConnected) {
      open()
    } else {
      disconnect()
    }
  }

  return (
    <div>
      <button onClick={handleConnectWallet}>
        {isConnected ? address : 'Connect'}
      </button>
    </div>
  )
}
