import styled from 'styled-components'
import React from 'react'

const Wrapper = styled.div`
  display: inline-block;
  width: 100%;
`

const Button = styled.button`
  background: white;
  border: 1px solid #675d5d;
  padding: 5px 5px;
  outline: none;
  border-radius: 4px;
  font-weight: 700;
  :hover{
    background: #f3eeee;
    cursor: pointer;
  }
  overflow: hidden;
`

const DropDown = styled.ul`
  list-style: none;
  min-width: 200px;
  font-size: 16px;
  position: absolute;
  background: white;
  box-shadow: 0 6px 12px rgba(0,0,0,.175);
  border: 1px solid rgba(0,0,0,.15);
  padding: 5px;
  margin: 0;
  text-align: left !important;
  z-index : 1;
`;

const DropIcon = styled.span`
  font-size: 16px;
  margin-left: 8px;
`;

const ListItem = styled.li`
  padding: 2px;
  :hover{
    padding : 3px;
    background: #eee;
    cursor: pointer;
  }
`;

const ItemSpan = styled.span`
  margin-left: 5px;
`;

const ItemLabel = styled.label`
  cursor: pointer !important;
  color : black;
`;

const ItemCheck = styled.input`
  cursor: pointer !important;
`;

type Item = {
    label: string,
    value: string
}


type MultiSelectProps = {
    title : string,
    width : number,
    items : Item[],
    selectedItems : string[],
    onChange : (items: string[]) => void,
    max_num_selection?: number
}

const MultiSelect = ({title, width, items, selectedItems, onChange, max_num_selection}: MultiSelectProps) => {
    const [opened, setOpened] = React.useState(false)

    const changeList = (selectedItems: string[], item: string) => {
        const index = selectedItems.indexOf(item)
        if(index < 0 && (max_num_selection === undefined || selectedItems.length < max_num_selection)) {
            onChange([...selectedItems, item])
        } else {
            onChange([...selectedItems.slice(0, index), ...selectedItems.slice(index+1)])
        }
    }

    const renderList = (items: Item[], selectedItems: string[]) => {
        return items.map((item, i) => {
            const index = selectedItems.indexOf(item.value)
            return (
                <ListItem key={item.value}
                          onClick={() => changeList(selectedItems, item.value)}>
                    <ItemCheck type='checkbox' checked={index >= 0} readOnly={true}/>
                    <ItemLabel>
                        <ItemSpan>{item.label}</ItemSpan>
                    </ItemLabel>
                </ListItem>
            )
        })
    }


    return(
        <Wrapper onMouseLeave={(e) => setOpened(false)}>
            <Button  onClick={() => setOpened(!opened)}
                style={{width: `${width}px`}}>
                {title}
                <DropIcon>&#9662;</DropIcon>
            </Button>
            {
                opened && (
                    <DropDown role="menu"
                    style={{width: `${width}px`}}>
                        {renderList(items, selectedItems)}
                    </DropDown>
                )
            }
        </Wrapper>)

}

export default MultiSelect;
