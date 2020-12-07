import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useItem, useUpdateItem, useRemoveItem } from '@/state/order/hooks'
import { useOptions } from '@/state/options/hooks'
import ClearIcon from '@material-ui/icons/Clear'
import SettingsIcon from '@material-ui/icons/Settings'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore'

import Button from '@/components/Button'
import Spacer from '@/components/Spacer'
import ErrorBoundary from '@/components/ErrorBoundary'

import Box from '@/components/Box'
import Card from '@/components/Card'
import CardContent from '@/components/CardContent'
import CardTitle from '@/components/CardTitle'
import Submit from './components/Submit'
import OrderOptions from './components/OrderOptions'
import ManageOptions from './components/ManageOptions'
import formatBalance from '@/utils/formatBalance'
import formatExpiry from '@/utils/formatExpiry'
import { Operation } from '@/constants/index'
import { EmptyAttributes } from '@/state/options/reducer'
import numeral from 'numeral'

export interface OrderContentProps {
  manage: boolean
}

const OrderContent: React.FC<OrderContentProps> = ({ manage }) => {
  const { orderType } = useItem()

  if (orderType !== Operation.NONE) {
    return <Submit orderType={orderType} />
  }
  if (orderType === Operation.NONE) {
    return <>{manage ? <ManageOptions /> : <OrderOptions />} </>
  }
}

export interface OrderProps {
  orderState: any
}

const OrderCard: React.FC<OrderProps> = ({ orderState }) => {
  const [manage, setManage] = useState(false)
  const { item } = useItem()
  const removeItem = useRemoveItem()
  const updateItem = useUpdateItem()
  const options = useOptions()
  const router = useRouter()
  useEffect(() => {
    if (!options.loading) {
      if (orderState[1] && orderState[2] && orderState[3]) {
        const opts = options.calls.concat(options.puts)
        opts.map(async (opt) => {
          if (opt.address === orderState[2]) {
            // force ts compiler
            const id: string = orderState[3]
            updateItem(opt, Operation[id])
          }
        })
      }
      setTimeout(() => {
        router.push(
          `/markets/[...id]`,
          `/markets/${options.calls[0].asset.toLowerCase()}/${
            orderState[1] === 'puts' ? 'puts' : 'calls'
          }`,
          {
            shallow: true,
          }
        )
      }, 1000)
    }
  }, [orderState, updateItem, options])
  if (!item.expiry) {
    return null
  }
  const { date, month, year } = formatExpiry(item.expiry)
  const clear = () => {
    removeItem()
  }
  return (
    <>
      <Card border dark>
        <Box row justifyContent="space-between" alignItems="center">
          <Spacer size="sm" />
          <Spacer size="sm" />
          <StyledTitle>
            {`${item.asset} ${item.entity.isCall ? 'Call' : 'Put'}`}
            {` ${numeral(formatBalance(item.strike)).format(
              '$0.00a'
            )} ${month}/${date}/${year}`}
          </StyledTitle>
          <CustomButton>
            <Button
              variant="transparent"
              size="sm"
              onClick={() => {
                updateItem(item, Operation.NONE)
                setManage(!manage)
              }}
            >
              {manage ? <NavigateBeforeIcon /> : <NavigateNextIcon />}
            </Button>
          </CustomButton>
          <Spacer />
          <CustomButton>
            <Button variant="transparent" size="sm" onClick={() => clear()}>
              <ClearIcon />
            </Button>
          </CustomButton>
        </Box>
        <CardContent>
          <Spacer size="sm" />
          <Reverse />
          <ErrorBoundary fallback={<span>ORDER ERROR</span>}>
            <OrderContent manage={manage} />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </>
  )
}
const CustomButton = styled.div`
  margin-top: -0.2em;
  background: none;
`
const Reverse = styled.div`
  margin-top: -1.1em;
`

const StyledTitle = styled.h4`
  align-items: center;
  border-bottom: 0px solid ${(props) => props.theme.color.grey[600]};
  width: 100%;
  color: white;
`

const StyledLogo = styled.img`
  border-radius: 50%;
  margin-left: 1.3em;
  height: 36px;
`

export default OrderCard
