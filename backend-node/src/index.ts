import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT

app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:5173'}))
app.use(express.json())

app.get('/health', (req, res) => {
    res.json({status: 'ok'})
})

app.listen(PORT, () => {
    console.log(`Application server running on port ${PORT}`)
})