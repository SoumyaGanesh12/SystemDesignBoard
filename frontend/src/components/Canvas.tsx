import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useNodesState, useEdgesState, addEdge, type Connection, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { paletteComponents } from '../data/components'
import styles from './Canvas.module.css'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { CanvasNodeData } from '../types'
import { API_CONFIG } from '../config/api'

let nodeIdCounter = 1

function Canvas(){
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [validationResults, setValidationResults] = useState<any[]>([])
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    
    // useEffect(() => {
    //     console.log(JSON.stringify({nodes, edges}, null, 2))    
    // }, [nodes, edges])

    useEffect(() => {
        const timer = setTimeout(() => {
            validateGraph(nodes, edges)
        }, 500)

        return () => clearTimeout(timer)
    }, [nodes, edges])

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

    async function validateGraph(currentNodes: any[], currentEdges: any[]){
        if(currentNodes.length === 0){
            setValidationResults([])
            return
        }

        try{
            const response = await fetch(`${API_CONFIG.javaBaseUrl}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': API_CONFIG.contentType},
                body: JSON.stringify({ nodes: currentNodes, edges: currentEdges})
            })
            const data = await response.json()
            setValidationResults(data.results)
        }catch(error){
            console.error('Validation Failed: ', error)
        }
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
            <div style={{
                position: 'fixed',
                bottom:'20px',
                left: '240px',
                zIndex: 10,
                background: '#1a1a2e',
                padding: '12px',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                maxWidth: '300px'
            }}>
                {
                    validationResults.length === 0 ?
                    'No issues found' :
                    validationResults.map((r, index) => (
                        <div key={`${r.nodeId}-${index}`} style={{
                            color: r.severity === 'ERROR' ? '#ff4444' : '#ffaa00',
                            marginBottom: '4px'
                        }}>
                            {r.severity}: {r.message}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Canvas