/**
 * @file ConfigurationImportExport.ts
 * @description Configure import and export tool classes，Processing components ID Mapping and dependency management
 */

import type { DataSourceConfiguration } from '@/core/data-architecture/index'
import type { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * Standard format for exporting configurations
 */
export interface ExportedConfiguration {
  /** Export format version */
  version: string
  /** Export timestamp */
  exportTime: number
  /** Component type（Optional） */
  componentType?: string
  /** metadata information */
  metadata: {
    /** original component ID */
    originalComponentId: string
    /** Export source */
    exportSource: string
    /** Dependent external components ID list */
    dependencies: string[]
    /** Configuration item statistics */
    statistics: {
      dataSourceCount: number
      interactionCount: number
      httpConfigCount: number
    }
  }
  /** Actual configuration data */
  data: {
    /** Data source configuration */
    dataSourceConfiguration?: any
    /** Component configuration */
    componentConfiguration?: any
    /** Interactive configuration */
    interactionConfiguration?: any[]
  }
  /** ID Mapping information */
  mapping: {
    /** placeholder map */
    placeholders: {
      [placeholder: string]: 'current_component' | 'external_component'
    }
    /** Component dependencies */
    dependencies: {
      [externalComponentId: string]: {
        usage: string[] // Use location description
        required: boolean // Is it necessary
      }
    }
  }
}

/**
 * Import result interface
 */
export interface ImportResult {
  /** Is it successful? */
  success: boolean
  /** error message */
  errors: string[]
  /** warning message */
  warnings: string[]
  /** Imported configuration data */
  importedData?: any
  /** Depend on verification results */
  dependencyValidation?: {
    missing: string[]
    found: string[]
  }
}

/**
 * Import preview results
 */
export interface ImportPreview {
  /** Basic information */
  basicInfo: {
    version: string
    exportTime: number
    componentType: string
    exportSource: string
  }
  /** Configuration statistics */
  statistics: {
    dataSourceCount: number
    interactionCount: number
    httpConfigCount: number
  }
  /** External dependent componentsIDlist */
  dependencies: string[]
  /** conflict description list */
  conflicts: string[]
}

/**
 * Standard format for single data source export configurations
 */
export interface SingleDataSourceExport {
  /** Export format version */
  version: string
  /** Export type identifier */
  exportType: 'single-datasource'
  /** Export timestamp */
  exportTime: number
  /** Data source metadata */
  sourceMetadata: {
    /** original data sourceID */
    originalSourceId: string
    /** The index position in the original component */
    sourceIndex: number
    /** original componentID */
    originalComponentId: string
    /** Export source */
    exportSource: string
    /** Component type（Optional） */
    componentType?: string
  }
  /** Data source configuration content */
  dataSourceConfig: {
    /** Data item configuration */
    dataItems: any[]
    /** merge strategy */
    mergeStrategy: any
    /** Data processing configuration */
    processing?: any
  }
  /** Related configuration */
  relatedConfig: {
    /** Related interaction configurations */
    interactions: any[]
    /** relevantHTTPbinding */
    httpBindings: any[]
  }
  /** componentsIDMapping information */
  mapping: {
    /** placeholder mapping */
    placeholders: Record<string, string>
    /** external dependencies */
    dependencies: string[]
  }
}

/**
 * Single data source import preview results
 */
export interface SingleDataSourceImportPreview {
  /** Basic information */
  basicInfo: {
    version: string
    exportType: string
    exportTime: number
    originalSourceId: string
    sourceIndex: number
    exportSource: string
  }
  /** Data source configuration summary */
  configSummary: {
    dataItemCount: number
    mergeStrategy: string
    hasProcessing: boolean
  }
  /** Related configuration statistics */
  relatedConfig: {
    interactionCount: number
    httpBindingCount: number
  }
  /** external dependencies */
  dependencies: string[]
  /** Clash detection */
  conflicts: string[]
  /** Available target slots */
  availableSlots: Array<{
    slotId: string
    slotIndex: number
    isEmpty: boolean
    currentConfig?: any
  }>
}

/**
 * Configure exporter class
 */
export class ConfigurationExporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'
  private readonly EXPORT_VERSION = '1.0.0'

  /**
   * The export component is configured as JSON
   * @param componentId Component to export ID
   * @param configurationManager Configuration manager instance
   * @returns Exported configuration object
   */
  async exportConfiguration(
    componentId: string,
    configurationManager: any,
    componentType?: string
  ): Promise<ExportedConfiguration> {
    // Get full configuration
    const fullConfig = configurationManager.getConfiguration(componentId)
    if (!fullConfig) {
      throw new Error(`components ${componentId} The configuration does not exist`)
    }

    // Analysis and processing components ID
    const { processedConfig, dependencies, statistics } = this.processConfigurationForExport(fullConfig, componentId)

    // Build export format
    const exportedConfig: ExportedConfiguration = {
      version: this.EXPORT_VERSION,
      exportTime: Date.now(),
      componentType,
      metadata: {
        originalComponentId: componentId,
        exportSource: 'SimpleConfigurationEditor',
        dependencies,
        statistics
      },
      data: {
        dataSourceConfiguration: processedConfig.dataSource,
        componentConfiguration: processedConfig.component,
        interactionConfiguration: processedConfig.interaction
      },
      mapping: {
        placeholders: {
          [this.CURRENT_COMPONENT_PLACEHOLDER]: 'current_component'
        },
        dependencies: this.buildDependencyMapping(dependencies, processedConfig)
      }
    }

    return exportedConfig
  }

  /**
   * Handle components in configuration ID Quote
   */
  private processConfigurationForExport(
    config: any,
    currentComponentId: string
  ): {
    processedConfig: any
    dependencies: string[]
    statistics: any
  } {
    const dependencies = new Set<string>()
    let httpConfigCount = 0
    let interactionCount = 0

    const processValue = (obj: any, path: string = ''): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      // Processing string types ID Quote
      if (typeof obj === 'string') {
        return this.processStringValue(obj, currentComponentId, dependencies, path)
      }

      // Processing arrays
      if (Array.isArray(obj)) {
        return obj.map((item, index) => processValue(item, `${path}[${index}]`))
      }

      // Processing object
      if (typeof obj === 'object') {
        const processed: any = {}

        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key

          // Count the number of configuration items
          if (key === 'responses' && Array.isArray(value)) {
            interactionCount += (value as any[]).length
          }
          if (key === 'httpConfigData' || (key === 'type' && value === 'http')) {
            httpConfigCount++
          }

          // Special processing components ID Field
          if (this.isComponentIdField(key) && typeof value === 'string') {
            processed[key] = this.processComponentId(value, currentComponentId, dependencies, currentPath)
          } else {
            processed[key] = processValue(value, currentPath)
          }
        }

        return processed
      }

      return obj
    }

    const processedConfig = processValue(smartDeepClone(config))

    return {
      processedConfig,
      dependencies: Array.from(dependencies),
      statistics: {
        dataSourceCount: config.dataSource?.dataSources?.length || 0,
        interactionCount,
        httpConfigCount
      }
    }
  }

  /**
   * Handle components in string values ID Quote
   */
  private processStringValue(
    value: string,
    currentComponentId: string,
    dependencies: Set<string>,
    path: string
  ): string {
    // Handling components in variable names ID（like：device_id_comp_123）
    if (value.includes(currentComponentId)) {
      return value.replace(new RegExp(currentComponentId, 'g'), this.CURRENT_COMPONENT_PLACEHOLDER)
    }

    // Detect other components ID Quote
    const componentIdPattern = /comp_[a-zA-Z0-9_-]+/g
    const matches = value.match(componentIdPattern)
    if (matches) {
      matches.forEach(match => {
        if (match !== currentComponentId) {
          dependencies.add(match)
        }
      })
    }

    return value
  }

  /**
   * Processing components ID Field
   */
  private processComponentId(
    componentId: string,
    currentComponentId: string,
    dependencies: Set<string>,
    path: string
  ): string {
    if (componentId === currentComponentId) {
      return this.CURRENT_COMPONENT_PLACEHOLDER
    } else {
      dependencies.add(componentId)
      return componentId
    }
  }

  /**
   * Determine whether it is a component ID Field
   */
  private isComponentIdField(key: string): boolean {
    const componentIdFields = ['componentId', 'targetComponentId', 'sourceComponentId']
    return componentIdFields.includes(key)
  }

  /**
   * Build dependency mapping information
   */
  private buildDependencyMapping(dependencies: string[], processedConfig: any): any {
    const mapping: any = {}

    dependencies.forEach(depId => {
      mapping[depId] = {
        usage: this.findComponentUsage(depId, processedConfig),
        required: true
      }
    })

    return mapping
  }

  /**
   * Find where a component is used
   */
  private findComponentUsage(componentId: string, config: any): string[] {
    const usage: string[] = []

    // Recursive search using location
    const findUsage = (obj: any, path: string = ''): void => {
      if (typeof obj === 'string' && obj.includes(componentId)) {
        usage.push(path || 'root')
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key
          findUsage(value, currentPath)
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          findUsage(item, `${path}[${index}]`)
        })
      }
    }

    findUsage(config)
    return usage
  }

  /**
   * The download configuration is JSON document
   */
  downloadConfigurationAsJson(config: ExportedConfiguration, filename?: string): void {
    const jsonStr = JSON.stringify(config, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || `component-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Configure importer class
 */
export class ConfigurationImporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'

  /**
   * Generate import preview，Not practical application
   * @param configJson imported JSON Configuration
   * @param targetComponentId target component ID
   * @param configurationManager Configuration manager instance
   * @returns Import preview results
   */
  generateImportPreview(
    configJson: string | ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any,
    availableComponents?: any[]
  ): ImportPreview {
    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson

      if (!this.validateConfigurationFormat(config)) {
        throw new Error('Invalid configuration format')
      }

      // Check dependent components
      const dependencies = this.checkDependencies(config, availableComponents)

      // Check for configuration conflicts
      const conflicts = this.checkConfigurationConflicts(config, targetComponentId, configurationManager)

      const canImport = dependencies.missing.length === 0 && !conflicts.dataSource && !conflicts.component

      // Formatted to the structure expected by the template
      const conflictList: string[] = []
      if (conflicts.dataSource) conflictList.push('Data source configuration conflict')
      if (conflicts.component) conflictList.push('Component configuration conflict')
      if (conflicts.interaction) conflictList.push('Interaction configuration conflict')

      const preview: ImportPreview = {
        basicInfo: {
          version: config.version,
          exportTime: config.exportTime,
          componentType: config.metadata?.componentType || '',
          exportSource: config.metadata?.exportSource || 'ThingsPanel'
        },
        statistics: {
          dataSourceCount: config.metadata?.statistics?.dataSourceCount || 0,
          interactionCount: config.metadata?.statistics?.interactionCount || 0,
          httpConfigCount: config.metadata?.statistics?.httpConfigCount || 0
        },
        dependencies: dependencies.found,
        conflicts: conflictList
      }

      return preview
    } catch (error) {
      console.error(`❌ [ConfigurationImporter] Preview failed:`, error)
      throw new Error(`Import preview failed: ${error.message}`)
    }
  }

  /**
   * Perform configuration import
   * @param configJson imported JSON Configuration
   * @param targetComponentId target component ID
   * @param configurationManager Configuration manager instance
   * @param options Import options
   * @returns Import results
   */
  async importConfiguration(
    configJson: string | ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any,
    options: {
      overwriteExisting?: boolean
      skipMissingDependencies?: boolean
    } = {}
  ): Promise<ImportResult> {
    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson

      if (!this.validateConfigurationFormat(config)) {
        throw new Error('Invalid configuration format')
      }

      const errors: string[] = []
      const warnings: string[] = []

      // Processing components ID mapping
      const { processedConfig, missingDependencies } = this.processConfigurationForImport(config, targetComponentId)

      // Check for missing dependencies
      if (missingDependencies.length > 0 && !options.skipMissingDependencies) {
        errors.push(`Missing dependent components: ${missingDependencies.join(', ')}`)
        return {
          success: false,
          errors,
          warnings
        }
      }

      if (missingDependencies.length > 0) {
        warnings.push(`Skip missing dependent components: ${missingDependencies.join(', ')}`)
      }

      // Application configuration
      await this.applyConfiguration(processedConfig, targetComponentId, configurationManager, options)

      return {
        success: true,
        errors,
        warnings,
        importedData: processedConfig,
        dependencyValidation: {
          missing: missingDependencies,
          found: Object.keys(config.mapping.dependencies || {}).filter(dep => !missingDependencies.includes(dep))
        }
      }
    } catch (error) {
      console.error(`❌ [ConfigurationImporter] Import failed:`, error)
      return {
        success: false,
        errors: [error.message],
        warnings: []
      }
    }
  }

  /**
   * Verify configuration format
   */
  private validateConfigurationFormat(config: any): boolean {
    return !!(config && config.version && config.exportTime && config.metadata && config.data)
  }

  /**
   * Check dependent components
   */
  private checkDependencies(
    config: ExportedConfiguration,
    availableComponents?: any[]
  ): {
    found: string[]
    missing: string[]
    conflicts: string[]
  } {
    const dependencies = config.metadata.dependencies || []
    const availableIds = availableComponents?.map(comp => comp.id) || []

    const found = dependencies.filter(dep => availableIds.includes(dep))
    const missing = dependencies.filter(dep => !availableIds.includes(dep))
    const conflicts: string[] = [] // TODO: Implement conflict detection logic

    return { found, missing, conflicts }
  }

  /**
   * Check for configuration conflicts
   */
  private checkConfigurationConflicts(
    config: ExportedConfiguration,
    targetComponentId: string,
    configurationManager: any
  ): { dataSource: boolean; component: boolean; interaction: boolean } {
    try {
      const existingConfig = configurationManager?.getConfiguration?.(targetComponentId)

      // If there is no existing configuration or the configuration manager is invalid，then there is no conflict
      if (!existingConfig || !configurationManager) {
        return {
          dataSource: false,
          component: false,
          interaction: false
        }
      }

      // Check if there are any important configurations that will be overwritten
      // It is considered a conflict only if the existing configuration is non-empty and the imported configuration is also non-empty.
      return {
        dataSource: !!(
          existingConfig?.dataSource?.dataSources?.length && config.data.dataSourceConfiguration?.dataSources?.length
        ),
        component: !!(
          existingConfig?.component?.properties &&
          Object.keys(existingConfig.component.properties).length &&
          config.data.componentConfiguration?.properties &&
          Object.keys(config.data.componentConfiguration.properties).length
        ),
        interaction: !!(
          existingConfig?.interaction &&
          Object.keys(existingConfig.interaction).length &&
          config.data.interactionConfiguration &&
          Object.keys(config.data.interactionConfiguration).length
        )
      }
    } catch (error) {
      console.error('❌ [ConfigurationImporter] Conflict detection failed:', error)
      // When the detection fails, it is assumed that there is no conflict，Allow import
      return {
        dataSource: false,
        component: false,
        interaction: false
      }
    }
  }

  /**
   * Handling components in imported configurations ID mapping
   */
  private processConfigurationForImport(
    config: ExportedConfiguration,
    targetComponentId: string
  ): {
    processedConfig: any
    missingDependencies: string[]
  } {
    const missingDependencies: string[] = []

    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      // Handling placeholders in strings
      if (typeof obj === 'string') {
        if (obj === this.CURRENT_COMPONENT_PLACEHOLDER) {
          return targetComponentId
        }

        // Handling placeholders in variable names
        if (obj.includes(this.CURRENT_COMPONENT_PLACEHOLDER)) {
          const restored = obj.replace(new RegExp(this.CURRENT_COMPONENT_PLACEHOLDER, 'g'), targetComponentId)
          return restored
        }

        return obj
      }

      // Processing arrays
      if (Array.isArray(obj)) {
        return obj.map(item => processValue(item))
      }

      // Processing object
      if (typeof obj === 'object') {
        const processed: any = {}
        for (const [key, value] of Object.entries(obj)) {
          processed[key] = processValue(value)
        }
        return processed
      }

      return obj
    }

    const processedConfig = {
      dataSource: config.data.dataSourceConfiguration ? processValue(config.data.dataSourceConfiguration) : undefined,
      component: config.data.componentConfiguration ? processValue(config.data.componentConfiguration) : undefined,
      interaction: config.data.interactionConfiguration ? processValue(config.data.interactionConfiguration) : undefined
    }

    return {
      processedConfig,
      missingDependencies
    }
  }

  /**
   * Apply configuration to target component
   */
  private async applyConfiguration(
    processedConfig: any,
    targetComponentId: string,
    configurationManager: any,
    options: any
  ): Promise<void> {
    // Check if the configuration manager is valid
    if (!configurationManager || typeof configurationManager.updateConfiguration !== 'function') {
      const error = 'Configuration manager is invalid or not provided，Unable to apply configuration'
      console.error(`❌ [ConfigurationImporter] ${error}`)
      throw new Error(error)
    }

    // Apply data source configuration
    if (processedConfig.dataSource) {
      configurationManager.updateConfiguration(targetComponentId, 'dataSource', processedConfig.dataSource)
    }

    // Application component configuration
    if (processedConfig.component) {
      configurationManager.updateConfiguration(targetComponentId, 'component', processedConfig.component)
    }

    // Application interaction configuration
    if (processedConfig.interaction) {
      configurationManager.updateConfiguration(targetComponentId, 'interaction', processedConfig.interaction)
    }
  }
}

/**
 * Single data source configuration exporter class
 * Designed specifically for exporting a single data source configuration，Enable flexible configuration migration across components
 */
export class SingleDataSourceExporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'
  private readonly EXPORT_VERSION = '1.0.0'

  /**
   * Export the configuration of a specified data source
   * @param componentId componentsID
   * @param sourceId data sourceID
   * @param configurationManager Configuration manager instance
   * @param componentType Component type（Optional）
   * @returns Single data source export configuration
   */
  async exportSingleDataSource(
    componentId: string,
    sourceId: string,
    configurationManager: any,
    componentType?: string
  ): Promise<SingleDataSourceExport> {
    if (!configurationManager) {
      throw new Error('Configuration manager not provided')
    }

    try {
      // Get the complete configuration of a component
      const fullConfig = configurationManager.getConfiguration(componentId)

      // Extract data source configuration from full configuration
      const dataSourceConfig = fullConfig?.dataSource
      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        throw new Error('Data source configuration not found')
      }

      // Find the specified data source
      const targetSourceIndex = dataSourceConfig.dataSources.findIndex((source: any) => source.sourceId === sourceId)
      if (targetSourceIndex === -1) {
        throw new Error(`Data source not found: ${sourceId}`)
      }

      const targetSource = dataSourceConfig.dataSources[targetSourceIndex]
      const dependencies = new Set<string>()

      // Handle components in data source configurationIDplaceholder
      const processedDataSourceConfig = this.processDataSourceForExport(
        smartDeepClone(targetSource),
        componentId,
        dependencies
      )

      // Get relevant interactions andHTTPBinding configuration
      const relatedConfig = this.extractRelatedConfigurations(componentId, sourceId, configurationManager, dependencies)

      const exportData: SingleDataSourceExport = {
        version: this.EXPORT_VERSION,
        exportType: 'single-datasource',
        exportTime: Date.now(),
        sourceMetadata: {
          originalSourceId: sourceId,
          sourceIndex: targetSourceIndex,
          originalComponentId: componentId,
          exportSource: 'SingleDataSourceExporter',
          componentType
        },
        dataSourceConfig: {
          dataItems: processedDataSourceConfig.dataItems || [],
          mergeStrategy: processedDataSourceConfig.mergeStrategy || { type: 'object' },
          processing: processedDataSourceConfig.processing
        },
        relatedConfig,
        mapping: {
          placeholders: {
            [this.CURRENT_COMPONENT_PLACEHOLDER]: 'current_component'
          },
          dependencies: Array.from(dependencies)
        }
      }

      return exportData
    } catch (error) {
      console.error(`❌ [SingleDataSourceExporter] Export failed:`, error)
      throw new Error(`Single data source export failed: ${error.message}`)
    }
  }

  /**
   * Handle components in data source configurationIDmapping
   */
  private processDataSourceForExport(sourceConfig: any, currentComponentId: string, dependencies: Set<string>): any {
    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      if (typeof obj === 'string') {
        return this.processStringValue(obj, currentComponentId, dependencies)
      }

      if (Array.isArray(obj)) {
        return obj.map(item => processValue(item))
      }

      if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = processValue(value)
        }
        return result
      }

      return obj
    }

    return processValue(sourceConfig)
  }

  /**
   * Handling components in stringsIDQuote
   */
  private processStringValue(value: string, currentComponentId: string, dependencies: Set<string>): string {
    // If the string contains the current componentID，Replace with placeholder
    if (value.includes(currentComponentId)) {
      return value.replace(new RegExp(currentComponentId, 'g'), this.CURRENT_COMPONENT_PLACEHOLDER)
    }

    // Check if it is another componentID（Simple matching rules，Can be adjusted according to actual situation）
    const componentIdPattern = /^[a-zA-Z][a-zA-Z0-9_-]*_\d+$/
    if (componentIdPattern.test(value) && value !== currentComponentId) {
      dependencies.add(value)
    }

    return value
  }

  /**
   * Extract additional configuration related to the specified data source
   */
  private extractRelatedConfigurations(
    componentId: string,
    sourceId: string,
    configurationManager: any,
    dependencies: Set<string>
  ): { interactions: any[]; httpBindings: any[] } {
    const relatedConfig = {
      interactions: [],
      httpBindings: []
    }

    try {
      // Get interaction configuration
      const interactionConfig = configurationManager.getConfiguration(componentId, 'interaction')
      if (interactionConfig) {
        // Find interaction configurations related to this data source
        const relatedInteractions = this.findRelatedInteractions(interactionConfig, sourceId)
        relatedConfig.interactions = relatedInteractions.map(interaction =>
          this.processDataSourceForExport(interaction, componentId, dependencies)
        )
      }

      // GetHTTPBinding configuration（if exists）
      const componentConfig = configurationManager.getConfiguration(componentId, 'component')
      if (componentConfig?.httpBindings) {
        const relatedHttpBindings = componentConfig.httpBindings.filter((binding: any) => binding.sourceId === sourceId)
        relatedConfig.httpBindings = relatedHttpBindings.map(binding =>
          this.processDataSourceForExport(binding, componentId, dependencies)
        )
      }
    } catch (error) {
      console.error(`⚠️ [SingleDataSourceExporter] Failed to extract related configuration:`, error)
      // Failure of related configurations does not affect the main export
    }

    return relatedConfig
  }

  /**
   * Finds interaction configurations related to a specified data source
   */
  private findRelatedInteractions(interactionConfig: any, sourceId: string): any[] {
    const relatedInteractions: any[] = []

    if (!interactionConfig || typeof interactionConfig !== 'object') {
      return relatedInteractions
    }

    // Recursive search containssourceIdinteractive configuration
    const searchInteractions = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => searchInteractions(item))
      } else if (typeof obj === 'object' && obj !== null) {
        // Check if the current object matchessourceIdRelated
        const objStr = JSON.stringify(obj)
        if (objStr.includes(sourceId)) {
          relatedInteractions.push(obj)
        } else {
          // Continue recursive search
          Object.values(obj).forEach(value => searchInteractions(value))
        }
      }
    }

    searchInteractions(interactionConfig)
    return relatedInteractions
  }

  /**
   * Get a list of all data sources in the component
   */
  getAvailableDataSources(
    componentId: string,
    configurationManager: any
  ): Array<{
    sourceId: string
    sourceIndex: number
    hasData: boolean
    dataItemCount: number
  }> {
    try {
      // Get the complete configuration of the component and extract the data source configuration
      const fullConfig = configurationManager.getConfiguration(componentId)
      const dataSourceConfig = fullConfig?.dataSource
      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        return []
      }

      return dataSourceConfig.dataSources.map((source: any, index: number) => ({
        sourceId: source.sourceId,
        sourceIndex: index,
        hasData: !!(source.dataItems && source.dataItems.length > 0),
        dataItemCount: source.dataItems?.length || 0
      }))
    } catch (error) {
      console.error(`⚠️ [SingleDataSourceExporter] Failed to get data source list:`, error)
      return []
    }
  }
}

/**
 * Single data source configuration importer class
 */
export class SingleDataSourceImporter {
  private readonly CURRENT_COMPONENT_PLACEHOLDER = '__CURRENT_COMPONENT__'

  /**
   * Generate single data source import preview
   */
  generateImportPreview(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    configurationManager: any
  ): SingleDataSourceImportPreview {
    try {
      // Get the data source slot information of the target component
      const availableSlots = this.getAvailableDataSourceSlots(targetComponentId, configurationManager)

      // Check for conflicts and dependencies
      const dependencies = importData.mapping.dependencies || []
      const conflicts = this.checkImportConflicts(importData, targetComponentId, configurationManager)

      return {
        basicInfo: {
          version: importData.version,
          exportType: importData.exportType,
          exportTime: importData.exportTime,
          originalSourceId: importData.sourceMetadata.originalSourceId,
          sourceIndex: importData.sourceMetadata.sourceIndex,
          exportSource: importData.sourceMetadata.exportSource
        },
        configSummary: {
          dataItemCount: importData.dataSourceConfig.dataItems.length,
          mergeStrategy: importData.dataSourceConfig.mergeStrategy.type || 'object',
          hasProcessing: !!importData.dataSourceConfig.processing
        },
        relatedConfig: {
          interactionCount: importData.relatedConfig.interactions.length,
          httpBindingCount: importData.relatedConfig.httpBindings.length
        },
        dependencies,
        conflicts,
        availableSlots
      }
    } catch (error) {
      console.error(`❌ [SingleDataSourceImporter] Failed to generate import preview:`, error)
      throw new Error(`Failed to generate import preview: ${error.message}`)
    }
  }

  /**
   * Get available data source slots
   */
  private getAvailableDataSourceSlots(componentId: string, configurationManager: any) {
    const slots: Array<{
      slotId: string
      slotIndex: number
      isEmpty: boolean
      currentConfig?: any
    }> = []

    try {
      // Get the complete configuration of the component and extract the data source configuration
      const fullConfig = configurationManager?.getConfiguration?.(componentId)
      const dataSourceConfig = fullConfig?.dataSource

      if (!dataSourceConfig || !dataSourceConfig.dataSources) {
        // If there is no data source configuration，provide default3slots
        for (let i = 0; i < 3; i++) {
          slots.push({
            slotId: `dataSource${i + 1}`,
            slotIndex: i,
            isEmpty: true
          })
        }
      } else {
        // Generate slot information based on existing configuration
        dataSourceConfig.dataSources.forEach((source: any, index: number) => {
          slots.push({
            slotId: source.sourceId,
            slotIndex: index,
            isEmpty: !source.dataItems || source.dataItems.length === 0,
            currentConfig:
              source.dataItems?.length > 0
                ? {
                    dataItemCount: source.dataItems.length,
                    mergeStrategy: source.mergeStrategy?.type || 'object'
                  }
                : undefined
          })
        })
      }
    } catch (error) {
      console.error(`⚠️ [SingleDataSourceImporter] Failed to obtain data source slot:`, error)
    }

    return slots
  }

  /**
   * Check for import conflicts
   */
  private checkImportConflicts(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    configurationManager: any
  ): string[] {
    const conflicts: string[] = []

    try {
      // Check whether dependencies are met
      const dependencies = importData.mapping.dependencies || []
      // TODO: Implement dependency checking logic

      // Check component type compatibility
      // TODO: Implement component type checking according to actual needs
    } catch (error) {
      console.error(`⚠️ [SingleDataSourceImporter] Conflict detection failed:`, error)
    }

    return conflicts
  }

  /**
   * Perform a single data source import
   */
  async importSingleDataSource(
    importData: SingleDataSourceExport,
    targetComponentId: string,
    targetSlotId: string,
    configurationManager: any,
    options: {
      overwriteExisting?: boolean
    } = {}
  ): Promise<void> {
    if (!configurationManager || typeof configurationManager.updateConfiguration !== 'function') {
      throw new Error('Configuration manager is invalid or not provided')
    }

    try {
      // Processing componentsIDmapping
      const processedConfig = this.processConfigurationForImport(importData, targetComponentId)

      // Get or create target data source configuration
      const fullConfig = configurationManager.getConfiguration(targetComponentId)
      const existingConfig = fullConfig?.dataSource || {
        componentId: targetComponentId,
        dataSources: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // make sure dataSources Array exists
      if (!existingConfig.dataSources || !Array.isArray(existingConfig.dataSources)) {
        existingConfig.dataSources = []
      }

      // Find or create target slot
      let targetSlotIndex = existingConfig.dataSources.findIndex((source: any) => source.sourceId === targetSlotId)

      if (targetSlotIndex === -1) {
        // Create a new data source slot
        existingConfig.dataSources.push({
          sourceId: targetSlotId,
          dataItems: [],
          mergeStrategy: { type: 'object' }
        })
        targetSlotIndex = existingConfig.dataSources.length - 1
      }

      // Export data structure based on reality，dataItems Already a standard format
      // From the exported data，dataItems Already included {item, processing} structure，Use directly
      const standardDataItems = processedConfig.dataSourceConfig?.dataItems || []

      // Update the configuration of the target slot
      existingConfig.dataSources[targetSlotIndex] = {
        sourceId: targetSlotId,
        dataItems: standardDataItems,
        mergeStrategy: processedConfig.dataSourceConfig?.mergeStrategy || { type: 'object' },
        ...(processedConfig.dataSourceConfig?.processing && {
          processing: processedConfig.dataSourceConfig.processing
        })
      }

      existingConfig.updatedAt = Date.now()

      // Apply data source configuration
      configurationManager.updateConfiguration(targetComponentId, 'dataSource', existingConfig)

      // TODO: application-related interaction configuration andHTTPbinding
      if (processedConfig.relatedConfig?.interactions?.length > 0) {
        // Interactive configuration import can be implemented in the future
      }

      if (processedConfig.relatedConfig?.httpBindings?.length > 0) {
        // achievable in the futureHTTPbinding import
      }
    } catch (error) {
      console.error(`❌ [SingleDataSourceImporter] Import failed:`, error)
      throw new Error(`Single data source import failed: ${error.message}`)
    }
  }

  /**
   * Intelligent detection of whether a parameter should be a dynamic parameter
   * defensive programming：even thoughisDynamicforfalse，但有绑定关系特征时自动修正fortrue
   */
  private detectIsDynamicParameter(param: any): boolean {
    // Detect obvious binding features，does not depend on the originalisDynamicvalue
    const hasBindingFeatures =
      // feature1：valueModeforcomponent（最强feature）
      param.valueMode === 'component' ||
      // feature2：selectedTemplateBind component properties（最强feature）
      param.selectedTemplate === 'component-property-binding' ||
      // feature3：valueThe value looks like the binding path（Include.And the format is correct）
      (typeof param.value === 'string' &&
       param.value.includes('.') &&
       param.value.split('.').length >= 3 &&
       param.value.length > 15) ||
      // feature4：havevariableNameand contains componentsIDFormat
      (param.variableName && param.variableName.includes('_') && param.variableName.length > 5) ||
      // feature5：descriptionInclude"binding"keywords
      (param.description && (
        param.description.includes('binding') ||
        param.description.includes('property') ||
        param.description.includes('component')
      ))

    // If binding characteristics are detected，Return directlytrue，ignore originalisDynamicset up
    if (hasBindingFeatures) {
      return true
    }

    // If no features are bound，Keep original settings or default tofalse
    return param.isDynamic !== undefined ? param.isDynamic : false
  }

  /**
   * ProtectHTTPBinding paths for parameters are not accidentally overwritten
   * This is a defensive mechanism，Ensure that even if problems arise during configuration management，Binding paths are also not corrupted
   */
  private protectParameterBindingPaths(params: any[]): any[] {
    if (!params || !Array.isArray(params)) return params

    return params.map(param => {
      // Only protect parameters that have set binding relationships
      if (!param.isDynamic && !param.selectedTemplate && !param.valueMode) {
        return param
      }

      // Detect whether the binding path is corrupted
      const isBindingCorrupted = param.value &&
        typeof param.value === 'string' &&
        !param.value.includes('.') &&
        param.value.length < 10 &&
        param.variableName &&
        param.variableName.includes('_')

      if (isBindingCorrupted) {
        // fromvariableNameRebuild the correct binding path
        if (param.variableName.includes('_')) {
          const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
          if (lastUnderscoreIndex > 0) {
            const componentId = param.variableName.substring(0, lastUnderscoreIndex)
            const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
            const reconstructedPath = `${componentId}.base.${propertyName}`

            return {
              ...param,
              value: reconstructedPath,
              isDynamic: true // Make sure it is set to dynamic
            }
          }
        }
      }

      return param
    })
  }

  /**
   * Handling components in imported configurationsIDmapping
   */
  private processConfigurationForImport(
    importData: SingleDataSourceExport,
    targetComponentId: string
  ): SingleDataSourceExport {
    const processedData = smartDeepClone(importData)

    const processValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }

      if (typeof obj === 'string') {
        // Replace placeholder with target componentID
        return obj.replace(new RegExp(this.CURRENT_COMPONENT_PLACEHOLDER, 'g'), targetComponentId)
      }

      if (Array.isArray(obj)) {
        const processedArray = obj.map(item => {
          const processedItem = processValue(item)

          // Check the arrayHTTPParameters and correctionsisDynamicField
          if (processedItem && typeof processedItem === 'object' &&
              ('valueMode' in processedItem || 'selectedTemplate' in processedItem)) {
            const correctedIsDynamic = this.detectIsDynamicParameter(processedItem)
            return {
              ...processedItem,
              isDynamic: correctedIsDynamic
            }
          }

          return processedItem
        })

        // in the arrayHTTPParameter application binding path protection
        return this.protectParameterBindingPaths(processedArray)
      }

      if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = processValue(value)
        }

        // DetectionHTTPParameter object and fixisDynamicField
        if (result && ('valueMode' in result || 'selectedTemplate' in result)) {
          const correctedIsDynamic = this.detectIsDynamicParameter(result)
          result.isDynamic = correctedIsDynamic

          // to a singleHTTPParameter object applies binding path protection
          const protectedParams = this.protectParameterBindingPaths([result])
          return protectedParams[0]
        }

        return result
      }

      return obj
    }

    // Handle data source configuration
    processedData.dataSourceConfig = processValue(processedData.dataSourceConfig)

    // Process related configurations
    processedData.relatedConfig.interactions = processValue(processedData.relatedConfig.interactions)
    processedData.relatedConfig.httpBindings = processValue(processedData.relatedConfig.httpBindings)

    return processedData
  }
}

/**
 * Export singleton instance
 */
export const configurationExporter = new ConfigurationExporter()
export const configurationImporter = new ConfigurationImporter()
export const singleDataSourceExporter = new SingleDataSourceExporter()
export const singleDataSourceImporter = new SingleDataSourceImporter()
