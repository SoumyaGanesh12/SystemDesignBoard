import {Pool} from 'pg'
import {config} from './index'

const pool = new Pool({
    connectionString: config.databaseUrl,
})

export async function initDatabase() {
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS designs(
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL DEFAULT 'Untitled Design',
                version INT NOT NULL DEFAULT 1,
                graph JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('Database Initialized')
    } catch (error){
        console.error('Database initialization error:', error)
    }
}

export default pool