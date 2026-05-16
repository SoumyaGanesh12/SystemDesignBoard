import dotenv from 'dotenv'
dotenv.config()

export const config = {
port: process.env.PORT || '3000',
    javaApiUrl: process.env.JAVA_API_URL || 'http://localhost:8080',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
}