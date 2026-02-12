/**
 * backward compatible adapter
 * ensure new core2 system and existing core System compatible
 */

import { componentRegistry } from '../registry'
import { DataSourceMapper } from '../data-source'
import { PropertyExposureManager } from '../property'
import { FormGenerator } from '../form'
import { InteractionManager } from '../interaction'

/**
 * Backwards compatible adapter classes
 * Provided from old core system to new core2 Smooth transition of the system
 */
export class LegacyAdapter {
  /**
   * Check if it has been migrated to core2
   */
  static isMigrated(): boolean {
    try {
      const stats = componentRegistry.getStats()
      return stats.totalComponents > 0
    } catch {
      return false
    }
  }

  /**
   * Get migration status
   */
  static getMigrationStatus(): {
    isMigrated: boolean
    componentCount: number
    dataSourceCount: number
    propertyManagerReady: boolean
    formGeneratorReady: boolean
    interactionManagerReady: boolean
  } {
    try {
      const stats = componentRegistry.getStats()

      return {
        isMigrated: stats.totalComponents > 0,
        componentCount: stats.totalComponents,
        dataSourceCount: stats.multiDataSourceComponents,
        propertyManagerReady: true,
        formGeneratorReady: true,
        interactionManagerReady: true
      }
    } catch {
      return {
        isMigrated: false,
        componentCount: 0,
        dataSourceCount: 0,
        propertyManagerReady: false,
        formGeneratorReady: false,
        interactionManagerReady: false
      }
    }
  }

  /**
   * Provide compatibility warnings
   */
  static getCompatibilityWarnings(): string[] {
    const warnings: string[] = []

    // Check if old core system is used
    if (typeof window !== 'undefined') {
      const oldCore = (window as any).__CARD2_CORE__
      if (oldCore) {
        warnings.push('Old version detected core system，It is recommended to migrate to core2')
      }
    }

    return warnings
  }

  /**
   * Get migration advice
   */
  static getMigrationSuggestions(): {
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    action?: string
  }[] {
    const suggestions: {
      priority: 'high' | 'medium' | 'low'
      suggestion: string
      action?: string
    }[] = []

    // Check component registration status
    const stats = componentRegistry.getStats()
    if (stats.totalComponents === 0) {
      suggestions.push({
        priority: 'high',
        suggestion: 'No components are registered，Need to re-register components',
        action: 'Call the component registration function to register the component'
      })
    }

    // Check data source mapping
    if (stats.multiDataSourceComponents === 0) {
      suggestions.push({
        priority: 'medium',
        suggestion: 'No multiple data source component，You may need to configure data source mapping'
      })
    }

    return suggestions
  }

  /**
   * Perform migration check
   */
  static performMigrationCheck(): {
    status: 'ready' | 'needs-migration' | 'error'
    details: string
    suggestions: string[]
  } {
    const migrationStatus = this.getMigrationStatus()
    const warnings = this.getCompatibilityWarnings()
    const suggestions = this.getMigrationSuggestions()

    if (!migrationStatus.isMigrated) {
      return {
        status: 'needs-migration',
        details: 'The system has not been migrated to core2，Required to perform component registration',
        suggestions: suggestions.map(s => s.suggestion)
      }
    }

    if (warnings.length > 0 || suggestions.length > 0) {
      return {
        status: 'needs-migration',
        details: 'The system has been partially migrated，But further optimization is needed',
        suggestions: [...warnings, ...suggestions.map(s => s.suggestion)]
      }
    }

    return {
      status: 'ready',
      details: 'The system has been completely migrated to core2',
      suggestions: []
    }
  }

  /**
   * Provides backward-compatible global exports
   */
  static setupLegacyExports(): void {
    if (typeof window === 'undefined') return

    const win = window as any

    // Provides backward-compatible global objects
    if (!win.__CARD2_CORE2__) {
      win.__CARD2_CORE2__ = {
        componentRegistry,
        DataSourceMapper,
        PropertyExposureManager,
        FormGenerator,
        InteractionManager,
        getMigrationStatus: this.getMigrationStatus.bind(this),
        getCompatibilityWarnings: this.getCompatibilityWarnings.bind(this),
        performMigrationCheck: this.performMigrationCheck.bind(this)
      }
    }

    // If the old system exists，Provide compatibility bridge
    if (win.__CARD2_CORE__) {
      console.warn('[LegacyAdapter] Old version detected core system，It is recommended to migrate to core2')

      // Provide compatibility bridging functions
      win.__CARD2_CORE2__.legacyBridge = {
        getComponent: (type: string) => componentRegistry.get(type),
        hasComponent: (type: string) => componentRegistry.has(type),
        getComponentTree: () => componentRegistry.getComponentTree()
      }
    }
  }

  /**
   * Initialize backwards compatibility
   */
  static initialize(): void {
    this.setupLegacyExports()
  }
}

/**
 * Default export
 */
export default LegacyAdapter