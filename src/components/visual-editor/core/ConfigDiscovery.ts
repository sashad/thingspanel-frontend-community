/**
 * Configure component automatic discovery mechanism
 * Automatically scan and register all configuration components，Supports multiple configuration component formats
 *
 * Performance optimization features：
 * - caching mechanism：Avoid scanning the same file twice
 * - parallel scan：Handle multiple scanning tasks simultaneously
 * - Lazy loading：Load configuration components on demand
 * - Smart filtering：Filter invalid paths in advance
 * - Performance monitoring：Track scan time and statistics
 */

import { defineAsyncComponent, type Component } from 'vue'
import { configRegistry } from '@/core/interaction-system'
import componentRegistry from '@/card2.1'
import type { IComponentDefinition, IConfigComponent } from '@/card2.1/core'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigDiscovery')

// ====== Configure component path mode ======

// Card 2.1 Configure component path
const CARD21_CONFIG_PATTERNS = [
  './src/card2.1/components/*/*/card-config.vue',
  './src/card2.1/components/*/*/config.vue',
  './src/card2.1/components/*/*/*-config.vue',
  './src/card2.1/components/*/*/*Config.vue'
]

// original Panel Configure component path
const LEGACY_CONFIG_PATTERNS = [
  './src/card/builtin-card/*/component.vue', // Built-in cards are not individually configured
  './src/card/chart-card/*/card-config.vue',
  './src/card/chart-card/*/switch-config.vue' // special switch Configuration
]

// Visual Editor Private configuration component path
const VISUAL_EDITOR_CONFIG_PATTERNS = [
  './src/components/visual-editor/components/config/*Config.vue'
]

// ====== Configure component metadata ======

interface ConfigComponentMeta {
  id: string
  component: Component
  filePath: string
  type: 'card21' | 'legacy' | 'visual-editor'
  format: 'vue-component' | 'async-component'
  componentId?: string
  priority: number // priority，数字越大priority越高
  // Performance optimization fields
  lastModified?: number // File last modified time
  loadTime?: number // Component loading time(ms)
  cached?: boolean // Is it cached?
  loadCount?: number // Load times
}

// cache interface
interface ScanCache {
  timestamp: number
  filePaths: Set<string>
  componentMetas: Map<string, ConfigComponentMeta>
  stats: PerformanceStats
}

// Performance statistics interface
interface PerformanceStats {
  totalScanTime: number
  fileCount: number
  successCount: number
  errorCount: number
  cacheHitCount: number
  avgLoadTime: number
  lastScanTime?: number
}

// ====== Configure the discoverer class ======

export class ConfigDiscovery {
  private discovered = new Map<string, ConfigComponentMeta>()
  private isInitialized = false
  private isScanning = false

  // Performance optimization properties
  private scanCache: ScanCache | null = null
  private cacheExpireTime = 5 * 60 * 1000 // 5minutes cache expiration
  private maxConcurrency = 4 // Maximum number of concurrent scans
  private performanceStats: PerformanceStats = {
    totalScanTime: 0,
    fileCount: 0,
    successCount: 0,
    errorCount: 0,
    cacheHitCount: 0,
    avgLoadTime: 0
  }

  constructor() {
    this.setupGlobalErrorHandler()
    this.loadCacheFromStorage()
  }

  // ====== Initialize and scan ======

  /**
   * Initialize configuration discoverer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Configuration discoverer initialized')
      return
    }

    if (this.isScanning) {
      logger.info('Configuration discoverer is scanning...')
      return
    }

    const startTime = performance.now()

    try {
      this.isScanning = true
      logger.info('Start initializing configuration discoverer...')

      // Check if cache is available
      if (this.isCacheValid()) {
        logger.info('Load configuration components using cached data')
        this.loadFromCache()
        this.performanceStats.cacheHitCount++
      } else {
        logger.info('Cache expired or invalid，Rescan configuration components')

        // Scan various types of configuration components in parallel
        await Promise.all([this.scanCard21Configs(), this.scanLegacyConfigs(), this.scanVisualEditorConfigs()])

        // Save to cache
        this.saveCacheToStorage()
      }

      // Register discovered configuration components
      await this.registerDiscoveredConfigs()

      this.isInitialized = true

      const endTime = performance.now()
      this.performanceStats.totalScanTime = endTime - startTime
      this.performanceStats.lastScanTime = Date.now()

      logger.info(
        `配置Discover器初始化完成，Discover ${this.discovered.size} configuration components，time consuming ${Math.round(this.performanceStats.totalScanTime)}ms`
      )
    } catch (error) {
      this.performanceStats.errorCount++
      logger.error('Configuration discoverer initialization failed:', error)
      throw error
    } finally {
      this.isScanning = false
    }
  }

  /**
   * scanning Card 2.1 Configure components
   */
  private async scanCard21Configs(): Promise<void> {
    const scanStart = performance.now()
    logger.info('scanning Card 2.1 Configure components...')

    try {
      // use Vite of import.meta.glob Scan profile
      const configModules = import.meta.glob([
        '/src/card2.1/components/*/*/card-config.vue',
        '/src/card2.1/components/*/*/config.vue',
        '/src/card2.1/components/*/*/*-config.vue',
        '/src/card2.1/components/*/*/*Config.vue'
      ])

      const filePaths = Object.keys(configModules)
      this.performanceStats.fileCount += filePaths.length

      // Smart filtering：Only handle valid file paths
      const validPaths = this.filterValidPaths(filePaths, 'card21')

      // Concurrency limit handling
      await this.processBatch(validPaths, async filePath => {
        const moduleLoader = configModules[filePath]
        const componentLoadStart = performance.now()

        try {
          // Infer components from file pathID
          const componentId = this.extractComponentIdFromPath(filePath, 'card21')

          if (componentId) {
            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-config`,
              component: this.createOptimizedAsyncComponent(moduleLoader as any, componentId),
              filePath,
              type: 'card21',
              format: 'async-component',
              componentId,
              priority: 100, // Card 2.1 Configuration has the highest priority
              loadTime: performance.now() - componentLoadStart,
              cached: false,
              loadCount: 0
            }

            this.discovered.set(configMeta.id, configMeta)
            this.performanceStats.successCount++
            logger.debug(`Discover Card 2.1 Configure components: ${componentId}`)
          }
        } catch (error) {
          this.performanceStats.errorCount++
          logger.warn(`scanning Card 2.1 Failed to configure component: ${filePath}`, error)
        }
      })

      const scanTime = performance.now() - scanStart
      logger.info(`scanning Card 2.1 Configuration component completed，Discover ${validPaths.length} indivual，time consuming ${Math.round(scanTime)}ms`)
    } catch (error) {
      this.performanceStats.errorCount++
      logger.error('scanning Card 2.1 Failed to configure component:', error)
    }
  }

  /**
   * Scan original Panel Configure components
   */
  private async scanLegacyConfigs(): Promise<void> {
    logger.info('Scan original Panel Configure components...')

    try {
      // scanning chart-card Configure components
      const chartConfigModules = import.meta.glob([
        '/src/card/chart-card/*/card-config.vue',
        '/src/card/chart-card/*/switch-config.vue'
      ])

      for (const [filePath, moduleLoader] of Object.entries(chartConfigModules)) {
        try {
          const componentId = this.extractComponentIdFromPath(filePath, 'legacy')

          if (componentId) {
            // Check if there is already Card 2.1 Version
            const card21Version = `${componentId}-config`
            if (this.discovered.has(card21Version)) {
              logger.debug(`Skip original configuration components ${componentId}，Already Card 2.1 Version`)
              continue
            }

            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-config-legacy`,
              component: defineAsyncComponent(moduleLoader as any),
              filePath,
              type: 'legacy',
              format: 'async-component',
              componentId,
              priority: 50 // Original configuration priority is medium
            }

            this.discovered.set(configMeta.id, configMeta)
            logger.debug(`Discover original configuration components: ${componentId}`)
          }
        } catch (error) {
          logger.warn(`Scanning original configuration components failed: ${filePath}`, error)
        }
      }

      logger.info(`Scanning original configuration components completed，Discover ${Object.keys(chartConfigModules).length} indivual`)
    } catch (error) {
      logger.error('Scanning original configuration components failed:', error)
    }
  }

  /**
   * scanning Visual Editor Dedicated configuration components
   */
  private async scanVisualEditorConfigs(): Promise<void> {
    logger.info('scanning Visual Editor Configure components...')

    try {
      const visualEditorConfigModules = import.meta.glob([
        '/src/components/visual-editor/components/config/*Config.vue'
      ])

      for (const [filePath, moduleLoader] of Object.entries(visualEditorConfigModules)) {
        try {
          const componentId = this.extractComponentIdFromPath(filePath, 'visual-editor')

          if (componentId) {
            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-ve-config`,
              component: defineAsyncComponent(moduleLoader as any),
              filePath,
              type: 'visual-editor',
              format: 'async-component',
              componentId,
              priority: 75 // Visual Editor Configuration priority is higher
            }

            this.discovered.set(configMeta.id, configMeta)
            logger.debug(`Discover Visual Editor Configure components: ${componentId}`)
          }
        } catch (error) {
          logger.warn(`scanning Visual Editor Failed to configure component: ${filePath}`, error)
        }
      }

      logger.info(`scanning Visual Editor Configuration component completed，Discover ${Object.keys(visualEditorConfigModules).length} indivual`)
    } catch (error) {
      logger.error('scanning Visual Editor Failed to configure component:', error)
    }
  }

  // ====== Performance optimization tool methods ======

  /**
   * Intelligent filtering of valid file paths
   */
  private filterValidPaths(filePaths: string[], type: string): string[] {
    return filePaths.filter(path => {
      // Basic path verification
      if (!path || path.includes('/node_modules/') || path.includes('/.git/')) {
        return false
      }

      // type specific validation
      switch (type) {
        case 'card21':
          return (
            path.includes('/card2.1/components/') &&
            (path.endsWith('-config.vue') || path.endsWith('Config.vue') || path.endsWith('config.vue'))
          )
        case 'legacy':
          return path.includes('/card/') && path.endsWith('.vue')
        case 'visual-editor':
          return (
            path.includes('/visual-editor/') && (path.endsWith('Config.vue') || path.endsWith('PropertyEditor.vue'))
          )
        default:
          return true
      }
    })
  }

  /**
   * Process files in batches，Support concurrency control
   */
  private async processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void> {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += this.maxConcurrency) {
      batches.push(items.slice(i, i + this.maxConcurrency))
    }

    for (const batch of batches) {
      await Promise.all(batch.map(processor))
    }
  }

  /**
   * Create optimized asynchronous components
   */
  private createOptimizedAsyncComponent(moduleLoader: any, componentId: string): Component {
    return defineAsyncComponent({
      loader: async () => {
        const loadStart = performance.now()
        try {
          const module = await moduleLoader()
          const loadTime = performance.now() - loadStart

          // Update statistics
          const meta = this.discovered.get(`${componentId}-config`)
          if (meta) {
            meta.loadCount = (meta.loadCount || 0) + 1
            meta.loadTime = loadTime
          }

          return module
        } catch (error) {
          logger.error(`Failed to load configuration component: ${componentId}`, error)
          throw error
        }
      },
      delay: 200,
      timeout: 5000,
      errorComponent: () => {
        logger.warn(`Configure component loading timeout: ${componentId}`)
        return null
      },
      loadingComponent: () => null
    })
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.scanCache) return false

    const now = Date.now()
    const expired = now - this.scanCache.timestamp > this.cacheExpireTime

    return !expired && this.scanCache.componentMetas.size > 0
  }

  /**
   * Load data from cache
   */
  private loadFromCache(): void {
    if (!this.scanCache) return

    this.discovered.clear()
    for (const [id, meta] of this.scanCache.componentMetas) {
      meta.cached = true
      this.discovered.set(id, meta)
    }

    // Restore performance statistics
    Object.assign(this.performanceStats, this.scanCache.stats)
  }

  /**
   * Load cache from local storage
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheKey = 'config-discovery-cache'
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        const parsedCache = JSON.parse(cached)

        // reconstruction Map and Set object
        this.scanCache = {
          timestamp: parsedCache.timestamp,
          filePaths: new Set(parsedCache.filePaths),
          componentMetas: new Map(parsedCache.componentMetas),
          stats: parsedCache.stats
        }

        logger.debug('Load cache from local storage successfully')
      }
    } catch (error) {
      logger.warn('Loading cache from local storage failed:', error)
      this.scanCache = null
    }
  }

  /**
   * Save cache to local storage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheKey = 'config-discovery-cache'
      const cacheData = {
        timestamp: Date.now(),
        filePaths: Array.from(new Set(Array.from(this.discovered.values()).map(m => m.filePath))),
        componentMetas: Array.from(this.discovered.entries()),
        stats: { ...this.performanceStats }
      }

      this.scanCache = {
        timestamp: cacheData.timestamp,
        filePaths: new Set(cacheData.filePaths),
        componentMetas: new Map(cacheData.componentMetas),
        stats: cacheData.stats
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      logger.debug('Cache saved to local storage')
    } catch (error) {
      logger.warn('Failed to save cache to local storage:', error)
    }
  }

  // ====== Tool method ======

  /**
   * Extract components from file pathID
   */
  private extractComponentIdFromPath(filePath: string, type: string): string | null {
    try {
      let componentId: string | null = null

      if (type === 'card21') {
        // Card 2.1: /src/card2.1/components/digit-indicator/DigitIndicatorConfig.vue -> chart-digit
        const match = filePath.match(/\/card2\.1\/components\/([^/]+)\//)
        if (match) {
          // Map paths to componentsID
          const pathToIdMap: Record<string, string> = {
            'digit-indicator': 'chart-digit'
          }
          componentId = pathToIdMap[match[1]] || match[1]
        }
      } else if (type === 'legacy') {
        // Legacy: /src/card/chart-card/bar/card-config.vue -> chart-bar
        const match = filePath.match(/\/card\/(chart-card|builtin-card)\/([^/]+)\//)
        if (match) {
          const cardType = match[1] === 'chart-card' ? 'chart' : 'builtin'
          componentId = `${cardType}-${match[2]}`
        }
      } else if (type === 'visual-editor') {
        // Visual Editor: /src/components/visual-editor/components/config/BarConfig.vue -> bar
        const match = filePath.match(/\/([^/]+)(?:Config|PropertyEditor)\.vue$/)
        if (match) {
          componentId = match[1]
            .toLowerCase()
            .replace(/([A-Z])/g, '-$1')
            .replace(/^-/, '')
        }
      }

      return componentId
    } catch (error) {
      logger.warn(`Extract components from pathIDfail: ${filePath}`, error)
      return null
    }
  }

  /**
   * Register discovered configuration components
   */
  private async registerDiscoveredConfigs(): Promise<void> {
    logger.info('Register discovered configuration components...')

    // Sort by priority
    const sortedConfigs = Array.from(this.discovered.values()).sort((a, b) => b.priority - a.priority)

    for (const configMeta of sortedConfigs) {
      try {
        if (configMeta.componentId) {
          // Check if the component exists
          const componentExists = componentRegistry.has(configMeta.componentId)

          if (componentExists || configMeta.type === 'visual-editor') {
            const configComponent: IConfigComponent = configMeta.component

            // Register to the configuration registry
            if (!configRegistry.has(configMeta.componentId)) {
              configRegistry.register(configMeta.componentId, configComponent)
              logger.debug(`Register configuration component: ${configMeta.componentId} (${configMeta.type})`)
            } else {
              logger.debug(`Configuration component already exists，Skip registration: ${configMeta.componentId} (${configMeta.type})`)
            }
          } else {
            logger.warn(`components ${configMeta.componentId} does not exist，Skip configuration registration`)
          }
        }
      } catch (error) {
        logger.error(`Failed to register configuration component: ${configMeta.id}`, error)
      }
    }

    logger.info(`Configuration component registration completed，Successfully registered ${sortedConfigs.length} indivual`)
  }

  // ====== Query method ======

  /**
   * Get all discovered configuration components
   */
  getDiscoveredConfigs(): ConfigComponentMeta[] {
    return Array.from(this.discovered.values())
  }

  /**
   * According to componentsIDGet configuration components
   */
  getConfigForComponent(componentId: string): ConfigComponentMeta | null {
    // Find configuration components by priority
    const candidates = Array.from(this.discovered.values())
      .filter(config => config.componentId === componentId)
      .sort((a, b) => b.priority - a.priority)

    return candidates[0] || null
  }

  /**
   * Get the configuration component of the specified type
   */
  getConfigsByType(type: 'card21' | 'legacy' | 'visual-editor'): ConfigComponentMeta[] {
    return Array.from(this.discovered.values()).filter(config => config.type === type)
  }

  /**
   * Check if configuration component exists
   */
  hasConfigForComponent(componentId: string): boolean {
    return this.getConfigForComponent(componentId) !== null
  }

  // ====== Runtime management ======

  /**
   * Dynamically add configuration components
   */
  addConfigComponent(meta: Omit<ConfigComponentMeta, 'id'>): void {
    const id = `${meta.componentId}-${meta.type}-config`
    const configMeta: ConfigComponentMeta = { ...meta, id }

    this.discovered.set(id, configMeta)

    // Register now
    if (meta.componentId) {
      const configComponent: IConfigComponent = meta.component

      if (!configRegistry.has(meta.componentId)) {
        configRegistry.register(meta.componentId, configComponent)
        logger.info(`Dynamically add configuration components: ${meta.componentId}`)
      } else {
        logger.info(`Configuration component already exists，Skip dynamic addition: ${meta.componentId}`)
      }
    }
  }

  /**
   * Remove configuration component
   */
  removeConfigComponent(componentId: string): void {
    const configsToRemove = Array.from(this.discovered.entries()).filter(
      ([_, config]) => config.componentId === componentId
    )

    configsToRemove.forEach(([id, config]) => {
      this.discovered.delete(id)
      if (config.componentId) {
        configRegistry.unregister(config.componentId)
      }
    })

    logger.info(`Remove configuration component: ${componentId}`)
  }

  /**
   * Rescan configuration components
   */
  async rescan(): Promise<void> {
    logger.info('Rescan configuration components...')

    // Clear existing findings
    this.discovered.clear()
    configRegistry.clear()

    // Reinitialize
    this.isInitialized = false
    await this.initialize()
  }

  // ====== Error handling ======

  /**
   * Set global error handler
   */
  private setupGlobalErrorHandler(): void {
    // Handling asynchronous component loading errors
    window.addEventListener('unhandledrejection', event => {
      if (event.reason?.message?.includes('config')) {
        logger.error('Configuration component loading error:', event.reason)
        // Error recovery logic can be implemented here
      }
    })
  }

  // ====== Debugging and statistics ======

  /**
   * Get discovery statistics
   */
  getStats() {
    const avgLoadTime =
      this.performanceStats.successCount > 0
        ? this.performanceStats.totalScanTime / this.performanceStats.successCount
        : 0

    const stats = {
      total: this.discovered.size,
      byType: {
        card21: 0,
        legacy: 0,
        visualEditor: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      performance: {
        ...this.performanceStats,
        avgLoadTime: Math.round(avgLoadTime * 100) / 100,
        cacheHitRate:
          this.performanceStats.fileCount > 0
            ? Math.round((this.performanceStats.cacheHitCount / this.performanceStats.fileCount) * 100)
            : 0,
        successRate:
          this.performanceStats.fileCount > 0
            ? Math.round((this.performanceStats.successCount / this.performanceStats.fileCount) * 100)
            : 0
      },
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        expireTime: this.cacheExpireTime,
        size: this.scanCache?.componentMetas.size || 0
      }
    }

    this.discovered.forEach(config => {
      stats.byType[config.type as keyof typeof stats.byType]++

      if (config.priority >= 100) stats.byPriority.high++
      else if (config.priority >= 50) stats.byPriority.medium++
      else stats.byPriority.low++
    })

    return stats
  }

  /**
   * Get detailed performance reports
   */
  getPerformanceReport() {
    const loadTimes = Array.from(this.discovered.values())
      .map(meta => meta.loadTime || 0)
      .filter(time => time > 0)

    const report = {
      overview: {
        totalComponents: this.discovered.size,
        totalScanTime: Math.round(this.performanceStats.totalScanTime),
        avgScanTime: Math.round(this.performanceStats.totalScanTime / Math.max(1, this.performanceStats.fileCount)),
        successRate: Math.round(
          (this.performanceStats.successCount / Math.max(1, this.performanceStats.fileCount)) * 100
        ),
        cacheHitRate: Math.round(
          (this.performanceStats.cacheHitCount / Math.max(1, this.performanceStats.fileCount)) * 100
        )
      },
      componentLoadTimes: {
        min: loadTimes.length > 0 ? Math.min(...loadTimes) : 0,
        max: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
        avg: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
        total: loadTimes.reduce((a, b) => a + b, 0)
      },
      errors: {
        count: this.performanceStats.errorCount,
        rate: Math.round((this.performanceStats.errorCount / Math.max(1, this.performanceStats.fileCount)) * 100)
      },
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        hitCount: this.performanceStats.cacheHitCount,
        expireTime: this.cacheExpireTime
      },
      lastScanTime: this.performanceStats.lastScanTime
        ? new Date(this.performanceStats.lastScanTime).toLocaleString()
        : 'Never'
    }

    return report
  }

  /**
   * Clear performance statistics
   */
  clearStats(): void {
    this.performanceStats = {
      totalScanTime: 0,
      fileCount: 0,
      successCount: 0,
      errorCount: 0,
      cacheHitCount: 0,
      avgLoadTime: 0
    }
    logger.info('Performance statistics cleared')
  }

  /**
   * clear cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem('config-discovery-cache')
      this.scanCache = null
      logger.info('cache cleared')
    } catch (error) {
      logger.warn('Clear cache failed:', error)
    }
  }

  /**
   * Export configuration discovery information
   */
  exportDiscoveryInfo() {
    return {
      timestamp: new Date().toISOString(),
      isInitialized: this.isInitialized,
      stats: this.getStats(),
      performanceReport: this.getPerformanceReport(),
      configs: Array.from(this.discovered.values()).map(config => ({
        id: config.id,
        componentId: config.componentId,
        type: config.type,
        filePath: config.filePath,
        priority: config.priority,
        loadTime: config.loadTime,
        loadCount: config.loadCount,
        cached: config.cached
      })),
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        size: this.scanCache?.componentMetas.size || 0,
        expireTime: this.cacheExpireTime
      }
    }
  }

  // ====== Clean up resources ======

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean discovered components
    this.discovered.clear()

    // reset state
    this.isInitialized = false
    this.isScanning = false

    // clear cache
    this.scanCache = null

    // Clear performance statistics
    this.clearStats()

    // Clear local storage cache
    try {
      localStorage.removeItem('config-discovery-cache')
    } catch (error) {
      logger.warn('Clearing local storage cache failed:', error)
    }

    logger.info('ConfigDiscovery Resources have been cleared')
  }
}

// ====== global instance ======

let globalConfigDiscovery: ConfigDiscovery | null = null

/**
 * Get global configuration discoverer instance
 */
export function getConfigDiscovery(): ConfigDiscovery {
  if (!globalConfigDiscovery) {
    globalConfigDiscovery = new ConfigDiscovery()
  }
  return globalConfigDiscovery
}

/**
 * Initialize configuration discoverer（Called when the application starts）
 */
export async function initializeConfigDiscovery(): Promise<void> {
  const discovery = getConfigDiscovery()
  await discovery.initialize()
}

/**
 * Reset configuration discoverer
 */
export function resetConfigDiscovery(): void {
  if (globalConfigDiscovery) {
    globalConfigDiscovery.dispose()
    globalConfigDiscovery = null
  }
}

export default ConfigDiscovery
