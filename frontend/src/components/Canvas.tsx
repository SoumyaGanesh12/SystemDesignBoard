import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useNodesState, useEdgesState, addEdge, type Connection, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { paletteComponents } from '../data/components'
import styles from './Canvas.module.css'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { CanvasNodeData } from '../types'

let nodeIdCounter = 1

function Canvas(){
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([])
    const [edges,setEdges, onEdgesChange] = useEdgesState([])
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    
    // useEffect(() => {
    //     console.log(JSON.stringify({nodes, edges}, null, 2))    
    // }, [nodes, edges])

    const onConnect = useCallback(
        (connection: Connection) => setEdges(eds => addEdge(connection, eds)),
        [setEdges]
    )

    function onDragOver(event: React.DragEvent){
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }

    function onDrop(event: React.DragEvent){
        event.preventDefault()

        const componentId = event.dataTransfer.getData('componentId')
        if(!componentId) return

        const component = paletteComponents.find(c => c.id === componentId)
        if(!component) return

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
        })

        const newNode: Node<CanvasNodeData> = {
            id: `${componentId}-${nodeIdCounter++}`,
            type: 'default',
            position,
            data: {
                label: `${component.icon} ${component.name}`,
                componentId: component.id,
                category: component.category,
            },
        }

        setNodes(nds => [...nds, newNode])
    }
    return(
        <div className={styles.canvasWrapper} ref={reactFlowWrapper}>
            <ReactFlow colorMode="dark" nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} fitView>
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