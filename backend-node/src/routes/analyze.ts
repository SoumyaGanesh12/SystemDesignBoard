import {Router, Request, Response} from 'express'
import {config} from '../config'

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

Respond in this exact structure:

**What you got right**
List what is architecturally sound in this design and why.

**Risks**
What could go wrong under real world condiditions - traffic spikes, server failures, data loss.

**What a Senior Engineer would change**
Specific improvements with reasoning. Not generic advice.

**How this behaves under load**
Walk through what happens when 10,000 users hit this system simultaneously.

Keep your language simple. No jargon without explanation. You are teaching, not evaluating.
`

router.post('/', async (req: Request, res: Response) => {
    const {nodes, edges, validationResults} = req.body
    if(!nodes || !edges){
        res.status(400).json({error: 'nodes and edges are required'})
        return
    }

    const userPrompt = `Here is the sytem design: 
        Nodes: ${JSON.stringify(nodes, null, 2)}
        Edges: ${JSON.stringify(edges, null, 2)}
        Existing validation results: ${JSON.stringify(validationResults || [], null, 2)}
        Analyze this architecture.
    `
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
                messages: [
                    {role: 'system', content: SYSTEM_PROMPT},
                    {role: 'user', content: userPrompt},
                ],
                stream: true,
            }),
        })

        if(!response.ok){
            const error = await response.text()
            console.error('Groq API error:', error)
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

            // Decode raw bytes into a string
            const chunk = decoder.decode(value, {stream:true})
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

            for(const line of lines){
                // Remove the "data: " prefix as the final message
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
                    console.warn('Skipped malformed chunk:', data)
                }
            }
        }
    } catch(error){
        console.error('AI advisor error:', error)
        res.status(503).json({error: 'AI service unavailable'})
    }
})

export default router