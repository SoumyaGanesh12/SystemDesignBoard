import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { publishDesignSaved } from '../kafka/producer'

const router = Router()

router.post('/save', async (req: Request, res: Response) => {
    const {nodes, edges, name} = req.body
    if(!nodes || !edges){
        res.status(400).json({error: 'nodes and edges are required'})
        return
    }

    // Generate unique design ID
    const designId = uuidv4()
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

export default router