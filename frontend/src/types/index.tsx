export type ComponentCategory = 'Client' | 'Compute' | 'Storage' | 'Messaging' | 'Network'

// Structure of every component in palette
export interface PaletteComponent{
    id: string
    name: string
    category: ComponentCategory
    icon: string
    description: string
}