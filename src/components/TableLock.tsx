import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const TableLockDiv = styled.div `
    border: 1px solid rgba(0, 0, 0, 8);
    width: 40px;
    height: 40px;
    top: -47px;
    left: -47px;
    font-size: 36px;
    text-align: center;
    background: silver;
    position: absolute;
    cursor: pointer;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
`

type TableLockProps = {
    locked: boolean
}

const TableLock = ({locked} : TableLockProps) =>{
    const lockTable = useStore(state => state.lockTable)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        lockTable(!locked)
        e.stopPropagation()
    }

    return (<TableLockDiv onClick={handleMouseClick}>{locked? "🔐": "🔓" }</TableLockDiv>)
}

export default TableLock