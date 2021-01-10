import React from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import Button from '@/components/Button'
import LaunchIcon from '@material-ui/icons/Launch'

import { useDisclaimer } from '@/hooks/user/index'

const Disclaimer: React.FC = () => {
  const [open, setOpen] = useDisclaimer()
  const handleConfirm = () => {
    setOpen(false)
  }

  if (!open) return null
  return (
    <Backdrop>
      <StyledCard>
        <StyledDis>Primitive Disclosure</StyledDis>
        <Body>
          The Primitive Interface is an open source and free web application.
          Please use the Primitive Interface and Primitive Protocol at your own
          risk.
        </Body>
        <Body>
          Visit the{' '}
          <StyledLink href={'/risks'}>
            <LinkInt>
              Risks <LaunchIcon style={{ fontSize: '12px' }} />{' '}
            </LinkInt>
          </StyledLink>{' '}
          page for more information.
        </Body>
        <Body>
          Visit the{' '}
          <StyledLink href={'/faq'}>
            <LinkInt>
              FAQ <LaunchIcon style={{ fontSize: '12px' }} />{' '}
            </LinkInt>
          </StyledLink>{' '}
          page for contract specification information.
        </Body>
        <Button full onClick={handleConfirm}>
          I Accept
        </Button>
      </StyledCard>
    </Backdrop>
  )
}

const LinkInt = styled.span`
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.color.grey[400]};
    cursor: pointer;
  }
`
const StyledLink = styled(Link)``

const Body = styled.h4`
  color: ${(props) => props.theme.color.grey[400]};
`
const StyledDis = styled.h3`
  color: white;
`
const Backdrop = styled.div`
  z-index: 400;
  background-color: rgba(0, 0, 0, 0.7);
  position: absolute;
  width: 100%;
  height: 100%;
`

const StyledCard = styled.div`
  left: 40%;
  top: 20%;
  padding: 0 2em 2em 2em;
  border-radius: 0.3em;
  position: absolute;
  width: 22em;
  background: ${(props) => props.theme.color.grey[800]};
  border: 2px solid ${(props) => props.theme.color.grey[600]};
  color: white;
`
export default Disclaimer
