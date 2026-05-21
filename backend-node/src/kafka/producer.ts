import { Kafka } from 'kafkajs'
import { config } from '../config'
import logger from '../config/logger'

// Creates a Kafka client instance
// clientId identifies this application to the Kafka broker
const kafka = new Kafka({
    clientId: 'systemdesignboard-node',
    brokers: [config.kafkaBroker],
})

const producer = kafka.producer()

let isConnected = false

export async function connectProducer(retries = 5): Promise<void>{
    for(let i=0; i<retries; i++){
        logger.info(`Connecting to Kafka at: ${config.kafkaBroker}`)
        try{
            await producer.connect()
            isConnected = true
            logger.info('Kafka producer connected')
            return
        }catch (error){
            logger.warn(`Kafka producer not ready, retrying in 3 seconds... (${i + 1}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
    logger.error('Failed to connect to Kafka producer after retries')
}

export async function publishDesignSaved(designData: {
    nodes: any[]
    edges: any[]
    designId: string
    savedAt: string
}){
    if(!isConnected){
        logger.warn('Kafka producer not connected, skipping publish')
        return
    }

    try{
        // Send a message to the design.saved topic
        await producer.send({
            topic: 'design.saved',
            messages:[
                {
                    key: designData.designId,
                    value: JSON.stringify(designData),
                },
            ],
        })
        logger.info(`Published design.saved event for: ${designData.designId}`)
    } catch (error) {
        logger.error(`Failed to publish design.saved: ${error}`)
    }
}

export async function disconnectProducer() {
    await producer.disconnect()
    isConnected = false
}