import express from 'express'
import cors from 'cors'
import {config} from './config'
import validateRouter from './routes/validate'
import analyzeRouter from './routes/analyze'

const app = express()

app.use(cors({origin: config.frontendUrl || 'http://localhost:5173'}))
app.use(express.json())

app.get('/health', (req, res) => {
    res.json({status: 'ok'})
})

app.use('/api/validate', validateRouter)
app.use('/api/analyze', analyzeRouter)

app.listen(config.port, () => {
    console.log(`Node.js server running on port ${config.port}`)
})