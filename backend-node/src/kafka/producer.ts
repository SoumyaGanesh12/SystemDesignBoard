import { Kafka } from 'kafkajs'
import { config } from '../config'

// Creates a Kafka client instance
// clientId identifies this application to the Kafka broker
const kafka = new Kafka({
    clientId: 'systemdesignboard-node',
    brokers: [config.kafkaBroker],
})

const producer = kafka.producer()

let isConnected = false

export async function connectProducer(){
    console.log('Connecting to Kafka at:', config.kafkaBroker)
    try{
        await producer.connect()
        isConnected = true
        console.log('Kafka producer connected')
    }catch (error){
        console.error('Kafka producer connection error: ', error)
    }
}

export async function publishDesignSaved(designData: {
    nodes: any[]
    edges: any[]
    designId: string
    savedAt: string
}){
    if(!isConnected){
        console.warn('Kafka producer not connected, skipping publish')
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
        console.log(`Published design.saved event for: ${designData.designId}`)
    } catch (error) {
        console.error('Failed to publish design.saved', error)
    }
}

export async function disconnectProducer() {
    await producer.disconnect()
    isConnected = false
}