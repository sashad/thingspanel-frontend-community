/**
 * Configuration system robustness enhancement
 * Handle edge cases、storage limit、Concurrency issues, etc.
 *
 * 🔥 In-depth analysis of user feedback，Make sure it's not"Solving problems by writing them down"
 */

import { configurationStateManager } from '@/components/visual-editor/configuration/ConfigurationStateManager'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'

/**
 * Storage capacity check results
 */
interface StorageCapacityCheck {
  isAvailable: boolean
  usedSpace: number
  totalSpace: number
  remainingSpace: number
  warningThreshold: number
  errorDetails?: string
}

/**
 * Configuration consistency check results
 */
interface ConfigurationConsistencyCheck {
  isConsistent: boolean
  inconsistentComponents: string[]
  cacheDataMismatches: Array<{
    componentId: string
    configHash: string
    cacheHash: string
    issue: string
  }>
}

/**
 * Configuring System Robustness Manager
 */
export class ConfigurationRobustnessManager {
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit
  private readonly WARNING_THRESHOLD = 0.8 // 80% Usage warning

  /**
   * Check storage capacity status - 🔥 RemovedlocalStoragerely
   */
  checkStorageCapacity(): StorageCapacityCheck {
    // 🔥 Configuration completely relies on the unified configuration center，No need to checklocalStoragecapacity
    return {
      isAvailable: true,
      usedSpace: 0,
      totalSpace: Number.MAX_SAFE_INTEGER,
      remainingSpace: Number.MAX_SAFE_INTEGER,
      warningThreshold: Number.MAX_SAFE_INTEGER,
      errorDetails: undefined
    }
  }

  /**
   * Check the consistency of configuration and data cache
   */
  async checkConfigurationConsistency(): Promise<ConfigurationConsistencyCheck> {
    const inconsistentComponents: string[] = []
    const cacheDataMismatches: Array<{
      componentId: string
      configHash: string
      cacheHash: string
      issue: string
    }> = []

    try {
      // Get all configuration status
      const allStates = configurationStateManager.getAllConfigurationStates()

      for (const [componentId, state] of allStates) {
        // Check configuration hash
        const configHash = this.hashConfiguration(state.configuration)

        // Check cached data
        const cachedData = simpleDataBridge.getComponentData(componentId)
        let cacheHash = ''
        let issue = ''

        if (cachedData) {
          cacheHash = this.hashData(cachedData)

          // Check timestamp plausibility
          if (state.updatedAt > Date.now()) {
            issue = 'Configuration timestamp exception（future time）'
            inconsistentComponents.push(componentId)
          }

          // Check the rationality of data structure
          if (this.isCircularStructure(cachedData)) {
            issue = 'Cache data contains circular references'
            inconsistentComponents.push(componentId)
          }
        } else if (state.configuration.dataSource) {
          // Configuration but no cache，May need to reload
          issue = 'There is data source configuration but no cached data'
          inconsistentComponents.push(componentId)
        }

        if (issue) {
          cacheDataMismatches.push({
            componentId,
            configHash,
            cacheHash,
            issue
          })
        }
      }

      return {
        isConsistent: inconsistentComponents.length === 0,
        inconsistentComponents,
        cacheDataMismatches
      }
    } catch (error) {
      return {
        isConsistent: false,
        inconsistentComponents: ['__check_failed__'],
        cacheDataMismatches: [
          {
            componentId: '__system__',
            configHash: '',
            cacheHash: '',
            issue: `Consistency check exception: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      }
    }
  }

  /**
   * Fix configuration inconsistencies
   */
  async repairConfigurationInconsistencies(): Promise<{
    repairedCount: number
    failedComponents: string[]
    repairLog: string[]
  }> {
    const repairLog: string[] = []
    const failedComponents: string[] = []
    let repairedCount = 0

    try {
      const consistencyCheck = await this.checkConfigurationConsistency()

      for (const mismatch of consistencyCheck.cacheDataMismatches) {
        const { componentId, issue } = mismatch

        try {
          if (issue.includes('No cached data')) {
            // Clean and re-execute data acquisition
            simpleDataBridge.clearComponentCache(componentId)
            repairLog.push(`🔧 [Repair] Clear component cache: ${componentId}`)
            repairedCount++
          } else if (issue.includes('circular reference')) {
            // Clean problematic cached data
            simpleDataBridge.clearComponentCache(componentId)
            repairLog.push(`🧹 [Repair] Clean circular reference cache: ${componentId}`)
            repairedCount++
          } else if (issue.includes('Timestamp exception')) {
            // Reset configuration to correct timestamps
            const config = configurationStateManager.getConfiguration(componentId)
            if (config) {
              configurationStateManager.setConfiguration(componentId, config, 'repair')
              repairLog.push(`⏰ [Repair] Fix configuration timestamp: ${componentId}`)
              repairedCount++
            }
          }
        } catch (error) {
          failedComponents.push(componentId)
          repairLog.push(`❌ [Repair] Repair failed ${componentId}: ${error}`)
        }
      }

      return {
        repairedCount,
        failedComponents,
        repairLog
      }
    } catch (error) {
      repairLog.push(`❌ [Repair] Abnormal repair process: ${error}`)
      return {
        repairedCount: 0,
        failedComponents: ['__repair_failed__'],
        repairLog
      }
    }
  }

  /**
   * Generate configuration hash（for consistency checking）
   */
  private hashConfiguration(config: WidgetConfiguration): string {
    try {
      const configString = JSON.stringify(config, Object.keys(config).sort())
      return this.simpleHash(configString)
    } catch {
      return 'hash_error'
    }
  }

  /**
   * Generate data hash
   */
  private hashData(data: any): string {
    try {
      const dataString = JSON.stringify(data)
      return this.simpleHash(dataString.substring(0, 1000)) // Only take the front1000Characters to avoid performance issues
    } catch {
      return 'hash_error'
    }
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Check for circular references
   */
  private isCircularStructure(obj: any, seen = new WeakSet()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false
    }

    if (seen.has(obj)) {
      return true
    }

    seen.add(obj)

    try {
      for (const key in obj) {
        if (this.isCircularStructure(obj[key], seen)) {
          return true
        }
      }
    } catch {
      return true // Access errors are also considered circular references
    }

    seen.delete(obj)
    return false
  }

  /**
   * Get system health status report
   */
  async getSystemHealthReport(): Promise<{
    storage: StorageCapacityCheck
    consistency: ConfigurationConsistencyCheck
    recommendations: string[]
    overallHealth: 'good' | 'warning' | 'critical'
  }> {
    const storage = this.checkStorageCapacity()
    const consistency = await this.checkConfigurationConsistency()
    const recommendations: string[] = []

    // Storage recommendations
    if (!storage.isAvailable) {
      recommendations.push('🚨 Not enough storage space，It is recommended to clean up useless configurations or upgrade storage solutions')
    } else if (storage.usedSpace > storage.warningThreshold) {
      recommendations.push('⚠️ High storage usage，It is recommended to clean the old configuration regularly')
    }

    // Consistency recommendations
    if (!consistency.isConsistent) {
      recommendations.push('🔧 Found configuration inconsistencies，It is recommended to perform automatic repair')
    }

    if (consistency.cacheDataMismatches.length > 0) {
      recommendations.push('🧹 It is recommended to clear abnormal cache data to improve system stability')
    }

    // Overall health status assessment
    let overallHealth: 'good' | 'warning' | 'critical' = 'good'

    if (!storage.isAvailable || !consistency.isConsistent) {
      overallHealth = 'critical'
    } else if (storage.usedSpace > storage.warningThreshold || consistency.cacheDataMismatches.length > 0) {
      overallHealth = 'warning'
    }

    return {
      storage,
      consistency,
      recommendations,
      overallHealth
    }
  }
}

/**
 * Global robustness manager instance
 */
export const configurationRobustnessManager = new ConfigurationRobustnessManager()

/**
 * Automatic health check of development environment
 */
if (import.meta.env.DEV) {
  // Delayed execution，Avoid affecting initialization
  setTimeout(async () => {
    try {
      const healthReport = await configurationRobustnessManager.getSystemHealthReport()

      if (healthReport.recommendations.length > 0) {
        healthReport.recommendations.forEach(rec => {})
      }

      // If there are any inconsistencies，Provide repair options
    } catch (error) {}
  }, 3000)
}
