import type {PaletteComponent} from '../types'

// Component schema
export const paletteComponents: PaletteComponent[] = [
    {
        id: 'client',
        name: 'Client',
        category: 'Client',
        icon: '💻',
        description: 'The end user browser or mobile app'
    },
    {
        id: 'server',
        name: 'Server',
        category: 'Compute',
        icon: '🖥️',
        description: 'Handles business logic and processes requests'
    },
    {
        id: 'database',
        name: 'Database',
        category: 'Storage',
        icon: '🗄️',
        description: 'Persists and queries structured data'
    },
    {
        id: 'cache',
        name: 'Cache',
        category: 'Storage',
        icon: '⚡',
        description: 'Stores frequently accessed data in memory for fast reads'
    },
    {
        id: 'load-balancer',
        name: 'Load Balancer',
        category: 'Network',
        icon: '⚖️',
        description: 'Distributes traffic evenly across multiple servers'
    },
    {
        id: 'message-queue',
        name: 'Message Queue',
        category: 'Messaging',
        icon: '📨',
        description: 'Decouples services by passing messages asynchronously'
    },
    {
        id: 'api-gateway',
        name: 'API Gateway',
        category: 'Network',
        icon: '🚪',
        description: 'Single entry point that routes requests to the right service'
    },
    {
        id: 'cdn',
        name: 'CDN',
        category: 'Network',
        icon: '🌐',
        description: 'Serves static content from servers closest to the user'
    },
]