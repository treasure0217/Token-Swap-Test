'use client'

import { useEffect, useState, useTransition } from 'react'
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { erc20Abi, formatEther, parseEther, zeroAddress } from 'viem'
import { sepolia } from 'viem/chains'
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi'
import { API_URL } from '@/config/env'
import { config } from '@/config/wagmi'
import TokenSwapContract from '@/contracts/TokenSwap.json'
import { shortenAddress } from '@/helpers/shortenAddress'

interface Props {
  params: { query: string }
}

export default function Orders({ params: { query } }: Props) {
  const [orders, setOrders] = useState<Record<string, any>[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPending, startTransition] = useTransition()
  const { open } = useWeb3Modal()
  const { address, isConnected, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  useEffect(() => {
    setIsLoading(true)
    fetchOrders(query).then(() => setIsLoading(false))
  }, [query])

  const fetchOrders = async (query: string) => {
    const response = await fetch(
      `${API_URL}/api?offset=0&limit=100&query=${query}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Accept: 'application/json',
        },
      },
    )
    const { orders } = await response.json()
    setOrders(orders)
  }

  const handleFillOrder = async (order: Record<string, any>) => {
    if (!isConnected) {
      open()
      return
    }

    startTransition(async () => {
      try {
        if (chain?.id !== sepolia.id) {
          await switchChainAsync({ chainId: sepolia.id })
        }

        const amount = window.prompt('Please input amount to fill')

        if (!amount) return

        const amountInBigint = parseEther(amount)

        if (amountInBigint > BigInt(order.amountB)) {
          window.alert('invalid amount')
          return
        }

        if (order.tokenB !== zeroAddress) {
          const allowance = await readContract(config, {
            address: order.tokenB as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address!, TokenSwapContract.address as `0x${string}`],
          })

          if ((allowance ?? BigInt(0)) < amountInBigint) {
            const hash = await writeContractAsync({
              address: order.tokenB as `0x${string}`,
              abi: erc20Abi,
              functionName: 'approve',
              args: [
                TokenSwapContract.address as `0x${string}`,
                amountInBigint,
              ],
            })
            await waitForTransactionReceipt(config, { hash })
          }
        }

        const hash = await writeContractAsync({
          address: TokenSwapContract.address as `0x${string}`,
          abi: TokenSwapContract.abi,
          functionName: 'fillOrder',
          args: [order.id, amountInBigint],
        })
        await waitForTransactionReceipt(config, { hash })
        fetchOrders(query)
      } catch (err: any) {
        console.log(err)
        window.alert(err.shortMessage)
      }
    })
  }

  const handleCancelOrder = async (order: Record<string, any>) => {
    if (!isConnected) {
      open()
      return
    }

    startTransition(async () => {
      try {
        if (chain?.id !== sepolia.id) {
          await switchChainAsync({ chainId: sepolia.id })
        }

        const hash = await writeContractAsync({
          address: TokenSwapContract.address as `0x${string}`,
          abi: TokenSwapContract.abi,
          functionName: 'cancelOrder',
          args: [order.id],
        })
        await waitForTransactionReceipt(config, { hash })
        fetchOrders(query)
      } catch (err: any) {
        console.log(err)
        window.alert(err.shortMessage)
      }
    })
  }

  return (
    <div className='h-screen p-12'>
      {isLoading ? (
        'Fetching orders...'
      ) : orders.length === 0 ? (
        'No matching orders found'
      ) : (
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Status</th>
              <th>Seller</th>
              <th>Token - A</th>
              <th>Amount - A</th>
              <th>Token - B</th>
              <th>Amount - B</th>
              <th>Create At</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: Record<string, any>) => (
              <tr key={order.id}>
                <td>{shortenAddress(order.id)}</td>
                <td>{order.status}</td>
                <td>{shortenAddress(order.seller)}</td>
                <td>{shortenAddress(order.tokenA)}</td>
                <td>{formatEther(order.amountA)}</td>
                <td>{shortenAddress(order.tokenB)}</td>
                <td>{formatEther(order.amountB)}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  {order.status === 'Active' && (
                    <button
                      className='underline disabled:cursor-not-allowed'
                      disabled={isPending}
                      onClick={() => handleFillOrder(order)}
                    >
                      Fill Order
                    </button>
                  )}
                </td>
                <td>
                  {order.status === 'Active' && (
                    <button
                      className='underline disabled:cursor-not-allowed'
                      disabled={isPending}
                      onClick={() => handleCancelOrder(order)}
                    >
                      Cancel Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
