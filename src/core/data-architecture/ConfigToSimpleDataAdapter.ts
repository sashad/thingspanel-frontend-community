/**
 * Configure conversion adapter
 * Convert existing complex configuration formats toSimpleDataBridgeSimplified format required
 */

import type { ComponentDataRequirement, SimpleDataSourceConfig } from '@/core/data-architecture/SimpleDataBridge'

/**
 * Convert complex data source configurations into simplified formats
 * @param componentId componentsID
 * @param config original configuration object
 * @returns Simplified component data requirements
 */
export function convertToSimpleDataRequirement(componentId: string, config: any): ComponentDataRequirement | null {
  if (!config) {
    return null
  }

  const dataSources: SimpleDataSourceConfig[] = []

  // deal with dataSourceBindings Format (from ConfigurationPanel)
  if (config.dataSourceBindings) {
    if (process.env.NODE_ENV === 'development') {
    }

    Object.entries(config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding && binding.rawData) {
        try {
          // parserawData
          const parsedData = JSON.parse(binding.rawData)

          dataSources.push({
            id: key,
            type: 'static',
            config: {
              data: parsedData
            }
          })

          if (process.env.NODE_ENV === 'development') {
          }
        } catch (error) {
          console.error(`❌ [ConfigAdapter] parserawDatafail: ${key}`, error)
        }
      }
    })
  }

  // handle direct config.dataSourceBindings Format
  if (config.config?.dataSourceBindings) {
    if (process.env.NODE_ENV === 'development') {
    }

    Object.entries(config.config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding && binding.rawData) {
        try {
          const parsedData = JSON.parse(binding.rawData)

          dataSources.push({
            id: key,
            type: 'static',
            config: {
              data: parsedData
            }
          })

          if (process.env.NODE_ENV === 'development') {
          }
        } catch (error) {
          console.error(`❌ [ConfigAdapter] Parse nestingrawDatafail: ${key}`, error)
        }
      }
    })
  }

  // Handling simple object formats
  if (
    typeof config === 'object' &&
    !Array.isArray(config) &&
    !config.type &&
    !config.dataSourceBindings &&
    !config.config
  ) {
    if (process.env.NODE_ENV === 'development') {
    }

    dataSources.push({
      id: 'main',
      type: 'static',
      config: {
        data: config
      }
    })
  }

  if (dataSources.length === 0) {
    console.error(`⚠️ [ConfigAdapter] No valid data source configuration found: ${componentId}`)
    return null
  }

  const requirement: ComponentDataRequirement = {
    componentId,
    dataSources
  }

  if (process.env.NODE_ENV === 'development') {
  }
  return requirement
}

/**
 * Check whether the configuration needs to be converted
 * @param config Configuration object
 * @returns Do you need to convert
 */
export function shouldConvertConfig(config: any): boolean {
  if (!config || typeof config !== 'object') {
    return false
  }

  // havedataSourceBindingsneed to convert
  if (config.dataSourceBindings || config.config?.dataSourceBindings) {
    return true
  }

  // Simple objects can also be converted
  if (!Array.isArray(config) && !config.type && !config.enabled && !config.metadata) {
    return true
  }

  return false
}

/**
 * Extract component type from configuration
 * @param config Configuration object
 * @returns Component type
 */
export function extractComponentType(config: any): string {
  return config?.metadata?.componentType || 'unknown'
}

/**
 * Convert multiple component configurations in batches
 * @param configs Configuration mapping {componentId: config}
 * @returns Conversion result mapping
 */
export function batchConvertConfigs(configs: Record<string, any>): Record<string, ComponentDataRequirement> {
  const results: Record<string, ComponentDataRequirement> = {}

  Object.entries(configs).forEach(([componentId, config]) => {
    if (shouldConvertConfig(config)) {
      const requirement = convertToSimpleDataRequirement(componentId, config)
      if (requirement) {
        results[componentId] = requirement
      }
    }
  })

  if (process.env.NODE_ENV === 'development') {
  }
  return results
}
