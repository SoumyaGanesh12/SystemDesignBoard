import {Pool} from 'pg'
import {config} from './index'
import logger from './logger'

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
            logger.info('Database Initialized')
            return
        } catch (error){
            logger.warn(`Database not ready, retrying in 3 seconds... (${i + 1}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
    logger.error('Failed to initialize database after retries')
}

export default pool