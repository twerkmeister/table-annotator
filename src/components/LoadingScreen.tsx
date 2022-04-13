import React from "react";
import styled from "styled-components";

const LoadingScreenDiv = styled.div`
    width: 100%;
    height: 100%;
    background: #4a4a4a4a;
    cursor: wait;
    position: fixed;
    left: 0;
    top: 0;
`

const LoadingScreenTextDiv = styled.div`
    margin: 25%;
    font-size: 50px;
    color: coral;
    text-align: center;
`

type LoadingScreenProps = {
    text: string
}

const LoadingScreen = ({text}: LoadingScreenProps) => {
    return (<LoadingScreenDiv>
        <LoadingScreenTextDiv>
            {text}
        </LoadingScreenTextDiv>
    </LoadingScreenDiv>)
}

export default LoadingScreen