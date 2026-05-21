import {Pool} from 'pg'
import {config} from './index'

const pool = new Pool({
    connectionString: config.databaseUrl,
})

export async function initDatabase(retries = 5) : Promise <void> {
    for(let i=0;i<retries; i++){
        try{
            await pool.query(`
                CREATE TABLE IF NOT EXISTS designs(
                    id UUID PRIMARY KEY,
                    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Design',
                    description TEXT DEFAULT '',
                    version INT NOT NULL DEFAULT 1,
                    graph JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)
            console.log('Database Initialized')
            return
        } catch (error){
            console.error(`Database not ready error, retrying in 3 seconds... (${i + 1}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
    console.error('Failed to initialize database after retries')
}

export default pool