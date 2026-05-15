import React, {useState, useRef} from 'react'
import {API_CONFIG} from '../config/api'
import type { ValidationResult } from '../types'
import styles from './AIAdvisor.module.css'

interface AIAdvisorProps{
    nodes: any[]
    edges: any[]
    validationResults: ValidationResult[]
}

interface ChatMessage{
    role: 'user' | 'assistant'
    content: string
}

function AIAdvisor({ nodes, edges, validationResults} : AIAdvisorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    async function streamResponse(chatMessages: ChatMessage[]){
        setIsLoading(true)

        try{
            const res = await fetch(`${API_CONFIG.baseUrl}/api/analyze`, {
                method: 'POST',
                headers: {'Content-Type': API_CONFIG.contentType},
                body: JSON.stringify({
                    nodes, 
                    edges, 
                    validationResults,
                    messages: chatMessages.length > 0 ? chatMessages : undefined,
                })
            })

            if(!res.ok){
                setMessages( prev => [...prev, {
                    role: 'assistant',
                    content: 'AI Advisor is currently unavailable. Please try again.',
                }])
                setIsLoading(false)
                return
            }

            // Get the reader ro read the SSE stream
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()

            if(!reader){
                setIsLoading(false)
                return
            }

            let fullResponse = ''

            // Add an empty assistant message that updates as chunks arrive
            setMessages(prev => [...prev, { role: 'assistant', content: ''}])

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
                            // Update the last message with the growing response
                            setMessages(prev => {
                                const updated = [...prev]
                                updated[updated.length - 1] = { role: 'assistant', content: fullResponse}
                                return updated
                            })

                            // Auto scroll to see new content
                            if(contentRef.current){
                                contentRef.current.scrollTop = contentRef.current.scrollHeight
                            }
                        }
                    } catch (e) {
                        console.warn('Skipped malformed chunk: ', data)
                    }
                }
            }
        } catch(error){
            console.error('AI advisor error: ', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Failed to connect to AI advisor.',
            }])
        }

        setIsLoading(false)
    }

    async function handleAnalyze(){
        if(nodes.length === 0) return
        
        setIsOpen(true)
        setMessages([])
        streamResponse([])
    }

    function handleSend(){
        if(inputValue.trim() === '' || isLoading) return
        const newMessage: ChatMessage = {role: 'user', content: inputValue}
        const updatedMessages = [...messages, newMessage]
        setMessages(updatedMessages)
        setInputValue('')
        streamResponse(updatedMessages)
    }

    function handleKeyDown(e: React.KeyboardEvent){
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault()
            handleSend()
        }
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

                    <div className={styles.content} ref={contentRef}>
                        {isLoading && messages.length === 0 ? (
                            <p className={styles.loading}>Analyzing your architecture...</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={msg.role === 'user' ? styles.userMessage: styles.assistantMessage}
                                > {msg.content}
                                </div>
                            ))
                        )}
                    </div> 

                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            className={styles.chatInput}
                            placeholder="Ask a follow up question..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            className={styles.sendButton}
                            onClick={handleSend}
                            disabled={isLoading || inputValue.trim() === ''}
                        >
                            Send
                        </button>
                    </div>

                </div>
            )}
        </>
    )
}

export default AIAdvisor