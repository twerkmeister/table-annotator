import styled from 'styled-components'
import {useStore} from "../store";

const VirtualValueAddStyledButton = styled.button`
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
  width: 500px;
`

const VirtualValueAddButton = () => {
    const addVirtualColumn = useStore((state) => state.addVirtualValue)
    return <VirtualValueAddStyledButton onClick={addVirtualColumn}>+</VirtualValueAddStyledButton>
}

export default VirtualValueAddButton
