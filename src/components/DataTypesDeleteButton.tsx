import styled from 'styled-components'
import {useStore} from "../store";

const DataTypesDeleteStyledButton = styled.button`
  background: white;
  border: 1px solid #675d5d;
  padding: 5px 10px;
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

const DataTypesDeleteButton = ({leftOffset}: DataTypesDeleteButtonProps) => {
    const deleteDataTypes = useStore((state) => state.deleteDataTypes)
    return (<DataTypesDeleteStyledButton
        style={{left: `${leftOffset}px`}}
        onClick={deleteDataTypes}>⌫</DataTypesDeleteStyledButton>)
}

export default DataTypesDeleteButton