import { Router, Request, Response } from 'express'
import { config } from '../config'

const router = Router()

router.post('/', async(req: Request, res: Response) => {
    try{
        const response = await fetch(`${config.javaApiUrl}/api/validate`, {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify(req.body),
        })

        const data = await response.json()
        res.status(response.status).json(data)
    }catch(error){
        console.error('Validation service error:', error)
        res.status(503).json({ error: 'Validation service unavailable' })
    }
})

router.get('/rules', async(req: Request, res: Response) => {
    try{
        const response = await fetch(`${config.javaApiUrl}/api/validate/rules`)
        const data = await response.json()
        res.status(response.status).json(data)
    }catch(error){
        console.error('Validation service error:', error)
        res.status(503).json({ error: 'Validation service unavailable' })
    }
})

export default router