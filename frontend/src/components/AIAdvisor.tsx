import {useState, useRef} from 'react'
import {API_CONFIG} from '../config/api'
import type { ValidationResult } from '../types'
import styles from './AIAdvisor.module.css'

interface AIAdvisorProps{
    nodes: any[]
    edges: any[]
    validationResults: ValidationResult[]
}

function AIAdvisor({ nodes, edges, validationResults} : AIAdvisorProps) {
    console.log('styles:', styles)
    const [isOpen, setIsOpen] = useState(false)
    const [response, setResponse] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const responseRef = useRef<HTMLDivElement>(null)

    async function handleAnalyze(){
        if(nodes.length === 0) return
        
        setIsOpen(true)
        setResponse('')
        setIsLoading(true)

        try{
            const res = await fetch(`${API_CONFIG.baseUrl}/api/analyze`, {
                method: 'POST',
                headers: {'Content-Type': API_CONFIG.contentType},
                body: JSON.stringify({nodes, edges, validationResults})
            })

            if(!res.ok){
                setResponse('AI Advisor is currently unavailable. Please try again.')
                setIsLoading(false)
                return
            }

            // Get the reader ro read the SSE stream
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()

            if(!reader){
                setResponse('Failed to connect to AI advisor.')
                setIsLoading(false)
                return
            }

            let fullResponse = ''

            // Read chunks from the stream one by one
            while(true){
                const {done, value} = await reader.read()
                if(done) break
                
                // Decode the raw bytes into text
                const chunk = decoder.decode(value, {stream: true})

                // Each chunk may contain multiple SSE lines
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

                for(const line of lines){
                    const data = line.replace('data: ','')
                    
                    // Stream is finsished
                    if(data === '[DONE]') break

                    try{
                        const parsed = JSON.parse(data)
                        if(parsed.content){
                            fullResponse += parsed.content
                            setResponse(fullResponse)

                            // Auto scroll to bottom as new text arrives
                            if(responseRef.current){
                                responseRef.current.scrollTop = responseRef.current.scrollHeight
                            }
                        }
                    } catch (e) {
                        console.warn('Skipped malformed chunk: ', data)
                    }
                }
            }
        } catch(error){
            console.error('AI advisor error: ', error)
            setResponse('Failed to connect to AI advisor.')
        }

        setIsLoading(false)
    }

    return(
        <>
            <button className={styles.analyzeButton} onClick={handleAnalyze}>
               🤖 Analyze My Design
            </button>

            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <h3 className={styles.title}>AI Advisor</h3>
                        <button className={styles.closeButton} onClick={() => setIsOpen(false)}>X</button>
                    </div>

                    <div className={styles.content} ref={responseRef}>
                        {isLoading && response === '' ? (
                            <p className={styles.loading}>Analyzing your architecture...</p>
                        ) : (
                            <div className={styles.response}>{response}</div>
                        )}
                    </div>    
                </div>
            )}
        </>
    )
}

export default AIAdvisor