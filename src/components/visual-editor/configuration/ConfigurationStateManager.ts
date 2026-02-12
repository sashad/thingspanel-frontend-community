/**
 * Brand new configuration state manager
 * Based on configuration version control and content hash deduplication mechanism，Completely solve the infinite loop problem
 *
 * Core design principles：
 * 1. Configure version control - Each configuration has a unique version number and content hash
 * 2. Content deduplication mechanism - Identical content will not trigger updates，Even if the object references are different
 * 3. One-way data flow - Strict data flow，Avoid two-way binding confusion
 * 4. Batch update mechanism - Anti-shake processing，Avoid frequent updates
 * 5. Event deduplication filtering - The same configuration change only triggers execution once
 */

import { ref, reactive, computed, nextTick } from 'vue'
import type {
  WidgetConfiguration,
  ValidationResult,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './types'

// Configure version information
export interface ConfigurationVersion {
  version: number
  contentHash: string
  timestamp: number
  source: 'user' | 'system' | 'import' | 'restore'
  description?: string
  author?: string // version author
  changeType?: 'major' | 'minor' | 'patch' | 'hotfix' // Change type
  tags?: string[] // version label
}

// Configure status items
export interface ConfigurationState {
  componentId: string
  configuration: WidgetConfiguration
  version: ConfigurationVersion
  lastModified: number
  isDirty: boolean
  isLocked: boolean // Locks to prevent cyclic updates
  versionHistory?: ConfigurationVersion[] // Version history
  maxHistorySize?: number // Maximum number of historical records，default50
}

// Configure update events
export interface ConfigurationUpdateEvent {
  componentId: string
  section: keyof WidgetConfiguration
  oldVersion: ConfigurationVersion
  newVersion: ConfigurationVersion
  changes: Record<string, any>
  shouldExecute: boolean
}

// 🆕 Configure verification related interfaces
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  performance?: {
    validationTime: number
    schemaValidationTime: number
    customRulesTime: number
  }
}

export interface ValidationError {
  code: string
  message: string
  path: string
  severity: 'error' | 'warning'
  data?: any
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning'
  suggestion?: string
}

export interface ValidationRule {
  name: string
  description: string
  priority: number
  validate: (config: WidgetConfiguration, context?: any) => ValidationError[]
}

export interface ValidationContext {
  componentType?: string
  environment?: 'development' | 'production' | 'test'
  strictMode?: boolean
  customRules?: ValidationRule[]
}

// 🆕 Configure template related interfaces
export interface ConfigurationTemplate {
  id: string
  name: string
  description: string
  category: string
  componentType: string
  configuration: WidgetConfiguration
  parameters?: TemplateParameter[]
  metadata: {
    version: string
    author: string
    createdAt: number
    updatedAt: number
    tags: string[]
    isBuiltIn: boolean
    downloadCount?: number
    rating?: number
  }
}

export interface TemplateParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  defaultValue?: any
  required: boolean
  path: string // path in config，like 'dataSource.url'
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: any[]
  }
}

export interface TemplateApplication {
  templateId: string
  componentId: string
  parameters: Record<string, any>
  appliedAt: number
  appliedBy: string
}

/**
 * Configure state manager
 * Solving circular dependencies once and for all using versioning and content hashing
 */
export class ConfigurationStateManager {
  // Configure state storage
  private configStates = reactive<Map<string, ConfigurationState>>(new Map())

  // version counter
  private versionCounter = ref(0)

  // Update queue and anti-shake processing
  private updateQueue = new Map<string, NodeJS.Timeout>()
  private readonly DEBOUNCE_DELAY = 50 // 50msAnti-shake

  // Cycle detection
  private readonly UPDATE_LOCKS = new Set<string>()

  // event listener
  private eventListeners = new Map<string, Set<(event: ConfigurationUpdateEvent) => void>>()

  // 🆕 Version history management
  private readonly DEFAULT_MAX_HISTORY = 50 // Default maximum number of history records
  private configurationSnapshots = new Map<string, Map<string, WidgetConfiguration>>() // componentId -> version -> config

  // 🆕 Configure verification system
  private validationRules = new Map<string, ValidationRule>() // Custom validation rules
  private validationCache = new Map<string, { result: ValidationResult; timestamp: number }>() // Verification result cache
  private readonly VALIDATION_CACHE_TTL = 5000 // Verify cache5Validity in seconds
  private enableValidation = true // Enable verification switch

  // 🆕 Configure template system
  private configurationTemplates = new Map<string, ConfigurationTemplate>() // Template storage
  private templateApplications = new Map<string, TemplateApplication[]>() // Component application template record
  private builtInTemplatesLoaded = false // Whether the built-in template has been loaded

  constructor() {
    // 🔥 Configuration completely relies on the unified configuration center，No needlocalStorage
  }

  /**
   * Get component configuration
   */
  getConfiguration(componentId: string): WidgetConfiguration | null {
    const state = this.configStates.get(componentId)
    if (!state) {
      return null
    }
    // Returns a deep copy of the configuration，Avoid external modifications
    return this.deepClone(state.configuration)
  }

  /**
   * Set up complete configuration
   */
  setConfiguration(
    componentId: string,
    configuration: WidgetConfiguration,
    source: ConfigurationVersion['source'] = 'user',
    author?: string,
    changeType?: 'major' | 'minor' | 'patch' | 'hotfix',
    skipValidation = false
  ): boolean {
    // 🆕 Configuration verification（Optional）
    if (this.enableValidation && !skipValidation) {
      const validationResult = this.validateConfiguration(configuration)
      if (!validationResult.isValid) {
        console.error(`Configuration verification failed [${componentId}]:`, validationResult.errors)
        // Prevent invalid configurations in strict mode
        if (validationResult.errors.some(e => e.severity === 'error')) {
          return false
        }
      }
    }

    const contentHash = this.calculateContentHash(configuration)
    const currentState = this.configStates.get(componentId)

    // 🔥 Content deduplication check：If the content hashes are the same，Return directly without processing
    if (currentState && currentState.version.contentHash === contentHash) {
      return false
    }

    // 🔒 Cycle detection：If the component is being updated，Return directly to avoid loops
    if (this.UPDATE_LOCKS.has(componentId)) {
      return false
    }

    const newVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source,
      description: `Complete config update from ${source}`,
      author,
      changeType
    }

    // 🆕 Save the current version configuration to snapshot storage
    if (currentState) {
      this.saveConfigurationSnapshot(componentId, currentState.version, currentState.configuration)
    }

    const newState: ConfigurationState = {
      componentId,
      configuration: this.deepClone(configuration),
      version: newVersion,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false,
      versionHistory: this.updateVersionHistory(currentState?.versionHistory || [], newVersion),
      maxHistorySize: this.DEFAULT_MAX_HISTORY
    }

    const oldVersion = currentState?.version
    this.configStates.set(componentId, newState)
    // 🔥 Configuration saving completed，No needlocalStoragepersistence

    // Asynchronous trigger event，avoid blocking
    this.scheduleEventEmission(componentId, 'complete', oldVersion, newVersion, configuration)

    return true
  }

  /**
   * Update some part of the configuration - Core repair methods
   */
  updateConfigurationSection<K extends keyof WidgetConfiguration>(
    componentId: string,
    section: K,
    sectionConfig: WidgetConfiguration[K],
    source: ConfigurationVersion['source'] = 'user',
    forceUpdate = false  // 🔥 New：Force update flag，for cross-component interaction
  ): boolean {
    const lockKey = `${componentId}_${section}`

    // 🔒 repair：Use components+Composite lock of section area，Prevent different sections from blocking each other
    if (this.UPDATE_LOCKS.has(lockKey)) {
      return false
    }

    let currentState = this.configStates.get(componentId)

    // If the configuration does not exist，Create default configuration
    if (!currentState) {
      this.initializeConfiguration(componentId)
      currentState = this.configStates.get(componentId)!
    }

    // Build the updated configuration
    const updatedConfiguration = {
      ...currentState.configuration,
      [section]: this.deepClone(sectionConfig),
      metadata: {
        ...currentState.configuration.metadata,
        updatedAt: Date.now()
      }
    }

    // 🔥 Content hash deduplication - But it is forced to trigger when interacting across components
    const newContentHash = this.calculateContentHash(updatedConfiguration)
    if (currentState.version.contentHash === newContentHash && !forceUpdate) {
      return false
    }

    // 🔥 Special handling when forcing updates
    if (forceUpdate && currentState.version.contentHash === newContentHash) {
      // Add timestamp for forced updates，Make sure the hashes are different
      updatedConfiguration.metadata = {
        ...updatedConfiguration.metadata,
        forceUpdateTimestamp: Date.now()
      }
    }

    // 🔒 Set update lock（Use composite keys）
    this.UPDATE_LOCKS.add(lockKey)

    const newVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash: newContentHash,
      timestamp: Date.now(),
      source,
      description: `Section ${section} update from ${source}`
    }

    const newState: ConfigurationState = {
      ...currentState,
      configuration: updatedConfiguration,
      version: newVersion,
      lastModified: Date.now(),
      isDirty: true
    }

    this.configStates.set(componentId, newState)
    // 🆕 persist to localStorage
    // this.saveToStorage() - DisablelocalStorage

    // Asynchronously triggering events and unlocking
    this.scheduleEventEmission(componentId, section, currentState.version, newVersion, {
      [section]: sectionConfig
    }).finally(() => {
      // 🔓 Release update lock（Use composite keys）
      this.UPDATE_LOCKS.delete(lockKey)
    })

    return true
  }

  /**
   * Initialize component configuration
   */
  initializeConfiguration(componentId: string): void {
    if (this.configStates.has(componentId)) {
      return
    }

    const defaultConfiguration: WidgetConfiguration = {
      base: {},
      component: {},
      dataSource: {},
      interaction: {},
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: 'Auto-generated configuration'
      }
    }

    const contentHash = this.calculateContentHash(defaultConfiguration)
    const version: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash,
      timestamp: Date.now(),
      source: 'system',
      description: 'Initial configuration'
    }

    const state: ConfigurationState = {
      componentId,
      configuration: defaultConfiguration,
      version,
      lastModified: Date.now(),
      isDirty: false,
      isLocked: false
    }

    this.configStates.set(componentId, state)

    // 🔥 Configuration saving completed，No needlocalStoragepersistence
  }

  /**
   * Get configuration version information
   */
  getConfigurationVersion(componentId: string): ConfigurationVersion | null {
    const state = this.configStates.get(componentId)
    return state ? { ...state.version } : null
  }

  /**
   * Check if the configuration exists and is the latest version
   */
  isConfigurationUpToDate(componentId: string, expectedHash?: string): boolean {
    const state = this.configStates.get(componentId)
    if (!state) return false

    if (expectedHash) {
      return state.version.contentHash === expectedHash
    }

    return !state.isDirty
  }

  /**
   * Get all configuration status
   */
  getAllConfigurationStates(): Map<string, ConfigurationState> {
    return new Map(this.configStates)
  }

  /**
   * Clean the specified component configuration
   */
  removeConfiguration(componentId: string): boolean {
    const exists = this.configStates.has(componentId)
    if (exists) {
      this.configStates.delete(componentId)
      this.eventListeners.delete(componentId)
      this.UPDATE_LOCKS.delete(componentId)

      // Clear update queue
      const timeout = this.updateQueue.get(componentId)
      if (timeout) {
        clearTimeout(timeout)
        this.updateQueue.delete(componentId)
      }
    }
    return exists
  }

  /**
   * Subscribe to configuration update events
   */
  onConfigurationUpdate(componentId: string, listener: (event: ConfigurationUpdateEvent) => void): () => void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, new Set())
    }

    this.eventListeners.get(componentId)!.add(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(componentId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.eventListeners.delete(componentId)
        }
      }
    }
  }

  // ========== 🆕 Version history management method ==========

  /**
   * Get component version history list
   */
  getVersionHistory(componentId: string): ConfigurationVersion[] {
    const state = this.configStates.get(componentId)
    return state?.versionHistory ? [...state.versionHistory] : []
  }

  /**
   * Restore configuration based on version number
   */
  async restoreToVersion(componentId: string, targetVersion: number): Promise<boolean> {
    const state = this.configStates.get(componentId)
    if (!state) {
      console.error(`components ${componentId} does not exist`)
      return false
    }

    // Find the configuration snapshot for the target version
    const snapshots = this.configurationSnapshots.get(componentId)
    if (!snapshots) {
      console.error(`components ${componentId} No configuration snapshot`)
      return false
    }

    const targetVersionStr = targetVersion.toString()
    const targetConfig = snapshots.get(targetVersionStr)
    if (!targetConfig) {
      console.error(`Version ${targetVersion} The configuration snapshot does not exist`)
      return false
    }

    // Create a recovery version
    const restoreVersion: ConfigurationVersion = {
      version: ++this.versionCounter.value,
      contentHash: this.calculateContentHash(targetConfig),
      timestamp: Date.now(),
      source: 'restore',
      description: `Revert to version ${targetVersion}`,
      changeType: 'patch'
    }

    // Update configuration status
    const newState: ConfigurationState = {
      ...state,
      configuration: this.deepClone(targetConfig),
      version: restoreVersion,
      lastModified: Date.now(),
      isDirty: true,
      versionHistory: this.updateVersionHistory(state.versionHistory || [], restoreVersion)
    }

    this.configStates.set(componentId, newState)

    // Trigger configuration update event
    await this.scheduleEventEmission(componentId, 'complete', state.version, restoreVersion, targetConfig)

    return true
  }

  /**
   * Compare the configuration differences between the two versions
   */
  compareVersions(componentId: string, version1: number, version2: number): Record<string, any> | null {
    const snapshots = this.configurationSnapshots.get(componentId)
    if (!snapshots) return null

    const config1 = snapshots.get(version1.toString())
    const config2 = snapshots.get(version2.toString())

    if (!config1 || !config2) return null

    return this.calculateConfigurationDiff(config1, config2)
  }

  /**
   * Clean up historical versions（keep recentNversions）
   */
  cleanupVersionHistory(componentId: string, keepCount: number = this.DEFAULT_MAX_HISTORY): number {
    const state = this.configStates.get(componentId)
    if (!state || !state.versionHistory) return 0

    const historyLength = state.versionHistory.length
    if (historyLength <= keepCount) return 0

    // Sort version history（latest first）
    const sortedHistory = [...state.versionHistory].sort((a, b) => b.timestamp - a.timestamp)
    const toKeep = sortedHistory.slice(0, keepCount)
    const toRemove = sortedHistory.slice(keepCount)

    // Update version history
    state.versionHistory = toKeep

    // Clean configuration snapshot
    const snapshots = this.configurationSnapshots.get(componentId)
    if (snapshots) {
      toRemove.forEach(version => {
        snapshots.delete(version.version.toString())
      })
    }

    return toRemove.length
  }

  // ========== 🆕 Configure authentication management methods ==========

  /**
   * Verify configuration
   */
  validateConfiguration(configuration: WidgetConfiguration, context?: ValidationContext): ValidationResult {
    const startTime = performance.now()

    // Check cache
    const cacheKey = this.generateValidationCacheKey(configuration, context)
    const cached = this.validationCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.VALIDATION_CACHE_TTL) {
      return cached.result
    }

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Infrastructure verification
    const structureStart = performance.now()
    this.validateBasicStructure(configuration, errors)
    const structureTime = performance.now() - structureStart

    // Custom rule verification
    const customRulesStart = performance.now()
    this.validateWithCustomRules(configuration, context, errors, warnings)
    const customRulesTime = performance.now() - customRulesStart

    const totalTime = performance.now() - startTime

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      performance: {
        validationTime: totalTime,
        schemaValidationTime: structureTime,
        customRulesTime
      }
    }

    // cache results
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * Register custom validation rules
   */
  registerValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.name, rule)
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(ruleName: string): boolean {
    return this.validationRules.delete(ruleName)
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): ValidationRule[] {
    return Array.from(this.validationRules.values()).sort((a, b) => b.priority - a.priority)
  }

  /**
   * enable/Disable verification
   */
  setValidationEnabled(enabled: boolean): void {
    this.enableValidation = enabled
    if (!enabled) {
      this.validationCache.clear()
    }
  }

  /**
   * Clear verification cache
   */
  clearValidationCache(): void {
    this.validationCache.clear()
  }

  // ========== 🆕 Configuration template management method ==========

  /**
   * Register configuration template
   */
  registerTemplate(template: ConfigurationTemplate): boolean {
    try {
      // Verify template configuration
      const validationResult = this.validateConfiguration(template.configuration)
      if (!validationResult.isValid) {
        console.error(`Template configuration verification failed [${template.id}]:`, validationResult.errors)
        return false
      }

      this.configurationTemplates.set(template.id, template)
      return true
    } catch (error) {
      console.error(`Failed to register template [${template.id}]:`, error)
      return false
    }
  }

  /**
   * Get configuration template
   */
  getTemplate(templateId: string): ConfigurationTemplate | null {
    return this.configurationTemplates.get(templateId) || null
  }

  /**
   * Get all templates（Support filtering）
   */
  getTemplates(filter?: {
    category?: string
    componentType?: string
    tags?: string[]
    isBuiltIn?: boolean
  }): ConfigurationTemplate[] {
    this.ensureBuiltInTemplatesLoaded()

    let templates = Array.from(this.configurationTemplates.values())

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category)
      }
      if (filter.componentType) {
        templates = templates.filter(t => t.componentType === filter.componentType)
      }
      if (filter.tags) {
        templates = templates.filter(t =>
          filter.tags!.some(tag => t.metadata.tags.includes(tag))
        )
      }
      if (filter.isBuiltIn !== undefined) {
        templates = templates.filter(t => t.metadata.isBuiltIn === filter.isBuiltIn)
      }
    }

    return templates.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt)
  }

  /**
   * Apply configuration template to component
   */
  async applyTemplate(
    templateId: string,
    componentId: string,
    parameters: Record<string, any> = {},
    author = 'system'
  ): Promise<boolean> {
    const template = this.getTemplate(templateId)
    if (!template) {
      console.error(`Template does not exist: ${templateId}`)
      return false
    }

    try {
      // Generate configuration with parameters applied
      const appliedConfig = this.applyTemplateParameters(template, parameters)

      // Record template application
      const application: TemplateApplication = {
        templateId,
        componentId,
        parameters,
        appliedAt: Date.now(),
        appliedBy: author
      }

      if (!this.templateApplications.has(componentId)) {
        this.templateApplications.set(componentId, [])
      }
      this.templateApplications.get(componentId)!.push(application)

      // Apply configuration to component
      const success = this.setConfiguration(
        componentId,
        appliedConfig,
        'user',
        author,
        'minor',
        false // Don't skip verification
      )

      if (success) {
      }

      return success
    } catch (error) {
      console.error(`Apply template failed [${templateId} -> ${componentId}]:`, error)
      return false
    }
  }

  /**
   * Create template（from existing configuration）
   */
  createTemplateFromConfiguration(
    componentId: string,
    templateInfo: {
      name: string
      description: string
      category: string
      componentType: string
      author: string
      tags?: string[]
    }
  ): ConfigurationTemplate | null {
    const configuration = this.getConfiguration(componentId)
    if (!configuration) {
      console.error(`Component configuration does not exist: ${componentId}`)
      return null
    }

    const template: ConfigurationTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: templateInfo.name,
      description: templateInfo.description,
      category: templateInfo.category,
      componentType: templateInfo.componentType,
      configuration: this.deepClone(configuration),
      metadata: {
        version: '1.0.0',
        author: templateInfo.author,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: templateInfo.tags || [],
        isBuiltIn: false
      }
    }

    if (this.registerTemplate(template)) {
      return template
    }

    return null
  }

  /**
   * Delete template
   */
  removeTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId)
    if (!template) {
      return false
    }

    if (template.metadata.isBuiltIn) {
      console.warn(`Cannot delete built-in templates: ${templateId}`)
      return false
    }

    return this.configurationTemplates.delete(templateId)
  }

  /**
   * Get the template application history of the component
   */
  getTemplateApplicationHistory(componentId: string): TemplateApplication[] {
    return this.templateApplications.get(componentId) || []
  }

  // ========== private method ==========

  /**
   * Compute configuration content hash
   */
  private calculateContentHash(configuration: WidgetConfiguration): string {
    const normalizedConfig = this.normalizeConfiguration(configuration)
    const configString = JSON.stringify(normalizedConfig)
    return this.simpleHash(configString)
  }

  /**
   * Standardized configuration objects，Ensure consistency of hash calculations
   */
  private normalizeConfiguration(config: WidgetConfiguration): any {
    const normalized = { ...config }

    // Ignore timestamp field，Avoid meaningless hash changes
    if (normalized.metadata) {
      const { updatedAt, createdAt, ...metadataWithoutTimestamp } = normalized.metadata
      normalized.metadata = metadataWithoutTimestamp
    }

    // Recursively sort object keys，Ensure hash consistency
    return this.sortObjectKeys(normalized)
  }

  /**
   * Recursively sort object keys
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }

    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: any = {}
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    }

    return sortedObj
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
    return Math.abs(hash).toString(36)
  }

  /**
   * deep clone object
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }

  /**
   * Scheduling event emission（Anti-shake processing）
   */
  private async scheduleEventEmission(
    componentId: string,
    section: keyof WidgetConfiguration | 'complete',
    oldVersion: ConfigurationVersion | undefined,
    newVersion: ConfigurationVersion,
    changes: Record<string, any>
  ): Promise<void> {
    // Clear previous schedule
    const existingTimeout = this.updateQueue.get(componentId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    return new Promise(resolve => {
      const timeout = setTimeout(async () => {
        this.updateQueue.delete(componentId)

        const event: ConfigurationUpdateEvent = {
          componentId,
          section: section as keyof WidgetConfiguration,
          oldVersion: oldVersion || newVersion,
          newVersion,
          changes,
          shouldExecute: section === 'dataSource' // Only data source changes need to be executed
        }

        await this.emitConfigurationUpdate(event)
        resolve()
      }, this.DEBOUNCE_DELAY)

      this.updateQueue.set(componentId, timeout)
    })
  }

  /**
   * Emit configuration update event
   */
  private async emitConfigurationUpdate(event: ConfigurationUpdateEvent): Promise<void> {
    const listeners = this.eventListeners.get(event.componentId)
    if (!listeners || listeners.size === 0) {
      return
    }

    // Execute all listeners in parallel
    const promises = Array.from(listeners).map(async listener => {
      try {
        await listener(event)
      } catch (error) {}
    })

    await Promise.allSettled(promises)
  }

  /**
   * Save configuration snapshot to memory storage
   */
  private saveConfigurationSnapshot(componentId: string, version: ConfigurationVersion, configuration: WidgetConfiguration): void {
    if (!this.configurationSnapshots.has(componentId)) {
      this.configurationSnapshots.set(componentId, new Map())
    }

    const snapshots = this.configurationSnapshots.get(componentId)!
    snapshots.set(version.version.toString(), this.deepClone(configuration))

    // Limit the number of snapshots，Prevent memory overflow
    if (snapshots.size > this.DEFAULT_MAX_HISTORY * 2) {
      const versions = Array.from(snapshots.keys()).map(Number).sort((a, b) => a - b)
      const toDelete = versions.slice(0, versions.length - this.DEFAULT_MAX_HISTORY)
      toDelete.forEach(v => snapshots.delete(v.toString()))
    }
  }

  /**
   * Update version history
   */
  private updateVersionHistory(currentHistory: ConfigurationVersion[], newVersion: ConfigurationVersion): ConfigurationVersion[] {
    const updatedHistory = [...currentHistory, newVersion]

    // Sort by timestamp（latest first）
    updatedHistory.sort((a, b) => b.timestamp - a.timestamp)

    // Limit the number of history records
    return updatedHistory.slice(0, this.DEFAULT_MAX_HISTORY)
  }

  /**
   * Calculate the difference between two configurations
   */
  private calculateConfigurationDiff(config1: WidgetConfiguration, config2: WidgetConfiguration): Record<string, any> {
    const diff: Record<string, any> = {}

    // Compare each configuration section
    const sections: (keyof WidgetConfiguration)[] = ['base', 'component', 'dataSource', 'interaction', 'metadata']

    sections.forEach(section => {
      const diff1 = config1[section] || {}
      const diff2 = config2[section] || {}

      const sectionDiff = this.deepObjectDiff(diff1, diff2)
      if (Object.keys(sectionDiff).length > 0) {
        diff[section] = sectionDiff
      }
    })

    return diff
  }

  /**
   * Depth object difference comparison
   */
  private deepObjectDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {}

    // Get all keys
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

    keys.forEach(key => {
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]

      if (val1 !== val2) {
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          const nestedDiff = this.deepObjectDiff(val1, val2)
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff
          }
        } else {
          diff[key] = { from: val1, to: val2 }
        }
      }
    })

    return diff
  }

  /**
   * Generate validation cache key
   */
  private generateValidationCacheKey(configuration: WidgetConfiguration, context?: ValidationContext): string {
    const configHash = this.calculateContentHash(configuration)
    const contextHash = context ? this.simpleHash(JSON.stringify(context)) : 'default'
    return `${configHash}_${contextHash}`
  }

  /**
   * Infrastructure verification
   */
  private validateBasicStructure(configuration: WidgetConfiguration, errors: ValidationError[]): void {
    // Verify required configuration sections
    const requiredSections: (keyof WidgetConfiguration)[] = ['base', 'component', 'dataSource', 'interaction']

    requiredSections.forEach(section => {
      if (!configuration[section]) {
        errors.push({
          code: 'MISSING_SECTION',
          message: `Missing required configuration section: ${section}`,
          path: section,
          severity: 'error'
        })
      }
    })

    // verifymetadatastructure
    if (configuration.metadata) {
      if (!configuration.metadata.version) {
        errors.push({
          code: 'MISSING_VERSION',
          message: 'Configuration metadata is missing version information',
          path: 'metadata.version',
          severity: 'warning'
        })
      }
    }

    // Verify data source configuration
    if (configuration.dataSource) {
      this.validateDataSourceStructure(configuration.dataSource as any, errors)
    }
  }

  /**
   * Data source structure verification
   */
  private validateDataSourceStructure(dataSource: any, errors: ValidationError[]): void {
    if (dataSource.type && !['static', 'api', 'websocket', 'device'].includes(dataSource.type)) {
      errors.push({
        code: 'INVALID_DATASOURCE_TYPE',
        message: `Unsupported data source type: ${dataSource.type}`,
        path: 'dataSource.type',
        severity: 'error'
      })
    }

    if (dataSource.type === 'api' && !dataSource.url) {
      errors.push({
        code: 'MISSING_API_URL',
        message: 'APIData source missingURLConfiguration',
        path: 'dataSource.url',
        severity: 'error'
      })
    }
  }

  /**
   * Custom rule verification
   */
  private validateWithCustomRules(
    configuration: WidgetConfiguration,
    context: ValidationContext | undefined,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const rules = this.getValidationRules()

    // Merge custom rules in context
    if (context?.customRules) {
      rules.push(...context.customRules)
      rules.sort((a, b) => b.priority - a.priority)
    }

    rules.forEach(rule => {
      try {
        const ruleErrors = rule.validate(configuration, context)
        ruleErrors.forEach(error => {
          if (error.severity === 'warning') {
            warnings.push(error as ValidationWarning)
          } else {
            errors.push(error)
          }
        })
      } catch (validationError) {
        errors.push({
          code: 'VALIDATION_RULE_ERROR',
          message: `Validation rules"${rule.name}"Execution failed: ${validationError}`,
          path: 'validation',
          severity: 'error',
          data: { ruleName: rule.name, error: validationError }
        })
      }
    })
  }

  /**
   * Make sure the built-in template is loaded
   */
  private ensureBuiltInTemplatesLoaded(): void {
    if (this.builtInTemplatesLoaded) return

    // Load built-in templates
    this.loadBuiltInTemplates()
    this.builtInTemplatesLoaded = true
  }

  /**
   * Load built-in templates
   */
  private loadBuiltInTemplates(): void {
    const builtInTemplates: ConfigurationTemplate[] = [
      // Basic digital display template
      {
        id: 'builtin_digit_display_basic',
        name: 'Basic digital display',
        description: 'Simple digital display component template',
        category: 'statistics',
        componentType: 'digit-indicator',
        configuration: {
          base: { width: 200, height: 100, x: 0, y: 0 },
          component: {
            title: 'Numerical display',
            unit: '',
            fontSize: 24,
            color: '#1890ff'
          },
          dataSource: {
            type: 'static',
            data: { value: 100 }
          },
          interaction: {},
          metadata: {
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: 'Built-in basic digital display template'
          }
        },
        parameters: [
          {
            name: 'title',
            type: 'string',
            description: 'show title',
            defaultValue: 'Numerical display',
            required: true,
            path: 'component.title'
          },
          {
            name: 'unit',
            type: 'string',
            description: 'numerical unit',
            defaultValue: '',
            required: false,
            path: 'component.unit'
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'ThingsPanel',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['number', 'statistics', 'Base'],
          isBuiltIn: true
        }
      },
      // Basic chart template
      {
        id: 'builtin_line_chart_basic',
        name: 'Basic line chart',
        description: 'Simple line chart component template',
        category: 'chart',
        componentType: 'line-chart',
        configuration: {
          base: { width: 400, height: 300, x: 0, y: 0 },
          component: {
            title: 'Data trends',
            xAxisLabel: 'time',
            yAxisLabel: 'numerical value'
          },
          dataSource: {
            type: 'api',
            url: '/api/chart-data',
            method: 'GET'
          },
          interaction: {},
          metadata: {
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: 'Built-in basic line chart template'
          }
        },
        parameters: [
          {
            name: 'title',
            type: 'string',
            description: 'Chart title',
            defaultValue: 'Data trends',
            required: true,
            path: 'component.title'
          },
          {
            name: 'apiUrl',
            type: 'string',
            description: 'APIinterface address',
            defaultValue: '/api/chart-data',
            required: true,
            path: 'dataSource.url'
          }
        ],
        metadata: {
          version: '1.0.0',
          author: 'ThingsPanel',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['chart', 'Line chart', 'Base'],
          isBuiltIn: true
        }
      }
    ]

    builtInTemplates.forEach(template => {
      this.configurationTemplates.set(template.id, template)
    })

  }

  /**
   * Apply template parameters to configuration
   */
  private applyTemplateParameters(template: ConfigurationTemplate, parameters: Record<string, any>): WidgetConfiguration {
    const config = this.deepClone(template.configuration)

    if (!template.parameters) {
      return config
    }

    template.parameters.forEach(param => {
      const value = parameters[param.name] !== undefined ? parameters[param.name] : param.defaultValue

      if (value !== undefined) {
        this.setValueByPath(config, param.path, value)
      }
    })

    return config
  }

  /**
   * Set configuration value based on path
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {}
      }
      current = current[part]
    }

    current[parts[parts.length - 1]] = value
  }
}

// Global singleton
export const configurationStateManager = new ConfigurationStateManager()

// Vue Composable
export function useConfigurationState() {
  return {
    manager: configurationStateManager,

    // Basic configuration operations
    getConfig: (componentId: string) => configurationStateManager.getConfiguration(componentId),
    setConfig: (
      componentId: string,
      config: WidgetConfiguration,
      source?: ConfigurationVersion['source'],
      author?: string,
      changeType?: 'major' | 'minor' | 'patch' | 'hotfix',
      skipValidation?: boolean
    ) => configurationStateManager.setConfiguration(componentId, config, source, author, changeType, skipValidation),
    updateSection: <K extends keyof WidgetConfiguration>(
      componentId: string,
      section: K,
      sectionConfig: WidgetConfiguration[K],
      source?: ConfigurationVersion['source'],
      forceUpdate?: boolean  // 🔥 New：Force update parameters
    ) => configurationStateManager.updateConfigurationSection(componentId, section, sectionConfig, source, forceUpdate),

    // Version information
    getVersion: (componentId: string) => configurationStateManager.getConfigurationVersion(componentId),
    isUpToDate: (componentId: string, expectedHash?: string) =>
      configurationStateManager.isConfigurationUpToDate(componentId, expectedHash),

    // 🆕 Version history management
    getVersionHistory: (componentId: string) => configurationStateManager.getVersionHistory(componentId),
    restoreToVersion: (componentId: string, targetVersion: number) =>
      configurationStateManager.restoreToVersion(componentId, targetVersion),
    compareVersions: (componentId: string, version1: number, version2: number) =>
      configurationStateManager.compareVersions(componentId, version1, version2),
    cleanupHistory: (componentId: string, keepCount?: number) =>
      configurationStateManager.cleanupVersionHistory(componentId, keepCount),

    // 🆕 Configuration verification
    validateConfig: (config: WidgetConfiguration, context?: ValidationContext) =>
      configurationStateManager.validateConfiguration(config, context),
    registerValidationRule: (rule: ValidationRule) =>
      configurationStateManager.registerValidationRule(rule),
    removeValidationRule: (ruleName: string) =>
      configurationStateManager.removeValidationRule(ruleName),
    getValidationRules: () => configurationStateManager.getValidationRules(),
    setValidationEnabled: (enabled: boolean) =>
      configurationStateManager.setValidationEnabled(enabled),
    clearValidationCache: () => configurationStateManager.clearValidationCache(),

    // 🆕 Configure template management
    registerTemplate: (template: ConfigurationTemplate) =>
      configurationStateManager.registerTemplate(template),
    getTemplate: (templateId: string) => configurationStateManager.getTemplate(templateId),
    getTemplates: (filter?: {
      category?: string
      componentType?: string
      tags?: string[]
      isBuiltIn?: boolean
    }) => configurationStateManager.getTemplates(filter),
    applyTemplate: (templateId: string, componentId: string, parameters?: Record<string, any>, author?: string) =>
      configurationStateManager.applyTemplate(templateId, componentId, parameters, author),
    createTemplateFromConfig: (componentId: string, templateInfo: {
      name: string
      description: string
      category: string
      componentType: string
      author: string
      tags?: string[]
    }) => configurationStateManager.createTemplateFromConfiguration(componentId, templateInfo),
    removeTemplate: (templateId: string) => configurationStateManager.removeTemplate(templateId),
    getTemplateApplicationHistory: (componentId: string) =>
      configurationStateManager.getTemplateApplicationHistory(componentId),

    // event system
    subscribe: (componentId: string, listener: (event: ConfigurationUpdateEvent) => void) =>
      configurationStateManager.onConfigurationUpdate(componentId, listener)
  }
}
