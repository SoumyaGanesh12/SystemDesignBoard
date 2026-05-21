import {Router, Request, Response} from 'express'
import {config} from '../config'
import logger from '../config/logger'

const router = Router()

const SYSTEM_PROMPT=`You are an expert system design advisor helping beginners learn architecture.
You will recieve a system design as a JSON graph with nodes(components) and edges(connections).

Component types and their purposes:
- client: End user browser or mobile app
- server: Handles business logic and processes requests
- database: Persists and queries structured data
- cache: Stores frequently accessed data in memory for fast reads
- load-balncer: Distributes traffic evenly across multiple servers
- message-queue: Decouples services by passing messages asynchronously
- api-gateway: Single entrypoint that routes requests to the right service
- cdn: Serves static content from servers closest to the user

You will also recieve validation errors and warnings already detected by the rule engine. Do not repeat these.
Focus on higher level insights.

Guidelines:
- Be concise. Use short bullet points with dashes, 2-3 per topic.
- Cover what is good, what the risks are, what to improve, and how it handles load.
- Use section headings as plain text followed by bullet points.
- Explain technical terms simply. Your audience has never designed a system before.
- Be specific to their design, not generic advice.

Example format:

What You Got Right
- Your server sits between the client and database, protecting data access.
- The cache reduces repeated database queries for frequently read data.

Risks
- No redundancy on the server means a single failure takes down the system.
- Without a load balancer, traffic spikes will overwhelm your single server.
`

router.post('/', async (req: Request, res: Response) => {
    const {nodes, edges, validationResults, messages, designName, designDescription} = req.body
    logger.info(`AI context: ${JSON.stringify({ designName, designDescription })}`)
    if(!nodes || !edges){
        res.status(400).json({error: 'nodes and edges are required'})
        return
    }

    let designContext = 'Current system design'

    if (designName) {
        designContext += `\nApplication: ${designName}`
    }

    if (designDescription) {
        designContext += `\nDescription: ${designDescription}`
    }

    designContext += `\n\nThe user is trying to build this specific system. Tailor your feedback to this use case.\n`

    designContext += `\nNodes: ${JSON.stringify(nodes, null, 2)}`
    designContext += `\nEdges: ${JSON.stringify(edges, null, 2)}`
    designContext += `\nExisting validation results: ${JSON.stringify(validationResults || [], null, 2)}`

    // Build the messages array for LLM
    const llmMessages: { role:string; content: string }[] = [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: designContext},
    ]

    // First request - no conversation history, trigger initial analysis
    // Follow-up - append full conversation history so LLM has context
    if(!messages || messages.length === 0 ){
        llmMessages.push({ role: 'user', content: 'Analyze this structure.'})
    } else {
        for(const msg of messages){
            llmMessages.push({ role: msg.role, content: msg.content})
        }
    }

    try{
        // Call Groq API with streaming enabled
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.groqApiKey}`,
            },
            body: JSON.stringify({
                model: config.groqModel,
                messages: llmMessages,
                stream: true,
            }),
        })

        if(!response.ok){
            const error = await response.text()
            logger.error(`Groq API error: ${error}`)
            res.status(502).json({ error: 'AI service unavailable' })
            return
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        // Get a reader to read Groq's response stream chunk by chunk
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if(!reader){
            res.status(502).json({error: 'No response stream'})
            return
        }

        let buffer = ''

        // Read chunks from Groq in a loop until the stream ends
        while(true){
            // reader.read() waits for the next chunk from Groq
            // done = true means Groq has finished sending
            // value = the raw bytes of this chunk
            const {done, value} = await reader.read()

            if(done){
                res.write('data: [DONE]\n\n')
                res.end()
                break
            }

            // Append new data to buffer to handle partial chunks
            buffer += decoder.decode(value, { stream: true })

            // Process complete lines from the buffer
            const parts = buffer.split('\n')
            // Keep the last part as it might be incomplete
            buffer = parts.pop() || ''

            for(const part of parts){
                // Remove the "data: " prefix as the final message
                const line = part.trim()
                if (!line.startsWith('data: ')) continue

                const data = line.replace('data: ', '')
                if(data === '[DONE]'){
                    res.write('data: [DONE]\n\n')
                    res.end()
                    return
                }

                try{
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if(content){
                        res.write(`data: ${JSON.stringify({content})} \n\n`)
                    }
                }catch(e){
                    logger.warn(`Skipped malformed chunk: ${data.substring(0, 50)}`)
                }
            }
        }
    } catch(error){
        logger.error(`AI advisor error: ${error}`)
        res.status(503).json({error: 'AI service unavailable'})
    }
})

export default router