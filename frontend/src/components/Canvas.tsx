import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useNodesState, useEdgesState, addEdge, type Connection, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { paletteComponents } from '../data/components'
import styles from './Canvas.module.css'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { CanvasNodeData } from '../types'
import { API_CONFIG } from '../config/api'
import ValidationPanel from './ValidationPanel'
import type { ValidationResult } from '../types'
import AIAdvisor from './AIAdvisor'
import SaveDesign from './SaveDesign'

let nodeIdCounter = 1

function Canvas(){
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [designId, setDesignId] = useState<string | null>(null)
    const [designName, setDesignName] = useState<string>('')
    const [designDescription, setDesignDescription] = useState<string>('')
    const [designVersion, setDesignVersion] = useState<number>(0)
    
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

    function getStyledEdges(baseEdges: Edge[], results: ValidationResult[]): Edge[]{
        const errorEdgeIds = new Set(
            results
                .filter(r => r.edgeId && r.severity === 'ERROR')
                .map(r => r.edgeId)
        )

        const warningEdgeIds = new Set(
            results
                .filter(r => r.edgeId && r.severity === 'WARNING')
                .map(r => r.edgeId)
        )

        return baseEdges.map(edge => {
            if(errorEdgeIds.has(edge.id)){
                return{
                    ...edge,
                    style: { stroke:'#ff4444', strokeWidth: 2},
                    animated: true,
                }
            }

            if(warningEdgeIds.has(edge.id)){
                return{
                    ...edge,
                    style: {stroke: '#ffaa00', strokeWidth: 2},
                    animated: true,
                }
            }

            return edge
        })
    }

    async function validateGraph(currentNodes: any[], currentEdges: any[]){
        if(currentNodes.length === 0){
            setValidationResults([])
            return
        }

        try{
            const response = await fetch(`${API_CONFIG.baseUrl}/api/validate`, {
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

    function handleDesignSaved(id: string, name: string, version: number, description: string){
        setDesignId(id)
        setDesignName(name)
        setDesignVersion(version)
        setDesignDescription(description)
        console.log(`Design saved: ${name} v${version}`)
    }

    return(
    <>
        <div className={styles.canvasWrapper} ref={reactFlowWrapper}>
            <ReactFlow colorMode="dark" nodes={nodes} edges={getStyledEdges(edges, validationResults)} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} deleteKeyCode={['Backspace', 'Delete']} fitView>
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
            
            <ValidationPanel results={validationResults} />
        </div>
        <SaveDesign
            nodes={nodes}
            edges={edges}
            designId={designId}
            onSave={handleDesignSaved}
        />
        <AIAdvisor
            nodes={nodes}
            edges={edges}
            validationResults={validationResults}
            designName={designName}
            designDescription={designDescription}
        />
    </>
    )
}

export default Canvas