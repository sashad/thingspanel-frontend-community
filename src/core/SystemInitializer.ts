/**
 * System unified initialization manager
 * Integrate the initialization process of all subsystems，Provide unified startup and status management
 */

// 🔥 Deleted：OptimizedConfigurationManager Over-engineered caching layer removed
// use ConfigurationIntegrationBridge Provide configuration management services
import { optimizedInitializationManager } from '@/card2.1/core2/OptimizedInitializationManager'
import { typeCompatibilityChecker } from '@/core/data-architecture/TypeCompatibilityChecker'

/**
 * Subsystem status enumeration
 */
export enum SubSystemStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  FAILED = 'failed'
}

/**
 * Subsystem initialization configuration
 */
export interface SubSystemConfig {
  /** Subsystem name */
  name: string
  /** Subsystem display name */
  displayName: string
  /** Initialization priority（The smaller the value, the earlier it is executed.） */
  priority: number
  /** initialization function */
  initialize: () => Promise<void>
  /** Is it necessary（Whether to prevent the system from starting on failure） */
  required: boolean
  /** Other dependent subsystems */
  dependencies: string[]
  /** timeout（millisecond） */
  timeout: number
  /** health check function */
  healthCheck?: () => Promise<boolean>
  /** Number of retries */
  retries?: number
}

/**
 * Subsystem status information
 */
export interface SubSystemState {
  /** Subsystem name */
  name: string
  /** Current status */
  status: SubSystemStatus
  /** Initialization start time */
  startTime?: number
  /** Initialization end time */
  endTime?: number
  /** Initialization time-consuming（millisecond） */
  duration?: number
  /** error message */
  error?: string
  /** Number of retries */
  retriesCount: number
  /** health check status */
  healthStatus?: boolean
}

/**
 * System initialization state
 */
export interface SystemInitializationState {
  /** Has it been initialized? */
  isInitialized: boolean
  /** Is initializing */
  isInitializing: boolean
  /** System startup time */
  startTime?: number
  /** System startup completion time */
  endTime?: number
  /** Total initialization time */
  totalDuration?: number
  /** Subsystem state mapping */
  subSystems: Map<string, SubSystemState>
  /** Subsystem that failed to initialize */
  failedSubSystems: string[]
  /** Number of subsystems successfully initialized */
  successCount: number
  /** Total number of subsystems */
  totalCount: number
}

/**
 * Initialization options
 */
export interface InitializationOptions {
  /** Whether to force reinitialization */
  forceReload?: boolean
  /** Whether to allow partial failure */
  allowPartialFailure?: boolean
  /** Limit on the number of concurrent initializations */
  concurrencyLimit?: number
  /** Global timeout（millisecond） */
  globalTimeout?: number
  /** Whether to enable health checks */
  enableHealthCheck?: boolean
  /** subsystem to skip */
  skipSubSystems?: string[]
}

/**
 * Unified system initialization manager
 */
export class SystemInitializer {
  private static instance: SystemInitializer | null = null

  /** Subsystem configuration registry */
  private subSystemConfigs = new Map<string, SubSystemConfig>()

  /** System initialization state */
  private state: SystemInitializationState = {
    isInitialized: false,
    isInitializing: false,
    subSystems: new Map(),
    failedSubSystems: [],
    successCount: 0,
    totalCount: 0
  }

  /** Initialize lock */
  private initializationPromise: Promise<void> | null = null

  /** event listener */
  private eventListeners = new Map<string, Array<(...args: any[]) => void>>()

  private constructor() {
    this.registerBuiltInSubSystems()
  }

  public static getInstance(): SystemInitializer {
    if (!this.instance) {
      this.instance = new SystemInitializer()
    }
    return this.instance
  }

  /**
   * Register built-in subsystem
   */
  private registerBuiltInSubSystems(): void {
    // 1. configuration manager
    this.registerSubSystem({
      name: 'configuration-manager',
      displayName: 'configuration manager',
      priority: 1,
      required: true,
      dependencies: [],
      timeout: 5000,
      retries: 2,
      initialize: async () => {
        // Configuration managers generally do not require asynchronous initialization，But you can perform preheating here
        if (process.env.NODE_ENV === 'development') {
        }
      },
      healthCheck: async () => {
        // 🔥 Migrated：Configuration management now passes ConfigurationIntegrationBridge deal with
        return true
      }
    })

    // 2. Card2.1 system
    this.registerSubSystem({
      name: 'card2-system',
      displayName: 'Card2.1 component system',
      priority: 2,
      required: true,
      dependencies: ['configuration-manager'],
      timeout: 15000,
      retries: 3,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        await optimizedInitializationManager.initialize({ forceReload: false })
      },
      healthCheck: async () => {
        const stats = optimizedInitializationManager.getCacheStats()
        return stats.isInitialized && stats.componentCount > 0
      }
    })

    // 3. Type Compatibility Checker
    this.registerSubSystem({
      name: 'type-checker',
      displayName: 'Type Compatibility Checker',
      priority: 3,
      required: false,
      dependencies: ['configuration-manager'],
      timeout: 3000,
      retries: 1,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        // Preheat type mapping table
        typeCompatibilityChecker.getTypeMappingStats()
      },
      healthCheck: async () => {
        const stats = typeCompatibilityChecker.getTypeMappingStats()
        return stats.totalMappings > 0
      }
    })

    // 4. data architecture system（Optional）
    this.registerSubSystem({
      name: 'data-architecture',
      displayName: 'data architecture system',
      priority: 4,
      required: false,
      dependencies: ['configuration-manager', 'type-checker'],
      timeout: 8000,
      retries: 2,
      initialize: async () => {
        if (process.env.NODE_ENV === 'development') {
        }
        // Here you can initialize other data architecture related components
        // If there are other asynchronous initialization requirements，can be added here
      },
      healthCheck: async () => {
        // Simple health check
        return true
      }
    })
  }

  /**
   * Register subsystem
   */
  public registerSubSystem(config: SubSystemConfig): void {
    this.subSystemConfigs.set(config.name, config)

    // Initialize subsystem state
    this.state.subSystems.set(config.name, {
      name: config.name,
      status: SubSystemStatus.PENDING,
      retriesCount: 0
    })

    this.state.totalCount = this.subSystemConfigs.size
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Initialize all subsystems uniformly
   */
  public async initialize(options: InitializationOptions = {}): Promise<void> {
    // Prevent repeated initialization
    if (this.state.isInitialized && !options.forceReload) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization(options)

    try {
      await this.initializationPromise
    } finally {
      this.initializationPromise = null
    }
  }

  /**
   * Execute initialization process
   */
  private async performInitialization(options: InitializationOptions): Promise<void> {
    const {
      allowPartialFailure = true,
      concurrencyLimit = 3,
      globalTimeout = 60000,
      enableHealthCheck = true,
      skipSubSystems = []
    } = options

    this.state.isInitializing = true
    this.state.startTime = Date.now()
    this.state.failedSubSystems = []
    this.state.successCount = 0

    if (process.env.NODE_ENV === 'development') {
    }
    this.emit('initialization-started', this.getInitializationState())

    try {
      // Get initialization sequence
      const initializationOrder = this.resolveInitializationOrder(skipSubSystems)
      if (process.env.NODE_ENV === 'development') {
      }

      // Global timeout control
      const initPromise = this.executeInitializationSequence(initializationOrder, concurrencyLimit, enableHealthCheck)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('System initialization timeout')), globalTimeout)
      })

      await Promise.race([initPromise, timeoutPromise])

      // Check initialization results
      const hasRequiredFailures = this.state.failedSubSystems.some(name => {
        const config = this.subSystemConfigs.get(name)
        return config?.required
      })

      if (hasRequiredFailures && !allowPartialFailure) {
        throw new Error(`Required subsystem initialization failed: ${this.state.failedSubSystems.join(', ')}`)
      }

      this.state.isInitialized = true
      this.state.endTime = Date.now()
      this.state.totalDuration = this.state.endTime - this.state.startTime!

      if (process.env.NODE_ENV === 'development') {
      }

      if (this.state.failedSubSystems.length > 0) {
        console.error(`⚠️ [SystemInitializer] failed subsystem: ${this.state.failedSubSystems.join(', ')}`)
      }

      this.emit('initialization-completed', this.getInitializationState())
    } catch (error) {
      console.error('❌ [SystemInitializer] System initialization failed:', error)
      this.emit('initialization-failed', { error: error.message, state: this.getInitializationState() })
      throw error
    } finally {
      this.state.isInitializing = false
    }
  }

  /**
   * Parse initialization sequence（topological sort）
   */
  private resolveInitializationOrder(skipSubSystems: string[]): SubSystemConfig[] {
    const configs = Array.from(this.subSystemConfigs.values()).filter(config => !skipSubSystems.includes(config.name))

    // Simplified topological sort：Sort by priority and dependencies
    const sorted: SubSystemConfig[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (config: SubSystemConfig) => {
      if (visiting.has(config.name)) {
        throw new Error(`Circular dependency detected: ${config.name}`)
      }

      if (visited.has(config.name)) {
        return
      }

      visiting.add(config.name)

      // Deal with dependencies first
      for (const depName of config.dependencies) {
        const depConfig = this.subSystemConfigs.get(depName)
        if (depConfig && !skipSubSystems.includes(depName)) {
          visit(depConfig)
        }
      }

      visiting.delete(config.name)
      visited.add(config.name)
      sorted.push(config)
    }

    // Topological sorting after sorting by priority
    const prioritySorted = configs.sort((a, b) => a.priority - b.priority)
    for (const config of prioritySorted) {
      if (!visited.has(config.name)) {
        visit(config)
      }
    }

    return sorted
  }

  /**
   * Execute initialization sequence
   */
  private async executeInitializationSequence(
    configs: SubSystemConfig[],
    concurrencyLimit: number,
    enableHealthCheck: boolean
  ): Promise<void> {
    // Simplified version：serial execution（Can be subsequently optimized to dependency-based parallel execution）
    for (const config of configs) {
      await this.initializeSubSystem(config, enableHealthCheck)
    }
  }

  /**
   * Initialize a single subsystem
   */
  private async initializeSubSystem(config: SubSystemConfig, enableHealthCheck: boolean): Promise<void> {
    const state = this.state.subSystems.get(config.name)!
    const maxRetries = config.retries || 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        state.status = SubSystemStatus.INITIALIZING
        state.startTime = Date.now()
        state.retriesCount = attempt

        if (process.env.NODE_ENV === 'development') {
        }
        this.emit('subsystem-initializing', { name: config.name, attempt: attempt + 1 })

        // Perform initialization
        const initPromise = config.initialize()
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), config.timeout)
        })

        await Promise.race([initPromise, timeoutPromise])

        // health check
        if (enableHealthCheck && config.healthCheck) {
          const isHealthy = await config.healthCheck()
          state.healthStatus = isHealthy

          if (!isHealthy) {
            throw new Error('Health check failed')
          }
        }

        // Initialization successful
        state.status = SubSystemStatus.INITIALIZED
        state.endTime = Date.now()
        state.duration = state.endTime - state.startTime!
        this.state.successCount++

        if (process.env.NODE_ENV === 'development') {
        }
        this.emit('subsystem-initialized', { name: config.name, duration: state.duration })

        return // success，Exit retry loop
      } catch (error) {
        console.error(`❌ [SystemInitializer] Subsystem initialization failed: ${config.displayName}, mistake:`, error.message)

        if (attempt === maxRetries) {
          // All retries failed
          state.status = SubSystemStatus.FAILED
          state.error = error.message
          state.endTime = Date.now()
          state.duration = state.endTime - state.startTime!
          this.state.failedSubSystems.push(config.name)

          this.emit('subsystem-failed', { name: config.name, error: error.message, attempt: attempt + 1 })

          if (config.required) {
            throw new Error(`Required subsystem initialization failed: ${config.displayName}`)
          }
          return
        }

        // Wait for some time and try again
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  /**
   * Get initialization status
   */
  public getInitializationState(): SystemInitializationState {
    return {
      ...this.state,
      subSystems: new Map(this.state.subSystems) // Create a copy
    }
  }

  /**
   * Get subsystem status
   */
  public getSubSystemState(name: string): SubSystemState | undefined {
    return this.state.subSystems.get(name)
  }

  /**
   * Check if the system has been initialized
   */
  public isInitialized(): boolean {
    return this.state.isInitialized
  }

  /**
   * Check if initializing
   */
  public isInitializing(): boolean {
    return this.state.isInitializing
  }

  /**
   * Perform a system health check
   */
  public async performHealthCheck(): Promise<{ healthy: boolean; details: Record<string, boolean> }> {
    const details: Record<string, boolean> = {}
    let allHealthy = true

    for (const [name, config] of this.subSystemConfigs) {
      if (config.healthCheck) {
        try {
          const isHealthy = await config.healthCheck()
          details[name] = isHealthy
          if (!isHealthy) allHealthy = false
        } catch {
          details[name] = false
          allHealthy = false
        }
      } else {
        const state = this.state.subSystems.get(name)
        details[name] = state?.status === SubSystemStatus.INITIALIZED
        if (state?.status !== SubSystemStatus.INITIALIZED) allHealthy = false
      }
    }

    return { healthy: allHealthy, details }
  }

  /**
   * Reinitializing failed subsystems
   */
  public async reinitializeFailedSystems(): Promise<void> {
    const failedSystems = [...this.state.failedSubSystems]

    if (failedSystems.length === 0) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }


    for (const systemName of failedSystems) {
      const config = this.subSystemConfigs.get(systemName)
      if (config) {
        await this.initializeSubSystem(config, true)
      }
    }
  }

  /**
   * event listener
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * launch event
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(...args))
    }
  }

  /**
   * Get initialization statistics
   */
  public getInitializationStats() {
    const subSystemStats = Array.from(this.state.subSystems.values()).reduce(
      (acc, state) => {
        acc[state.status] = (acc[state.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalSystems: this.state.totalCount,
      successCount: this.state.successCount,
      failedCount: this.state.failedSubSystems.length,
      isInitialized: this.state.isInitialized,
      isInitializing: this.state.isInitializing,
      totalDuration: this.state.totalDuration,
      subSystemStats
    }
  }
}

/**
 * Export singleton instance
 */
export const systemInitializer = SystemInitializer.getInstance()

/**
 * Convenient initialization method
 */
export async function initializeSystem(options?: InitializationOptions): Promise<void> {
  await systemInitializer.initialize(options)
}

/**
 * Check system status
 */
export function getSystemInitializationState(): SystemInitializationState {
  return systemInitializer.getInitializationState()
}

/**
 * Perform a system health check
 */
export async function performSystemHealthCheck() {
  return await systemInitializer.performHealthCheck()
}

// Development environment debugging interface
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__SYSTEM_INITIALIZER__ = {
    initializer: systemInitializer,
    initialize: initializeSystem,
    getState: getSystemInitializationState,
    healthCheck: performSystemHealthCheck,
    getStats: () => systemInitializer.getInitializationStats(),
    reinitializeFailed: () => systemInitializer.reinitializeFailedSystems()
  }
}
