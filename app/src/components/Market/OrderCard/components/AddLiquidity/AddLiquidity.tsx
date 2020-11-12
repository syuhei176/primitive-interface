import React, { useState, useCallback } from 'react'

import { useWeb3React } from '@web3-react/core'
import Box from '@/components/Box'
import Input from '@/components/Input'
import LineItem from '@/components/LineItem'
import Label from '@/components/Label'
import PriceInput from '@/components/PriceInput'
import Spacer from '@/components/Spacer'
import { BigNumberish } from 'ethers'
import { useReserves } from '@/hooks/data'
import { Token, TokenAmount } from '@uniswap/sdk'
import {
  useItem,
  useUpdateItem,
  useHandleSubmitOrder,
  useRemoveItem,
} from '@/state/order/hooks'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import styled from 'styled-components'
import { Trade } from '@/lib/entities/trade'

import formatBalance from '@/utils/formatBalance'
import useTokenBalance from '@/hooks/useTokenBalance'
import useTokenTotalSupply from '@/hooks/useTokenTotalSupply'
import { BigNumber } from 'ethers'
import { parseEther, formatEther } from 'ethers/lib/utils'
import IconButton from '@/components/IconButton'
import Tooltip from '@/components/Tooltip'
import Button from '@/components/Button'

export interface AddLiquidityProps {}

const AddLiquidity: React.FC<AddLiquidityProps> = () => {
  const submitOrder = useHandleSubmitOrder()
  const removeItem = useRemoveItem()
  const [advanced, setAdvanced] = useState(false)
  const [submitting, setSubmit] = useState(false)
  const { item, orderType } = useItem()
  const [inputs, setInputs] = useState({
    primary: '',
    secondary: '',
  })
  const { library, chainId } = useWeb3React()
  const entity = item.entity
  const lpPair = useReserves(
    new Token(
      entity.chainId,
      entity.assetAddresses[0],
      18,
      item.asset.toUpperCase()
    ),
    new Token(entity.chainId, entity.assetAddresses[2], 18, 'SHORT')
  ).data
  const hasLiquidity = lpPair
    ? lpPair.reserve0.greaterThan('0')
      ? true
      : false
    : false
  const lpToken = lpPair ? lpPair.liquidityToken.address : ''
  const token0 = lpPair ? lpPair.token0.symbol : ''
  const token1 = lpPair ? lpPair.token1.symbol : ''
  const tokenBalance = useTokenBalance(lpToken)
  const lp = useTokenBalance(lpToken)
  const lpTotalSupply = useTokenTotalSupply(lpToken)

  const handleInputChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setInputs({ ...inputs, [e.currentTarget.name]: e.currentTarget.value })
    },
    [setInputs, inputs]
  )

  const handleSetMax = () => {
    const max =
      Math.round((+tokenBalance / +item.premium + Number.EPSILON) * 100) / 100
    setInputs({ ...inputs, primary: max.toString() })
  }

  const handleSubmitClick = useCallback(() => {
    setSubmit(true)
    submitOrder(
      library,
      item?.address,
      Number(inputs.primary),
      orderType,
      Number(inputs.secondary)
    )
    removeItem()
  }, [submitOrder, removeItem, item, library, inputs, orderType])

  const calculateToken0PerToken1 = useCallback(() => {
    if (typeof lpPair === 'undefined' || lpPair === null) return '0'
    const ratio = lpPair.token0Price.raw.toSignificant(2)
    return ratio
  }, [lpPair])

  const calculateToken1PerToken0 = useCallback(() => {
    if (typeof lpPair === 'undefined') return '0'
    const ratio = lpPair.token1Price.raw.toSignificant(2)
    return ratio
  }, [lpPair])

  const caculatePoolShare = useCallback(() => {
    if (typeof lpPair === 'undefined') return '0'
    const poolShare = BigNumber.from(parseEther(lpTotalSupply)).gt(0)
      ? BigNumber.from(parseEther(lp))
          .mul(parseEther('1'))
          .div(parseEther(lpTotalSupply))
      : '0'
    return (Number(formatEther(poolShare)) * 100).toFixed(2)
  }, [lpPair, lp, lpTotalSupply])

  const calculateOutput = useCallback(() => {
    if (typeof lpPair === 'undefined') return '0'
    const reservesA = lpPair.reserveOf(
      new Token(chainId, item.entity.assetAddresses[2], 18)
    )
    const reservesB = lpPair.reserveOf(
      new Token(chainId, item.entity.assetAddresses[0], 18)
    )
    const input = inputs.primary !== '' ? parseEther(inputs.primary) : '0'
    const inputShort = BigNumber.from(input) // pair has short tokens, so need to convert our desired options to short options
      .mul(item.entity.optionParameters.quote.quantity)
      .div(item.entity.optionParameters.base.quantity)
    const quote = Trade.getQuote(
      inputShort,
      reservesA.raw.toString(),
      reservesB.raw.toString()
    )
    const sum = +quote + +input
    return formatEther(sum.toString())
  }, [lpPair, lp, lpTotalSupply, inputs])

  const calculateLiquidityValuePerShare = useCallback(() => {
    if (typeof lpPair === 'undefined')
      return {
        shortPerLp: '0',
        underlyingPerLp: '0',
        totalUnderlyingPerLp: '0',
      }
    const SHORT: Token =
      lpPair.token0.address === item.entity.assetAddresses[2]
        ? lpPair.token0
        : lpPair.token1
    const UNDERLYING: Token =
      lpPair.token1.address === item.entity.assetAddresses[2]
        ? lpPair.token0
        : lpPair.token1

    const shortValue = lpPair.getLiquidityValue(
      SHORT,
      new TokenAmount(
        lpPair.liquidityToken,
        parseEther(lpTotalSupply).toString()
      ),
      new TokenAmount(lpPair.liquidityToken, parseEther('1').toString())
    )

    const underlyingValue = lpPair.getLiquidityValue(
      UNDERLYING,
      new TokenAmount(
        lpPair.liquidityToken,
        parseEther(lpTotalSupply).toString()
      ),
      new TokenAmount(lpPair.liquidityToken, parseEther('1').toString())
    )

    const shortPerLp = shortValue ? formatEther(shortValue.raw.toString()) : '0'
    const underlyingPerLp = underlyingValue
      ? formatEther(underlyingValue.raw.toString())
      : '0'
    const totalUnderlyingPerLp = formatEther(
      BigNumber.from(shortValue.raw.toString())
        .mul(item.entity.optionParameters.base.quantity)
        .div(item.entity.optionParameters.quote.quantity)
        .add(underlyingValue.raw.toString())
    )

    return { shortPerLp, underlyingPerLp, totalUnderlyingPerLp }
  }, [lpPair, lp, lpTotalSupply, inputs])

  const title = {
    text: 'Add Liquidity',
    tip:
      'Underlying tokens are used to mint short tokens, which are provided as liquidity to the pair, along with additional underlying tokens',
  }

  const noLiquidityTitle = {
    text: 'This pair has no liquidity.',
    tip:
      'Providing liquidity to this pair will set the ratio between the tokens.',
  }

  return (
    <>
      <StyledTitle>
        <Tooltip text={title.tip}>{title.text}</Tooltip>
      </StyledTitle>
      <Spacer />
      {hasLiquidity ? (
        <PriceInput
          name="primary"
          title={`Options Input`}
          quantity={inputs.primary}
          onChange={handleInputChange}
          onClick={handleSetMax}
        />
      ) : (
        <>
          <StyledSubtitle>
            <Tooltip text={noLiquidityTitle.tip}>
              {noLiquidityTitle.text}
            </Tooltip>
          </StyledSubtitle>
          <Spacer />
          <PriceInput
            name="primary"
            title={`Options Input`}
            quantity={inputs.primary}
            onChange={handleInputChange}
            onClick={handleSetMax}
          />
          <Spacer />
          <StyledText>Per</StyledText>
          <Spacer />
          <PriceInput
            name="secondary"
            title={`Underlyings Input`}
            quantity={inputs.secondary}
            onChange={handleInputChange}
            onClick={handleSetMax}
          />{' '}
        </>
      )}

      <Spacer />
      <LineItem
        label="This requires"
        data={`${calculateOutput()}`}
        units={`${item.asset.toUpperCase()}`}
      />
      <Spacer />
      <LineItem
        label="You will receive"
        data={caculatePoolShare()}
        units={`% of the Pool.`}
      />
      <Spacer />
      <IconButton
        text="Advanced"
        variant="transparent"
        onClick={() => setAdvanced(!advanced)}
      >
        <ExpandMoreIcon />
      </IconButton>
      <Spacer />

      {advanced ? (
        <>
          <Spacer size="sm" />
          <LineItem
            label="Short per LP token"
            data={`${calculateLiquidityValuePerShare().shortPerLp}`}
          />
          <Spacer size="sm" />
          <LineItem
            label="Underlying per LP Token"
            data={`${calculateLiquidityValuePerShare().underlyingPerLp}`}
          />
          <Spacer size="sm" />
          <LineItem
            label={`Total ${item.asset.toUpperCase()} per LP Token`}
            data={`${calculateLiquidityValuePerShare().totalUnderlyingPerLp}`}
          />
          <Spacer size="sm" />
          <LineItem
            label={`${token0} per ${token1}`}
            data={calculateToken0PerToken1()}
          />
          <Spacer size="sm" />
          <LineItem
            label={`${token1} per ${token0}`}
            data={calculateToken1PerToken0()}
          />
          <Spacer size="sm" />
          <LineItem
            label={`Your Share % of Pool`}
            data={caculatePoolShare()}
            units={`%`}
          />
          <Spacer size="sm" />
        </>
      ) : (
        <> </>
      )}
      <Button
        disabled={!inputs || submitting}
        full
        size="sm"
        onClick={handleSubmitClick}
        isLoading={submitting}
        text="Review Transaction"
      />
    </>
  )
}

const StyledText = styled.h5`
  color: ${(props) => props.theme.color.white};
  display: flex;
  font-size: 16px;
  font-weight: 500;
  margin: ${(props) => props.theme.spacing[2]}px;
`
const StyledTitle = styled.h5`
  color: ${(props) => props.theme.color.white};
  font-size: 18px;
  font-weight: 700;
  margin: ${(props) => props.theme.spacing[2]}px;
`
const StyledSubtitle = styled.h5`
  color: ${(props) => props.theme.color.white};
  font-size: 16px;
  font-weight: 500;
  margin: ${(props) => props.theme.spacing[2]}px;
`

export default AddLiquidity
