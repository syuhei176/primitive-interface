import { useCallback, useEffect, useState } from 'react'
import { formatEther } from 'ethers/lib/utils'

import { useWeb3React } from '@web3-react/core'

import { getBalance } from '../lib/erc20'

const useTokenBalance = (tokenAddress: string) => {
  const [balance, setBalance] = useState('0')
  const { account, library } = useWeb3React()

  const fetchBalance = useCallback(async () => {
    const balance = await getBalance(library, tokenAddress, account)
    console.log('Balance', balance.toString(), formatEther(balance).toString())
    setBalance(formatEther(balance).toString())
  }, [account, library, tokenAddress])

  useEffect(() => {
    if (account && library) {
      fetchBalance()
      let refreshInterval = setInterval(fetchBalance, 10000)
      return () => clearInterval(refreshInterval)
    }
  }, [account, library, setBalance, tokenAddress])

  return balance
}

export default useTokenBalance