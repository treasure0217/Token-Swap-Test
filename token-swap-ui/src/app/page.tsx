'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { erc20Abi, parseEther, zeroAddress } from 'viem'
import { sepolia } from 'viem/chains'
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi'
import { config } from '@/config/wagmi'
import TokenSwapContract from '@/contracts/TokenSwap.json'

const tokens = [
  { address: '0x924FC8aF51c27E3a7C3500846F2B015bCc5c00E2', symbol: 'Token1' },
  { address: '0x8803e1AEB5FC2aDA5B9f237F313f311fB36926cF', symbol: 'Token2' },
  { address: zeroAddress, symbol: 'ETH' },
]

export default function Home() {
  const [token1, setToken1] = useState<string>(tokens[0].address)
  const [token2, setToken2] = useState<string>(tokens[1].address)
  const [amount1, setAmount1] = useState<string>('')
  const [amount2, setAmount2] = useState<string>('')
  const [orderParam, setOrderParam] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const { open } = useWeb3Modal()
  const { address, isConnected, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const { data: allowance, refetch } = useReadContract({
    address: token1 as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, TokenSwapContract.address as `0x${string}`],
    query: {
      select: (result) => result as bigint,
    },
  })

  const needToApprove = useMemo(
    () =>
      token1 != zeroAddress && (allowance ?? BigInt(0)) < parseEther(amount1),
    [allowance, amount1, token1],
  )

  const handleApprove = useCallback(async () => {
    if (allowance == undefined) {
      return
    }

    startTransition(async () => {
      try {
        const hash = await writeContractAsync({
          address: token1 as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            TokenSwapContract.address as `0x${string}`,
            parseEther(amount1),
          ],
        })
        await waitForTransactionReceipt(config, { hash })
        await refetch()
      } catch (err: any) {
        window.alert(err.shortMessage)
      }
    })
  }, [allowance, amount1, refetch, token1, writeContractAsync])

  const handleConnectWallet = () => {
    if (!isConnected) {
      open()
    }
  }

  const handleCreateOrder = async () => {
    if (isNaN(+amount1) || isNaN(+amount2)) {
      window.alert('Please input correct amount')
    }

    startTransition(async () => {
      try {
        if (chain?.id !== sepolia.id) {
          await switchChainAsync({ chainId: sepolia.id })
        }

        const { request } = await simulateContract(config, {
          abi: TokenSwapContract.abi,
          address: TokenSwapContract.address as `0x${string}`,
          functionName: 'createOrder',
          args: [token1, parseEther(amount1), token2, parseEther(amount2)],
          value: token1 === zeroAddress ? parseEther(amount1) : undefined,
        })
        const hash = await writeContract(config, request)
        const result = await waitForTransactionReceipt(config, { hash })

        console.log(result)
      } catch (err: any) {
        console.log(err)
        window.alert(err.shortMessage)
      }
    })
  }

  return (
    <div className='flex h-screen w-full items-center justify-center backdrop-blur-sm'>
      <div className='w-full max-w-96 space-y-8 bg-gradient-radial from-blue-500 to-blue-500/50 p-2'>
        <div className='space-y-2'>
          <div className='grid grid-cols-2 gap-2'>
            <Link
              href={`https://sepolia.etherscan.io/address/0x924FC8aF51c27E3a7C3500846F2B015bCc5c00E2#writeContract#F2`}
              target='_blank'
              className='block'
            >
              <button className='h-8 w-full border border-black bg-white'>
                Get Token1
              </button>
            </Link>
            <Link
              href={`https://sepolia.etherscan.io/address/0x8803e1AEB5FC2aDA5B9f237F313f311fB36926cF#writeContract#F2`}
              target='_blank'
              className='block'
            >
              <button className='h-8 w-full border border-black bg-white'>
                Get Token2
              </button>
            </Link>
          </div>
          <div className='flex items-center gap-2 border border-black bg-gray-200 p-2'>
            <select
              className='rounded-sm border border-black p-1'
              onChange={(e) => setToken1(e.target.value)}
            >
              {tokens.map((token) => (
                <option value={token.address} key={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type='text'
              placeholder='Enter amount'
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
            />
          </div>
          <p></p>
          <div className='flex items-center gap-2 border border-black bg-gray-200 p-2'>
            <select
              className='rounded-sm border border-black p-1'
              onChange={(e) => setToken2(e.target.value)}
            >
              {tokens
                .filter((token) => token.address !== token1)
                .map((token) => (
                  <option value={token.address} key={token.address}>
                    {token.symbol}
                  </option>
                ))}
            </select>
            <input
              type='text'
              placeholder='Enter amount'
              value={amount2}
              onChange={(e) => setAmount2(e.target.value)}
            />
          </div>
          <button
            className='h-[50px] w-full border border-black bg-gray-200 disabled:cursor-not-allowed'
            disabled={isPending}
            onClick={() =>
              isConnected
                ? needToApprove
                  ? handleApprove()
                  : handleCreateOrder()
                : handleConnectWallet()
            }
          >
            {isConnected
              ? needToApprove
                ? 'Approve Token'
                : 'Create Order'
              : 'Connect Wallet'}
          </button>
        </div>
        <div className='space-y-2'>
          <input
            type='text'
            placeholder='Enter token or user address'
            className='w-full border border-black bg-gray-200 p-2'
            value={orderParam}
            onChange={(e) => setOrderParam(e.target.value)}
          />
          <Link
            href={`/orders/${orderParam || '0x'}`}
            className='block bg-gray-200'
          >
            <button className='h-[50px] w-full border border-black'>
              View Orders
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
