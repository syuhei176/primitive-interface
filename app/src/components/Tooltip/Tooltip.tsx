import React, { useState } from 'react'
import styled from 'styled-components'
import InfoIcon from '@material-ui/icons/Info'

export interface TooltipProps {
  children: React.ReactNode
  text: string
  icon?: boolean
  direction?: 'bottom' | 'left'
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  icon = true,
  direction = 'bottom',
}) => {
  const [open, setOpen] = useState(false)
  const onOver = () => {
    setOpen(true)
  }
  const onLeave = () => {
    setOpen(false)
  }
  return (
    <StyledContainer onMouseOver={onOver} onMouseLeave={onLeave}>
      {open && text ? <Tip>{text}</Tip> : null}
      {children}
      {icon ? <StyledInfoIcon /> : null}
    </StyledContainer>
  )
}

const StyledInfoIcon = styled(InfoIcon)`
  font-size: 10px !important;
  margin-bottom: 7px;
  color: ${(props) => props.theme.color.grey[500]};
`

const StyledContainer = styled.div`
  position: relative;
  display: inline-block;
  //border-bottom: 1px dotted black;
  cursor: pointer;
`
const Tip = styled.h5`
  background: black;
  color: ${(props) => props.theme.color.white};
  max-width: 20em;
  min-width: 10em;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  top: 0.8em;
  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 200 !important;
`
