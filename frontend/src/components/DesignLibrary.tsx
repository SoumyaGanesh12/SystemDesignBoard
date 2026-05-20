import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_CONFIG } from "../config/api"
import styles from './DesignLibrary.module.css'

interface Design{
    id: string
    name: string
    description: string
    version: number
    created_at: string
    updated_at: string
}

function DesignLibrary() {
    const [designs, setDesigns] = useState<Design[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchDesigns()
    }, [])

    async function fetchDesigns() {
        try{
            const response = await fetch(`${API_CONFIG.baseUrl}/api/design/list`)
            if (!response.ok) {
                console.error('Failed to fetch designs:', response.status)
                setIsLoading(false)
                return
            }
            const data = await response.json()
            setDesigns(Array.isArray(data) ? data : [])
        }catch(error){
            console.error('Failed to fetch designs: ', error)
        }
        setIsLoading(false)
    }

    async function handleDelete(designId: string){
        try{
            await fetch(`${API_CONFIG.baseUrl}/api/design/${designId}`, {
                method: 'DELETE',
            })
            setDesigns(prev => prev.filter(d=>d.id !== designId))
        } catch(error){
            console.error('Failed to delete design: ', error)
        }
    }

    function formatDate(dateString: string){
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>SystemDesignBoard</h1>
                <button className={styles.newButton} onClick={() =>navigate('/design/new')}>
                    + New Design
                </button>
            </div>

            {isLoading ? (
                <p className={styles.loading}>Loading designs...</p>
            ) : designs.length === 0 ? (
                <div className={styles.empty}>
                    <p>No designs yet.</p>
                    <p>Click "New Design" to start building your first architecture.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {designs.map(design => (
                        <div key={design.id} className={styles.card}>
                            <div
                                className={styles.cardBody}
                                onClick={() => navigate(`/design/${design.id}`)}
                            >
                                <h3 className={styles.cardTitle}>{design.name}</h3>
                                {design.description && (
                                    <p className={styles.cardDescription}>{design.description}</p>
                                )}
                                <div className={styles.cardMeta}>
                                    <span>v{design.version}</span>
                                    <span>{formatDate(design.updated_at)}</span>
                                </div>
                            </div>
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(design.id)
                                }}
                            >
                                X
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>    
    )
}

export default DesignLibrary