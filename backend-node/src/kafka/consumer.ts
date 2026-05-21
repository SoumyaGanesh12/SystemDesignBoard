import { Kafka } from 'kafkajs'
import { config } from '../config'
import logger from '../config/logger'

const kafka = new Kafka({
    clientId: 'systemdesignboard-node',
    brokers: [config.kafkaBroker],
})

const consumer = kafka.consumer({ groupId: 'systemdesignboard-node' })

// Store SSE connections by designId
const sseConnections = new Map<string, any[]>()

export function addSSEConnection(designId: string, res: any){
    if(!sseConnections.has(designId)){
        sseConnections.set(designId, [])
    }
    sseConnections.get(designId)!.push(res)
}

export function removeSSEConnection(designId: string, res: any){
    const connections = sseConnections.get(designId)
    if(connections){
        const index = connections.indexOf(res)
        if(index > -1) connections.splice(index, 1)
        if(connections.length === 0) sseConnections.delete(designId)
    }
}

export async function startConsumer() {
    try{
        await consumer.connect()
        logger.info('Kafka consumer connected')

        await consumer.subscribe({ topic: 'validation.results', fromBeginning: false})

        await consumer.run({
            eachMessage: async({message}) => {
                const value = message.value?.toString()
                if(!value) return

                try{
                    const parsed = JSON.parse(value)
                    const designId = parsed.designId
                    logger.info(`Received validation results for design: ${designId}`)

                    // Push to all SSE connections waiting for this designId
                    const connections = sseConnections.get(designId)
                    if(connections){
                        for(const res of connections){
                            res.write(`data: ${value}\n\n`)
                        }
                        logger.info(`Pushed results to ${connections.length} SSE connection(s)`)
                    }
                } catch(e){
                    logger.warn(`Failed to parse validation result: ${e}`)
                }
            },
        })
    } catch(error){
        logger.error('Kafka consumer error: ', error)
    }
    
}