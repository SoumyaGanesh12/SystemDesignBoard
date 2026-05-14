import express from 'express'
import cors from 'cors'
import {config} from './config'
import validateRouter from './routes/validate'

const app = express()

app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:5173'}))
app.use(express.json())

app.get('/health', (req, res) => {
    res.json({status: 'ok'})
})

app.use('/api/validate', validateRouter)

app.listen(config.port, () => {
    console.log(`Node.js server running on port ${config.port}`)
})