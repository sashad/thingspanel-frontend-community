/**
 * Simplified data source configuration generator
 * learn from visual-editor and card2.1 The core value of the system，Remove excessive complexity
 */

import type {
  ComponentDataRequirement,
  UserDataSourceInput,
  SimpleDataSourceConfig,
  DataSourceDefinition,
  TriggerConfig,
  ValidationResult,
  MappingPreviewResult
} from '../types/simple-types'

import { SIMPLE_DATA_SOURCE_CONSTANTS } from '@/core/data-architecture/types/simple-types'

/**
 * Simplified configuration generator
 * Responsibilities：Receive component requirements and user input，Generate standardized configuration
 */
export class SimpleConfigGenerator {
  /**
   * Generate data source configuration
   * This is the core functionality of the configurator：Convert component requirements and user input into standard configurations
   */
  generateConfig(requirement: ComponentDataRequirement, userInputs: UserDataSourceInput[]): SimpleDataSourceConfig {
    // Basic verification
    this.validateInputs(requirement, userInputs)

    // Generate a list of data source definitions
    const dataSources = this.generateDataSources(requirement, userInputs)

    // Generate trigger configuration（Default configuration，Simplified processing）
    const triggers = this.generateDefaultTriggers(userInputs)

    // Build full configuration
    const config: SimpleDataSourceConfig = {
      id: `config_${requirement.componentId}_${Date.now()}`,
      componentId: requirement.componentId,
      dataSources,
      triggers,
      enabled: true
    }
    return config
  }

  /**
   * Basic input validation
   * Simplified version：Check only key required fields，Avoid over-validation
   */
  private validateInputs(requirement: ComponentDataRequirement, userInputs: UserDataSourceInput[]): void {
    if (!requirement.componentId) {
      throw new Error('componentsIDcannot be empty')
    }

    if (!Array.isArray(userInputs) || userInputs.length === 0) {
      throw new Error('User input cannot be empty')
    }

    // Check if required data sources have corresponding user input
    const requiredSources = requirement.dataSources.filter(ds => ds.required)
    const inputSourceIds = userInputs.map(input => input.dataSourceId)

    for (const requiredSource of requiredSources) {
      if (!inputSourceIds.includes(requiredSource.id)) {
        throw new Error(`Required data source configuration is missing: ${requiredSource.name}`)
      }
    }
  }

  /**
   * Generate a list of data source definitions
   * Convert user input into standard data source definitions
   */
  private generateDataSources(
    requirement: ComponentDataRequirement,
    userInputs: UserDataSourceInput[]
  ): DataSourceDefinition[] {
    const dataSources: DataSourceDefinition[] = []

    for (const userInput of userInputs) {
      // Find the corresponding requirement definition
      const sourceRequirement = requirement.dataSources.find(ds => ds.id === userInput.dataSourceId)

      if (!sourceRequirement) {
        continue
      }

      // Generate field mapping（Simplified version）
      const fieldMapping = this.generateFieldMapping(sourceRequirement, userInput)

      // Create a data source definition
      const dataSourceDef: DataSourceDefinition = {
        id: userInput.dataSourceId,
        type: userInput.type,
        config: userInput.config,
        fieldMapping
      }

      dataSources.push(dataSourceDef)
    }

    return dataSources
  }

  /**
   * Generate field mapping
   * learn from visual-editor of JSON path mapping mechanism，But simplified implementation
   */
  private generateFieldMapping(
    sourceRequirement: any,
    userInput: UserDataSourceInput
  ): { [targetField: string]: string } | undefined {
    // If it is static data，Try direct mapping
    if (userInput.type === 'static') {
      const fieldMapping: { [key: string]: string } = {}

      // Generate mapping paths for each requirement field
      sourceRequirement.fields?.forEach((field: any) => {
        // Simple mapping strategy：Assuming the data structure and field names match
        if (sourceRequirement.structureType === 'object') {
          fieldMapping[field.name] = field.name
        } else if (sourceRequirement.structureType === 'array') {
          fieldMapping[field.name] = `[*].${field.name}`
        }
      })

      return Object.keys(fieldMapping).length > 0 ? fieldMapping : undefined
    }

    // For other data source types，No mapping is generated yet，Processed by executor
    return undefined
  }

  /**
   * Generate default trigger configuration
   * Simplified version：Generate basic triggers based on data source type
   */
  private generateDefaultTriggers(userInputs: UserDataSourceInput[]): TriggerConfig[] {
    const triggers: TriggerConfig[] = []

    // Check whether the data source that needs to be polled is included
    const hasApiSource = userInputs.some(input => input.type === 'api')
    const hasWebSocketSource = userInputs.some(input => input.type === 'websocket')

    // APIAdd timer trigger to data source
    if (hasApiSource) {
      triggers.push({
        type: 'timer',
        config: {
          interval: SIMPLE_DATA_SOURCE_CONSTANTS.DEFAULT_TRIGGER_INTERVAL,
          immediate: true
        }
      })
    }

    // WebSocketData source addedWebSockettrigger
    if (hasWebSocketSource) {
      const wsInput = userInputs.find(input => input.type === 'websocket')
      if (wsInput && 'url' in wsInput.config) {
        triggers.push({
          type: 'websocket',
          config: {
            url: (wsInput.config as any).url,
            protocols: (wsInput.config as any).protocols
          }
        })
      }
    }

    // If there is no special trigger，Add manual trigger
    if (triggers.length === 0) {
      triggers.push({
        type: 'manual',
        config: {}
      })
    }

    return triggers
  }

  /**
   * Verify the generated configuration
   * Simplified version：basic check，Avoid over-validation
   */
  validateConfig(config: SimpleDataSourceConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // basic check
    if (!config.id) errors.push('ConfigurationIDcannot be empty')
    if (!config.componentId) errors.push('componentsIDcannot be empty')
    if (!Array.isArray(config.dataSources) || config.dataSources.length === 0) {
      errors.push('At least one data source is required')
    }

    // Check data source configuration
    config.dataSources.forEach((ds, index) => {
      if (!ds.id) errors.push(`data source ${index + 1} LackID`)
      if (!ds.type) errors.push(`data source ${index + 1} Missing type`)
      if (!ds.config) warnings.push(`data source ${index + 1} Missing configuration`)
    })

    // Check trigger configuration
    if (!Array.isArray(config.triggers) || config.triggers.length === 0) {
      warnings.push('It is recommended to configure at least one trigger')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Preview field mapping results
   * Help users understand mapping effects
   */
  previewMapping(sourceData: any, fieldMapping: { [targetField: string]: string }): MappingPreviewResult[] {
    const results: MappingPreviewResult[] = []

    for (const [targetField, sourcePath] of Object.entries(fieldMapping)) {
      try {
        const mappedValue = this.extractValueByPath(sourceData, sourcePath)
        results.push({
          targetField,
          sourcePath,
          mappedValue,
          success: true
        })
      } catch (error) {
        results.push({
          targetField,
          sourcePath,
          mappedValue: null,
          success: false,
          error: error instanceof Error ? error.message : 'Mapping failed'
        })
      }
    }

    return results
  }

  /**
   * according to JSON Path extraction value
   * Simplified version of path parser，learn from visual-editor
   */
  private extractValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined

    // Handling simple paths (like "name", "user.name")
    if (!path.includes('[') && !path.includes('(')) {
      return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? current[key] : undefined
      }, obj)
    }

    // For complex paths，Use simple regular parsing
    try {
      // More complex path parsing logic can be expanded here
      // Now supports basic dot notation and array indexing
      return new Function('obj', `return obj.${path.replace(/\[(\d+)\]/g, '[$1]')}`)(obj)
    } catch {
      throw new Error(`Unable to resolve path: ${path}`)
    }
  }

  /**
   * Get configuration summary information
   * for debugging and demonstration
   */
  getConfigSummary(config: SimpleDataSourceConfig): string {
    const dataSourceTypes = config.dataSources.map(ds => ds.type).join(', ')
    const triggerTypes = config.triggers.map(t => t.type).join(', ')

    return `components: ${config.componentId} | data source: ${dataSourceTypes} | trigger: ${triggerTypes}`
  }
}

/**
 * Export singleton instance，Simplified use
 */
export const simpleConfigGenerator = new SimpleConfigGenerator()
