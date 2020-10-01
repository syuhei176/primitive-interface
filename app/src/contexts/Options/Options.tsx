import React, { useCallback, useReducer } from 'react'
import ethers from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import {
  Fetcher,
  Pair,
  Token,
  TokenAmount,
  Trade,
  TradeType,
  Route,
} from '@uniswap/sdk'

import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'

import { useWeb3React } from '@web3-react/core'

import OptionsContext from './context'
import optionsReducer, { initialState, setOptions } from './reducer'
import { EmptyAttributes, OptionsAttributes } from './types'

import OptionDeployments from './options_deployments.json'
import AssetAddresses from './assets.json'

const Options: React.FC = (props) => {
  const [state, dispatch] = useReducer(optionsReducer, initialState)

  // Web3 injection
  const { library, chainId } = useWeb3React()
  const provider = library

  /**
   * @dev Calculates the breakeven asset price depending on if the option is a call or put.
   * @param strike The strike price of the option.
   * @param price The current price of the option.
   * @param isCall If the option is a call, if not a call, its a put.
   */
  const calculateBreakeven = (strike, price, isCall) => {
    let breakeven
    if (isCall) {
      breakeven = price + strike
    } else {
      breakeven = price + strike
    }
    return Number(breakeven)
  }

  /**
   * @dev Gets the execution price for 1 unit of option tokens and returns it.
   * @param optionAddress The address of the option token to get a uniswap pair of.
   */
  const getPairData = useCallback(async (provider, optionAddress) => {
    let premium = 0

    // Check to make sure we are connected to a web3 provider.
    if (!provider) {
      console.error('No connected connectedProvider')
      return { premium }
    }
    const signer = await provider.getSigner()
    const chain = await signer.getChainId()
    const stablecoinAddress = '0xb05cB19b19e09c4c7b72EA929C8CfA3187900Ad2'

    const OPTION = new Token(chain, optionAddress, 18)
    const STABLECOIN = new Token(chain, stablecoinAddress, 18)

    // Fetcher currently calls default provider, which leads to post errors.
    //const pair = await Fetcher.fetchPairData(STABLECOIN, OPTION)

    const tokenA = STABLECOIN
    const tokenB = OPTION
    const address = Pair.getAddress(tokenA, tokenB)
    const [reserves0, reserves1] = await new ethers.Contract(
      address,
      IUniswapV2Pair.abi,
      provider
    ).getReserves()
    const balances = tokenA.sortsBefore(tokenB)
      ? [reserves0, reserves1]
      : [reserves1, reserves0]
    const pair = new Pair(
      new TokenAmount(tokenA, balances[0]),
      new TokenAmount(tokenB, balances[1])
    )

    const route = new Route([pair], STABLECOIN, OPTION)
    const midPrice = Number(route.midPrice.toSignificant(6))

    const unit = parseEther('1').toString()
    const tokenAmount = new TokenAmount(OPTION, unit)
    const trade = new Trade(route, tokenAmount, TradeType.EXACT_OUTPUT)

    const executionPrice = Number(trade.executionPrice.toSignificant(6))

    premium = executionPrice > midPrice ? executionPrice : midPrice
    return { premium }
  }, [])

  const handleOptions = useCallback(
    async (assetName) => {
      // Asset address and quantity of options
      let assetAddress = AssetAddresses[assetName][chainId]
      let optionsLength = Object.keys(OptionDeployments).length

      // Objects and arrays to populate
      let optionsObject = {
        calls: [EmptyAttributes],
        puts: [EmptyAttributes],
      }
      let calls: OptionsAttributes[] = []
      let puts: OptionsAttributes[] = []

      // For each option in the option deployments file...
      for (let i = 0; i < optionsLength; i++) {
        // Get the parameters for the option object in the option_deployments json file.
        let key = Object.keys(OptionDeployments)[i]
        let id = key
        let parameters = OptionDeployments[key].optionParameters
        let address = OptionDeployments[key].address
        let underlyingToken = parameters[0]
        let strikeToken = parameters[1]
        let base = parameters[2]
        let quote = parameters[3]
        let expiry = parameters[4]

        // If the selected asset is not one of the assets in the option, skip it.
        if (assetAddress !== underlyingToken && assetAddress !== strikeToken) {
          return
        }

        // Initialize the values we need to grab.
        let breakEven = 0
        let change = 0
        let price = 0
        let strike = 0
        let volume = 0
        let isCall

        // Get the option price data from uniswap pair.
        const { premium } = await getPairData(provider, address)
        price = premium
        /* price = 1 */

        // If the base is 1, push to calls array. If quote is 1, push to puts array.
        // If a call, set the strike to the quote. If a put, set the strike to the base.
        let arrayToPushTo: OptionsAttributes[] = []
        if (base === '1') {
          isCall = true
          strike = Number(quote)
          arrayToPushTo = calls
        }
        if (quote === '1') {
          isCall = false
          strike = Number(base)
          arrayToPushTo = puts
        }

        breakEven = calculateBreakeven(strike, price, isCall)

        // Push the option object with the parsed data to the options call or puts array.
        arrayToPushTo.push({
          breakEven: breakEven,
          change: change,
          price: price,
          strike: strike,
          volume: volume,
          address: address,
          id: id,
          expiry: expiry,
        })
      }

      // Get the final options object and dispatch it to set its state for the hook.
      Object.assign(optionsObject, {
        calls: calls,
        puts: puts,
      })
      dispatch(setOptions(optionsObject))
    },
    [dispatch, provider, chainId, getPairData]
  )

  return (
    <OptionsContext.Provider
      value={{
        options: state.options,
        getOptions: handleOptions,
      }}
    >
      {props.children}
    </OptionsContext.Provider>
  )
}

export default Options