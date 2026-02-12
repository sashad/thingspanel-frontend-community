/**
 * data source adapter
 * Provide data source format conversion and compatibility processing
 */

import type { ExecutorData } from '../types'

/**
 * Data source adapter class
 */
export class DataSourceAdapter {
  /**
   * Standardized actuator data format
   */
  static normalizeExecutorData(data: any): ExecutorData {
    if (!data) {
      return {}
    }

    // If it is already in standard format，Return directly
    if (typeof data === 'object' && (data.main || data.primaryData)) {
      return data as ExecutorData
    }

    // If it is a simple object，packaged to main Field
    if (typeof data === 'object' && !Array.isArray(data)) {
      return {
        main: data
      }
    }

    // If it is an array or other type，packaged to primaryData
    return {
      primaryData: data
    }
  }

  /**
   * Convert data from old format to new format
   */
  static convertLegacyData(legacyData: any): ExecutorData {
    if (!legacyData) {
      return {}
    }

    // Old formats are usually simple key-value pairs
    if (typeof legacyData === 'object' && !Array.isArray(legacyData)) {
      return {
        main: legacyData
      }
    }

    // Other formats are packaged directly
    return {
      primaryData: legacyData
    }
  }

  /**
   * Extract primary data
   */
  static extractPrimaryData(executorData: ExecutorData): any {
    if (!executorData) {
      return null
    }

    // Prioritize from primaryData extract
    if (executorData.primaryData !== undefined) {
      return executorData.primaryData
    }

    // Secondly from main extract
    if (executorData.main && typeof executorData.main === 'object') {
      return executorData.main
    }

    // Finally return the entire data
    return executorData
  }

  /**
   * Check data source format
   */
  static detectDataSourceFormat(data: any): 'standard' | 'legacy' | 'unknown' {
    if (!data) {
      return 'unknown'
    }

    if (typeof data === 'object' && (data.main || data.primaryData)) {
      return 'standard'
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      return 'legacy'
    }

    return 'unknown'
  }

  /**
   * Combine multiple data sources
   */
  static mergeDataSources(...dataSources: ExecutorData[]): ExecutorData {
    const result: ExecutorData = {}

    dataSources.forEach(data => {
      if (!data) return

      // merge main Field
      if (data.main && typeof data.main === 'object') {
        if (!result.main) {
          result.main = {}
        }
        Object.assign(result.main, data.main)
      }

      // merge primaryData（The last one is valid）
      if (data.primaryData !== undefined) {
        result.primaryData = data.primaryData
      }

      // Merge other fields
      Object.keys(data).forEach(key => {
        if (key !== 'main' && key !== 'primaryData') {
          result[key] = data[key]
        }
      })
    })

    return result
  }

  /**
   * Filter invalid data
   */
  static filterInvalidData(executorData: ExecutorData): ExecutorData {
    const result: ExecutorData = {}

    if (executorData.main && typeof executorData.main === 'object') {
      const filteredMain: Record<string, any> = {}
      Object.entries(executorData.main).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          filteredMain[key] = value
        }
      })
      if (Object.keys(filteredMain).length > 0) {
        result.main = filteredMain
      }
    }

    if (executorData.primaryData !== null && executorData.primaryData !== undefined) {
      result.primaryData = executorData.primaryData
    }

    Object.keys(executorData).forEach(key => {
      if (key !== 'main' && key !== 'primaryData') {
        const value = executorData[key]
        if (value !== null && value !== undefined) {
          result[key] = value
        }
      }
    })

    return result
  }
}

/**
 * Default export
 */
export default DataSourceAdapter