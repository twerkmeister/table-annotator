import styled from 'styled-components'
import {useStore} from "../store";

const VirtualValueDeleteStyledButton = styled.button`
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
  min-width: 50px;
`

type VirtualValueDeleteButtonProps = {
    valueIndex: number
}

const VirtualValueDeleteButton = ({valueIndex}: VirtualValueDeleteButtonProps) => {
    const deleteVirtualValue = useStore((state) => state.deleteVirtualValue)
    return <VirtualValueDeleteStyledButton onClick={() => deleteVirtualValue(valueIndex)}>⌫</VirtualValueDeleteStyledButton>
}

export default VirtualValueDeleteButton
