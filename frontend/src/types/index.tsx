export type ComponentCategory = 'Client' | 'Compute' | 'Storage' | 'Messaging' | 'Network'

// Structure of every component in palette
export interface PaletteComponent{
    id: string
    name: string
    category: ComponentCategory
    icon: string
    description: string
}

export interface CanvasNodeData extends Record<string, unknown> {
    label: string
    componentId: string
    category: string
}

export interface ValidationResult {
    nodeId: string
    severity: string
    code: string
    message: string
}