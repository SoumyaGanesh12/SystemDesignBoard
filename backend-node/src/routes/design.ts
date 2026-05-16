import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { publishDesignSaved } from '../kafka/producer'
import { addSSEConnection, removeSSEConnection } from '../kafka/consumer'

const router = Router()

router.post('/save', async (req: Request, res: Response) => {
    const {nodes, edges, name, designId: existingId} = req.body
    if(!nodes || !edges){
        res.status(400).json({error: 'nodes and edges are required'})
        return
    }

    // Generate unique design ID
    const designId = existingId || uuidv4()
    const savedAt = new Date().toISOString()

    // Publish the design.saved event to Kafka
    await publishDesignSaved({
        nodes,
        edges,
        designId,
        savedAt,
    })

    res.json({
        designId,
        name: name || 'Untitled Design',
        savedAt,
        message: 'Design saved successfully',
    })
})

// SSE endpoint - Keeps connection open and pushes Kafka results when they arrive
router.get('/events/:designId', (req: Request, res: Response) => {
    const designId = req.params.designId as string
    
    res.setHeader('Content-type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Register this connection
    addSSEConnection(designId, res)
    console.log(`SSE connection opened for design: ${designId}`)

    // Clean up when browser disconnects
    req.on('close', () => {
        removeSSEConnection(designId, res)
        console.log(`SSE connection closed for design: ${designId}`)
    })
})

export default router