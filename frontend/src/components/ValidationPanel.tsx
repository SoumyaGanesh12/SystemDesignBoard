import type {ValidationResult} from '../types'
import styles from './ValidationPanel.module.css'

interface ValidationPanelProps{
    results: ValidationResult[]
}

function ValidationPanel({results} : ValidationPanelProps){
    // Deduplicate by code for display only
    const uniqueResults = results.filter(
        (r, index, self) => self.findIndex(item => item.code === r.code) === index
    )
    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Validation</h3>

            {uniqueResults.length === 0 ? (
                <div className={styles.success}>
                    <span className={styles.badge}>🟢 ALL CLEAR</span>
                    <p className={styles.message}>Looking good, keep building!</p>
                </div>
            ) : (
                uniqueResults.map((r, index) => (
                    <div
                        key={`${r.nodeId}-${index}`}
                        className={r.severity === 'ERROR' ? styles.error : styles.warning}
                    >
                        <span className={styles.badge}>
                            {r.severity === 'ERROR' ? '🔴' : '🟡'} {r.severity}
                        </span>
                        <p className={styles.message}>{r.message}</p>
                    </div>
                ))
            )}
        </div>
    )
}

export default ValidationPanel