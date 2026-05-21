import express from 'express'
import cors from 'cors'
import {config} from './config'
import { initDatabase } from './config/database'
import validateRouter from './routes/validate'
import analyzeRouter from './routes/analyze'
import designRouter from './routes/design'
import { connectProducer } from './kafka/producer'
import { startConsumer } from './kafka/consumer'
import logger from './config/logger'

const app = express()

app.use(cors({origin: config.frontendUrl || 'http://localhost:5173'}))
app.use(express.json())

app.get('/health', (req, res) => {
    res.json({status: 'ok'})
})

app.use('/api/validate', validateRouter)
app.use('/api/analyze', analyzeRouter)
app.use('/api/design', designRouter)

app.listen(config.port, async () => {
    logger.info(`Node.js server running on port ${config.port}`)
    await initDatabase()
    await connectProducer()
    await startConsumer()
})