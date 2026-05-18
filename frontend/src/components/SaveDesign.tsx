import { useState } from 'react'
import {API_CONFIG} from '../config/api'
import styles from './SaveDesign.module.css'

interface SaveDesignProps {
    nodes: any[]
    edges: any[]
    designId: string | null
    onSave: (designId: string, name: string, version: number) => void
}

function SaveDesign({ nodes, edges, designId, onSave } : SaveDesignProps){
    const [showNameInput, setShowNameInput] = useState(false)
    const [name, setName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    async function handleSave(designName?: string) {
        if(nodes.length === 0) return
        setIsSaving(true)

        try{
            const isUpdate = designId !== null
            const url = isUpdate ? `${API_CONFIG.baseUrl}/api/design/${designId}` : `${API_CONFIG.baseUrl}/api/design`

            const response = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { 'Content-Type': API_CONFIG.contentType},
                body: JSON.stringify({
                    nodes,
                    edges,
                    name: designName || name || 'Untitled Design',
                }),
            })

            if(!response.ok){
                console.error('Save failed')
                setIsSaving(false)
                return
            }

            const data = await response.json()
            onSave(data.designId, data.name, data.version)
            setShowNameInput(false)
        } catch(error){
            console.error('Save error:', error)
        }

        setIsSaving(false)
    }

    function handleClick(){
        if(designId){
            // First save
            handleSave()
        } else {
            setShowNameInput(true)
        }
    }

    function handleSubmitName(){
        if(name.trim() === '') return
        handleSave(name)
    }

    function handleKeyDown(e: React.KeyboardEvent){
        if(e.key === 'Enter'){
            handleSubmitName()
        }
        if(e.key === 'Escape'){
            setShowNameInput(false)
        }
    }

    return(
        <>
            <button
                className={styles.saveButton}
                onClick={handleClick}
                disabled={isSaving || nodes.length === 0}
            >
                {isSaving ? 'Saving...' : '💾 Save'}
            </button>

            {showNameInput && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Name your design</h3>
                        <input
                            type="text"
                            className={styles.nameInput}
                            placeholder="e.g. Food Delivery App"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.confirmButton}
                                onClick={handleSubmitName}
                                disabled={name.trim() === ''}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SaveDesign