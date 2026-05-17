import { Router, Request, Response } from 'express'
import { saveDesign, listDesigns, getDesign, deleteDesign } from '../services/designService'
import { addSSEConnection, removeSSEConnection } from '../kafka/consumer'

const router = Router()

// Create a new design
router.post('/', async (req: Request, res: Response) => {
    const { nodes, edges, name } = req.body

    if (!nodes || !edges) {
        res.status(400).json({ error: 'nodes and edges are required' })
        return
    }

    try {
        const result = await saveDesign({ nodes, edges, name })
        res.status(201).json(result)
    } catch (error) {
        console.error('Create design error:', error)
        res.status(500).json({ error: 'Failed to create design' })
    }
})

// Update an existing design
router.put('/:designId', async (req: Request, res: Response) => {
    const designId = req.params.designId as string
    const { nodes, edges, name } = req.body

    if (!nodes || !edges) {
        res.status(400).json({ error: 'nodes and edges are required' })
        return
    }

    try {
        const result = await saveDesign({ nodes, edges, name, designId })
        res.json(result)
    } catch (error: any) {
        if (error.message === 'DESIGN_NOT_FOUND') {
        res.status(404).json({ error: 'Design not found' })
        return
        }
        console.error('Update design error:', error)
        res.status(500).json({ error: 'Failed to update design' })
    }
})

// Get all designs
router.get('/list', async (req: Request, res: Response) => {
    try {
        const designs = await listDesigns()
        res.json(designs)
    } catch (error) {
        console.error('List designs error:', error)
        res.status(500).json({ error: 'Failed to fetch designs' })
    }
})

// SSE endpoint - Keeps connection open and pushes Kafka results when they arrive
// Browser opens this after saving to receive background processing results
router.get('/events/:designId', (req: Request, res: Response) => {
    const designId = req.params.designId as string

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Register browser connection
    addSSEConnection(designId, res)
    console.log(`SSE connection opened for design: ${designId}`)

    // Clean up when browser disconnects
    req.on('close', () => {
        removeSSEConnection(designId, res)
        console.log(`SSE connection closed for design: ${designId}`)
    })
})

// Get a design by ID
router.get('/:designId', async (req: Request, res: Response) => {
    const designId = req.params.designId as string

    try {
        const design = await getDesign(designId)
        res.json(design)
    } catch (error: any) {
        if (error.message === 'DESIGN_NOT_FOUND') {
        res.status(404).json({ error: 'Design not found' })
        return
        }
        console.error('Get design error:', error)
        res.status(500).json({ error: 'Failed to fetch design' })
    }
})

// Delete a design by ID
router.delete('/:designId', async( req: Request, res: Response) => {
    const designId = req.params.designId as string

    try{
        const result = await deleteDesign(designId)
        res.status(204).send()
    } catch(error: any) {
        if (error.message === 'DESIGN_NOT_FOUND') {
            res.status(404).json({ error: 'Design not found' })
            return
        }
        console.error('Delete design error: ', error)
        res.status(500).json({error: 'Failed to delete design'})
    }
})

export default router