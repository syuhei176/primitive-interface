import { BigNumberish } from 'ethers'
import { Token } from './token'
import { Asset } from './asset'
import { Quantity } from './quantity'
import ethers from 'ethers'
import OptionArtifact from '@primitivefi/contracts/artifacts/Option.json'

export interface OptionParameters {
  base: Quantity
  quote: Quantity
  expiry: number
}

export const EMPTY_ASSET: Asset = new Asset(18)
export const EMPTY_QUANTITY: Quantity = new Quantity(EMPTY_ASSET, '')
export const EMPTY_OPTION_PARAMETERS: OptionParameters = {
  base: EMPTY_QUANTITY,
  quote: EMPTY_QUANTITY,
  expiry: 0,
}

export const createOptionEntityWithAddress = (
  chainId: number,
  optionAddress: string
) => {
  return new Option(
    EMPTY_OPTION_PARAMETERS,
    chainId,
    optionAddress,
    18,
    'Primitive V1 Option',
    'PRM'
  )
}

/**
 * Represents a Primitive V1 Option.
 */
export class Option extends Token {
  public readonly optionParameters: OptionParameters
  public assetAddresses: string[]
  public constructor(
    optionParameters: OptionParameters,
    chainId: number,
    address: string,
    decimals: number,
    name?: string,
    symbol?: string
  ) {
    super(chainId, address, decimals, name, symbol)
    this.optionParameters = optionParameters
  }

  public setAssetAddresses(assets) {
    this.assetAddresses = assets
  }

  public optionInstance(signer): ethers.Contract {
    return new ethers.Contract(this.address, OptionArtifact.abi, signer)
  }

  public get underlying(): Asset {
    return this.optionParameters.base.asset
  }

  public get strike(): Asset {
    return this.optionParameters.quote.asset
  }

  public get base(): Quantity {
    return this.optionParameters.base
  }

  public get quote(): Quantity {
    return this.optionParameters.quote
  }

  public get expiry(): number {
    return this.optionParameters.expiry
  }

  public get strikePrice(): Quantity {
    let baseValue = this.optionParameters.base.quantity
    let quoteValue = this.optionParameters.quote.quantity
    let strikePrice: Quantity
    if (baseValue === '1') {
      strikePrice = this.optionParameters.quote
    } else if (quoteValue === '1') {
      strikePrice = this.optionParameters.base
    } else {
      let numerator = ethers.BigNumber.from(
        this.optionParameters.quote.quantity
      )
      let denominator = ethers.BigNumber.from(
        this.optionParameters.base.quantity
      )
      strikePrice = new Quantity(
        this.optionParameters.quote.asset,
        numerator.div(denominator)
      )
    }
    return strikePrice
  }

  public get isCall(): boolean {
    let baseValue = this.optionParameters.base.quantity
    let isCall: boolean = false
    if (baseValue === '1') {
      isCall = true
    }
    return isCall
  }

  public get isPut(): boolean {
    let quoteValue = this.optionParameters.quote.quantity
    let isPut: boolean = false
    if (quoteValue === '1') {
      isPut = true
    }
    return isPut
  }

  public getTimeToExpiry(): number {
    const expiry: number = this.optionParameters.expiry
    const now: number = new Date().valueOf()
    let timeLeft: number = expiry - now
    return timeLeft
  }
}
