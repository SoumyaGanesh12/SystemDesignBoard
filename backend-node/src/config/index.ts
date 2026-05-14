import dotenv from 'dotenv'
dotenv.config()

export const config = {
    port: process.env.PORT,
    javaApiUrl: process.env.JAVA_API_URL,
    frontendUrl: process.env.FRONTEND_URL,
    groqApiKey: process.env.Groq_API_KEY,
    groqModel: process.env.GROQ_MODEL,
}