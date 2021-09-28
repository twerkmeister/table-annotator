import React, {useEffect} from 'react';
import create from 'zustand'
import './App.css';

type AnnotatorState = {
    images: string[],
    current_image?: string,
    fetch_images: () => void
}

const useStore = create<AnnotatorState>(set => ({
    images: [],
    current_image: undefined,
    fetch_images: async() => {
        const response = await fetch("/images")
        const images = (await response.json())["images"]
        set({ images, current_image: images[0] })
    }
}))

function App() {
    const fetch_images = useStore(state => state.fetch_images)
    useEffect(() => fetch_images())
    return (
        <div className="App">
            <Canvas/>
        </div>
    );
}

function Canvas() {
    const image = useStore(state => state.current_image)
    if(image) {
        const style = {background: `url('./image/${image}')`}
        return (
            <canvas id="canvas" width="800" height="600" style={style}>
                Your browser does not support the canvas element.
            </canvas>
        )
    }
    else {
        return (
            <div>Still loading...</div>
        )
    }
}

export default App;
