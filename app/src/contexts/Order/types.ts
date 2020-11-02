import { Web3Provider } from '@ethersproject/providers'
import { Operation } from '@/lib/constants'
import { BigNumberish } from 'ethers'

export interface OrderContextValues {
  item: OrderItem | NewOptionItem
  orderType: string
  onAddItem: (item: OrderItem | NewOptionItem, orderType: string) => void
  onChangeItem: (item: OrderItem, orderType: string) => void
  onRemoveItem: (item: OrderItem | NewOptionItem) => void
  submitOrder: (
    provider: Web3Provider,
    optionAddress: string,
    quantity: number,
    operation: Operation
  ) => Promise<void>
  createOption: (
    provider: Web3Provider,
    asset: string,
    isCallType: boolean,
    expiry: string,
    strike: number
  ) => Promise<void>
  mintTestTokens: (
    provider: Web3Provider,
    optionAddress: string,
    quantity: number
  ) => Promise<void>
  provideLiquidity: (
    provider: Web3Provider,
    optionAddress: string,
    min_l: number,
    max_tokens: number
  ) => Promise<void>
  withdrawLiquidity: (
    provider: Web3Provider,
    optionAddress: string,
    min_l: number,
    min_tokens: number
  ) => Promise<void>
}

export interface OrderItem {
  address: string
  breakEven: number
  change: number
  expiry: BigNumberish
  price: number
  strike: BigNumberish
  volume: number
  id: string
}

export interface NewOptionItem {
  expiry: number
  asset: string
  tokenAddress: string
}
export interface OrderState {
  item: OrderItem
  orderType?: string
}
