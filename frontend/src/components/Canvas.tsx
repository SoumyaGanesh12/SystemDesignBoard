import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import styles from './Canvas.module.css'

function Canvas(){
    return(
        <div className={styles.canvasWrapper}>
            <ReactFlow colorMode="dark">
                {/* Dotted grid background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color='#333'
                />

                {/* Zoom in, zoom out, fit view controls */}
                <Controls/>

                {/* Small overview map of the canvas */}
                <MiniMap/>
            </ReactFlow>
        </div>
    )
}

export default Canvas