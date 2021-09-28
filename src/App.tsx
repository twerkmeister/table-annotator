import React, {useEffect, useRef} from 'react';
import create from 'zustand'
import { HotKeys } from "react-hotkeys";
import './App.css';

const keyMap = {
    PREVIOUS_IMAGE: "left",
    NEXT_IMAGE: "right",
};


type AnnotatorState = {
    images?: string[],
    current_image_index?: number,
    fetch_images: () => void
    next_image: () => void
    previous_image: () => void
}

const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    current_image_index: undefined,
    fetch_images: async() => {
        const response = await fetch("/images")
        const images = (await response.json())["images"]
        set({ images, current_image_index: 0 })
    },
    next_image: () => {
        const images = get().images
        const current_image_index = get().current_image_index
        if (typeof(current_image_index) != "undefined" &&
            typeof(images) != "undefined" &&
            (current_image_index < images.length - 1)) {
            set({ current_image_index: current_image_index + 1 })
        }
    },
    previous_image: () => {
        const current_image_index = get().current_image_index
        if (typeof(current_image_index) != "undefined" && (current_image_index > 0)) {
            set({ current_image_index: current_image_index - 1 })
        }
    }
}))

function App() {
    const fetch_images = useStore(state => state.fetch_images)
    const next_image = useStore(state => state.next_image)
    const previous_image = useStore(state => state.previous_image)
    useEffect(() => fetch_images())

    const hotkeyHandlers = {
        PREVIOUS_IMAGE: previous_image,
        NEXT_IMAGE: next_image
    };

    return (
        <div className="App">
            <HotKeys keyMap={keyMap} handlers={hotkeyHandlers}>
                <Canvas/>
            </HotKeys>
        </div>
    );
}

function Canvas() {
    const image_idx = useStore(state => state.current_image_index)
    const images = useStore(state => state.images)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas && typeof(image_idx) != "undefined" && typeof(images) != "undefined") {
            const context = canvas.getContext('2d')
            if (context) {
                const image = new Image(300, 200)
                image.src = "image/" + images[image_idx]
                image.onload = function () {
                    context.clearRect(0, 0, canvas.width, canvas.height)
                    context.drawImage(image, 0, 0)
                }
            }
        }
    })

    if(images && typeof(image_idx) != "undefined") {
        return (
            <canvas ref={canvasRef} width="800" height="600">
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
