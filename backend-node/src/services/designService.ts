import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'
import { publishDesignSaved } from '../kafka/producer'

interface SaveDesignInput {
    nodes: any[]
    edges: any[]
    name?: string
    description?: string
    designId?: string
}

interface DesignResponse {
    designId: string
    name: string
    description: string
    version: number
    message: string
}

// Save a new design or update an existing one
// If designId is provided, increment version and update
// If not, create a new design with version as 1
export async function saveDesign(input: SaveDesignInput): Promise<DesignResponse> {
    const { nodes, edges, name, designId: existingId } = input
    const graph = JSON.stringify({ nodes, edges })

    if (existingId) {
        // Fetch current version to increment
        const existing = await pool.query(
        'SELECT version FROM designs WHERE id = $1',
        [existingId]
        )

        if (existing.rows.length === 0) {
        throw new Error('DESIGN_NOT_FOUND')
        }

        const newVersion = existing.rows[0].version + 1

        // Update the design with new graph and incremented version
        await pool.query(
        'UPDATE designs SET graph = $1, name = $2, description = $3, version = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [ graph, name || 'Untitled Design', input.description || '', newVersion, existingId ]
        )

        // Publish Kafka event after successful database save
        await publishDesignSaved({
        nodes,
        edges,
        designId: existingId,
        savedAt: new Date().toISOString(),
        })

        return {
        designId: existingId,
        name: name || 'Untitled Design',
        description: input.description || '',
        version: newVersion,
        message: 'Design updated successfully',
        }
    }

    // New design - generate UUID and insert with version 1
    const designId = uuidv4()

    await pool.query(
        'INSERT INTO designs (id, name, description, version, graph) VALUES ($1, $2, $3, $4, $5)',
        [designId, name || 'Untitled Design', input.description || '', 1, graph]
    )

    // Publish Kafka event after successful database save
    await publishDesignSaved({
        nodes,
        edges,
        designId,
        savedAt: new Date().toISOString(),
    })

    return {
        designId,
        name: name || 'Untitled Design',
        description: input.description || '',
        version: 1,
        message: 'Design created successfully',
    }
}

// Fetch all designs ordered by most recently updated
export async function listDesigns() {
    const result = await pool.query(
        'SELECT id, name, version, created_at, updated_at FROM designs ORDER BY updated_at DESC'
    )
    return result.rows
    }

    // Fetch a single design with its full graph data
    export async function getDesign(designId: string) {
    const result = await pool.query(
        'SELECT * FROM designs WHERE id = $1',
        [designId]
    )

    if (result.rows.length === 0) {
        throw new Error('DESIGN_NOT_FOUND')
    }

    return result.rows[0]
}

// Delete a design by ID
export async function deleteDesign(designId: string) {
    const result = await pool.query(
        'DELETE FROM designs WHERE id = $1 RETURNING id',
        [designId]
    )

    if (result.rows.length === 0) {
        throw new Error('DESIGN_NOT_FOUND')
    }

}