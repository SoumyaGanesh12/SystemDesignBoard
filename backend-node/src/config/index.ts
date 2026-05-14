import dotenv from 'dotenv'
dotenv.config()

export const config = {
    port: process.env.PORT,
    javaApiUrl: process.env.JAVA_API_URL,
    frontendUrl: process.env.FRONTEND_URL,
}