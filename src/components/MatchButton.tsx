import styled from 'styled-components'
import {useStore} from "../store";

const StyledMatchButton = styled.button`
  background: white;
  border: 1px solid #675d5d;
  padding: 6px 10px;
  outline: none;
  border-radius: 4px;
  font-weight: 700;
  :hover{
    background: #f3eeee;
    cursor: pointer;
  }
  width: 40px;
  position: absolute;
`

type DataTypesDeleteButtonProps = {
    leftOffset : number
}

const MatchButton = ({leftOffset}: DataTypesDeleteButtonProps) => {
    const matchData = useStore((state) => state.matchData)
    return (<StyledMatchButton
        style={{left: `${leftOffset}px`}}
        onClick={matchData}>≛</StyledMatchButton>)
}

export default MatchButton
