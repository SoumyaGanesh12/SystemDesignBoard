import { paletteComponents } from "../data/components"
import type { ComponentCategory } from "../types"
import styles from './ComponentPalette.module.css'

const categories: ComponentCategory[] = ['Client', 'Compute', 'Storage', 'Messaging', 'Network']

function ComponentPalette(){
    return (
        <div className={styles.palette}>
            <h2 className={styles.title}>Components</h2>

            {/* Loop through each category and render its components */}
            {categories.map( category => (
                <div key={category} className={styles.category}>
                    <h3 className={styles.categoryTitle}>{category}</h3>

                    {/* Filter components that belong to this category */}
                    {paletteComponents
                        .filter(component => component.category === category)
                        .map(component => (
                            <div key={component.id} className={styles.componentItem}>
                                <span className={styles.icon}>{component.icon}</span>
                                <span className={styles.name}>{component.name}</span>
                            </div>
                        ))
                    }
                </div>
            ))}
        </div>
    )
}

export default ComponentPalette