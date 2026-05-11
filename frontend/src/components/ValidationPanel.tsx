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

    const errors = uniqueResults.filter(r => r.severity === 'ERROR')
    const warnings = uniqueResults.filter(r => r.severity === 'WARNING')

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Validation</h3>

            {uniqueResults.length === 0 ? (
                <div className={styles.success}>
                    <span className={styles.badge}>🟢 Looking good, keep building!</span>
                </div>
            ) : (
                <div className={styles.list}>
                    {errors.map((r, index) => (
                        <div key={`error-${index}`} className={styles.errorRow}>
                            <span className={styles.errorBadge}>🔴 ERROR</span>
                            <span className={styles.message}>{r.message}</span>
                        </div>
                    ))}
                    {warnings.map((r, index) => (
                        <div key={`warning-${index}`} className={styles.warningRow}>
                            <span className={styles.warningBadge}>🟡 WARNING</span>
                            <span className={styles.message}>{r.message}</span>
                        </div>  
                    ))}
                </div>
            )}
        </div>
    )
}

export default ValidationPanel