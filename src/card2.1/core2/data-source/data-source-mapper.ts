/**
 * Card2.1 data source mapper
 * Simplified data source mapping and transformation services
 */

import type { ExecutorData, DataSourceMappingResult, IDataSourceMapper } from '../types'
import { ComponentRegistry } from '../registry'

/**
 * Data source mapper class
 */
export class DataSourceMapper implements IDataSourceMapper {
  /**
   * Mapping component data source
   */
  static mapDataSources(componentType: string, executorData: ExecutorData | null | undefined): DataSourceMappingResult {
    // Get component definition
    const definition = ComponentRegistry.get(componentType)
    if (!definition) {
      return {}
    }

    // Get the data source configuration of the component
    const dataSourceKeys = ComponentRegistry.getDataSourceKeys(componentType)
    if (dataSourceKeys.length === 0) {
      return {}
    }

    // If there is no executor data，Returns a null value map
    if (!executorData) {
      return this.createNullMapping(dataSourceKeys)
    }

    // Perform data source mapping
    const mappingResult = this.performMapping(dataSourceKeys, executorData)
    return mappingResult
  }

  /**
   * Create a null value map
   */
  private static createNullMapping(dataSourceKeys: string[]): DataSourceMappingResult {
    const nullMapping: DataSourceMappingResult = {}

    dataSourceKeys.forEach(key => {
      nullMapping[key] = null
    })
    return nullMapping
  }

  /**
   * Perform data source mapping
   */
  private static performMapping(dataSourceKeys: string[], executorData: ExecutorData): DataSourceMappingResult {
    const result: DataSourceMappingResult = {}

    // Strategy1: Prioritize from main Extract data from fields
    if (executorData.main && typeof executorData.main === 'object') {
      dataSourceKeys.forEach(key => {
        if (key in executorData.main!) {
          result[key] = executorData.main![key]
        } else {
          result[key] = null
        }
      })

      return result
    }

    // Strategy2: Handle standard data source formats (primaryData.data)
    if (executorData.primaryData && typeof executorData.primaryData === 'object') {
      dataSourceKeys.forEach(key => {
        if (key === 'primaryData' && executorData.primaryData) {
          // forprimaryData，extract.dataThe content of the field
          const primaryDataObj = executorData.primaryData as any
          result[key] = primaryDataObj.data || primaryDataObj
        } else if (executorData.primaryData[key]) {
          result[key] = executorData.primaryData[key]
        } else {
          result[key] = null
        }
      })

      // special handling：If a component expects a single data source but usesprimaryData
      if (dataSourceKeys.length === 1 && dataSourceKeys[0] === 'primaryData') {
        const primaryDataObj = executorData.primaryData as any
        // Return directlydataThe content of the field，rather than the wholeprimaryData
        result[dataSourceKeys[0]] = primaryDataObj.data || primaryDataObj
      }

      return result
    }

    // Strategy3: directly from executorData Extract data at root level
    dataSourceKeys.forEach(key => {
      if (key in executorData) {
        result[key] = executorData[key]
      } else {
        result[key] = null
      }
    })

    return result
  }

  /**
   * Mapping static parameters
   */
  static mapStaticParams(
    componentType: string,
    staticParams: Record<string, any> | null | undefined
  ): Record<string, any> {
    // Get component definition
    const definition = ComponentRegistry.get(componentType)
    if (!definition) {
      return {}
    }

    // Get the static parameter configuration of the component
    const staticParamKeys = ComponentRegistry.getStaticParamKeys(componentType)
    if (staticParamKeys.length === 0) {
      return {}
    }

    // If there are no static parameters，Return to default value
    if (!staticParams) {
      return this.getDefaultStaticParams(definition, staticParamKeys)
    }

    // Filter and map static parameters
    const result: Record<string, any> = {}
    staticParamKeys.forEach(key => {
      if (key in staticParams) {
        result[key] = staticParams[key]
      } else {
        // Use default value
        const defaultValue = this.getDefaultStaticParamValue(definition, key)
        result[key] = defaultValue
      }
    })
    return result
  }

  /**
   * Get default static parameters
   */
  private static getDefaultStaticParams(
    definition: any,
    staticParamKeys: string[]
  ): Record<string, any> {
    const defaults: Record<string, any> = {}

    staticParamKeys.forEach(key => {
      defaults[key] = this.getDefaultStaticParamValue(definition, key)
    })

    return defaults
  }

  /**
   * Get the default static parameter value
   */
  private static getDefaultStaticParamValue(definition: any, key: string): any {
    // Obtained from the default configuration defined by the component
    if (definition?.defaultConfig?.staticParams?.[key] !== undefined) {
      return definition.defaultConfig.staticParams[key]
    }

    // Get default value from static parameter definition
    if (definition.staticParams?.[key]?.default !== undefined) {
      return definition.staticParams[key].default
    }

    // Returns an appropriate default value based on the type
    const paramType = definition.staticParams?.[key]?.type
    switch (paramType) {
      case 'string':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return null
    }
  }

  /**
   * Verify data source mapping results
   */
  static validateMapping(
    componentType: string,
    mappingResult: DataSourceMappingResult
  ): {
    isValid: boolean
    missingKeys: string[]
    extraKeys: string[]
  } {
    const expectedKeys = ComponentRegistry.getDataSourceKeys(componentType)
    const actualKeys = Object.keys(mappingResult)

    const missingKeys = expectedKeys.filter(key => !(key in mappingResult))
    const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key))

    const isValid = missingKeys.length === 0
    return { isValid, missingKeys, extraKeys }
  }

  /**
   * Get mapping statistics
   */
  static getMappingStats(
    componentType: string,
    executorData: ExecutorData | null | undefined
  ): {
    componentType: string
    isRegistered: boolean
    dataSourceCount: number
    staticParamCount: number
    hasExecutorData: boolean
    executorDataKeys: string[]
  } {
    const isRegistered = ComponentRegistry.has(componentType)
    const dataSourceCount = ComponentRegistry.getDataSourceKeys(componentType).length
    const staticParamCount = ComponentRegistry.getStaticParamKeys(componentType).length
    const hasExecutorData = !!executorData
    const executorDataKeys = executorData ? Object.keys(executorData) : []

    return {
      componentType,
      isRegistered,
      dataSourceCount,
      staticParamCount,
      hasExecutorData,
      executorDataKeys
    }
  }
}

/**
 * Default data source mapper instance
 */
export const dataSourceMapper: IDataSourceMapper = DataSourceMapper

/**
 * Default export
 */
export default DataSourceMapper