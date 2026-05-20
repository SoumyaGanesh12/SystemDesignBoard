import { useState } from 'react'
import {API_CONFIG} from '../config/api'
import styles from './SaveDesign.module.css'

interface SaveDesignProps {
    nodes: any[]
    edges: any[]
    designId: string | null
    designName: string
    designDescription: string
    onSave: (designId: string, name: string, version: number, description: string) => void
}

function SaveDesign({ nodes, edges, designId, designName, designDescription, onSave } : SaveDesignProps){
    const [showModal, setShowModal] = useState(false)
    const [nameInput, setNameInput] = useState('')
    const [descriptionInput, setDescriptionInput] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<string | null>(null)

    async function handleSave(saveName: string, saveDescription: string) {
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
                    name: saveName,
                    description: saveDescription,
                }),
            })

            if(!response.ok){
                console.error('Save failed')
                setIsSaving(false)
                return
            }

            const data = await response.json()
            onSave(data.designId, data.name, data.version, data.description)
            setShowModal(false)
            setSaveStatus(`Saved v${data.version}`)
            setTimeout(() => setSaveStatus(null), 3000)
        } catch(error){
            console.error('Save error:', error)
        }

        setIsSaving(false)
    }

    function handleClick(){
         if (designId) {
            // Existing design - save directly with current name and description
            handleSave(designName, designDescription)
        }else {
            // New design - get name and description from user
            setNameInput('')
            setDescriptionInput('')
            setShowModal(true)
        }
    }

    function handleModalSave(){
        if(nameInput.trim() === '') return
        handleSave(nameInput, descriptionInput)
    }

    function handleKeyDown(e: React.KeyboardEvent){
        if(e.key === 'Enter'){
            handleModalSave()
        }
        if(e.key === 'Escape'){
            setShowModal(false)
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
            {saveStatus && (
                <span className={styles.saveStatus}>{saveStatus}</span>
            )}

            {showModal && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Name your design</h3>
                        <input
                            type="text"
                            className={styles.nameInput}
                            placeholder="e.g. Food Delivery App"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <textarea
                            className={styles.descriptionInput}
                            placeholder="Brief description of what this system does..."
                            value={descriptionInput}
                            onChange={e => setDescriptionInput(e.target.value)}
                            rows={3}
                        />
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.confirmButton}
                                onClick={handleModalSave}
                                disabled={nameInput.trim() === ''}
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