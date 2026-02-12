/**
 * Static data source implementation
 * supportJSONData parsing and field mapping
 */

import { smartDeepClone } from '@/utils/deep-clone'

export interface StaticDataSourceConfig {
  id: string
  type: 'static'
  name?: string
  data: any
  fieldMappings: {
    [componentField: string]: string // data path，like 'temperature' or 'sensor.value'
  }
}

export interface DataSourceValue {
  [fieldName: string]: any
}

/**
 * Static data source processor
 */
export class StaticDataSource {
  private config: StaticDataSourceConfig

  constructor(config: StaticDataSourceConfig) {
    this.config = config
  }

  /**
   * Get data sourceID
   */
  getId(): string {
    return this.config.id
  }

  /**
   * Get data source type
   */
  getType(): string {
    return this.config.type
  }

  /**
   * Get raw data
   */
  getRawData(): any {
    return this.config.data
  }

  /**
   * Get field mapping configuration
   */
  getFieldMappings(): Record<string, string> {
    return this.config.fieldMappings
  }

  /**
   * Extract data based on mapping configuration
   */
  async getValue(): Promise<DataSourceValue> {
    const result: DataSourceValue = {}

    for (const [componentField, dataPath] of Object.entries(this.config.fieldMappings)) {
      try {
        const value = this.extractValueByPath(this.config.data, dataPath)
        result[componentField] = value
      } catch (error) {
        result[componentField] = undefined
      }
    }

    return result
  }

  /**
   * Extract value based on path（Support nested objects）
   */
  private extractValueByPath(data: any, path: string): any {
    if (!path || path === '') {
      return data
    }

    // Simple path parsing：support 'field' and 'field.subfield' Format
    const pathParts = path.split('.')
    let current = data

    for (const part of pathParts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * Update data source configuration
   */
  updateConfig(newConfig: Partial<StaticDataSourceConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Verify that the data path is valid
   */
  validatePath(path: string): boolean {
    try {
      const value = this.extractValueByPath(this.config.data, path)
      return value !== undefined
    } catch {
      return false
    }
  }

  /**
   * Get available data paths
   */
  getAvailablePaths(): Array<{ path: string; type: string; value: any }> {
    const paths: Array<{ path: string; type: string; value: any }> = []

    this.collectPaths(this.config.data, '', paths)

    return paths
  }

  /**
   * Recursively collect all available paths
   */
  private collectPaths(obj: any, currentPath: string, paths: Array<{ path: string; type: string; value: any }>) {
    if (obj === null || obj === undefined) {
      return
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key

        // Add current path
        paths.push({
          path: newPath,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: value
        })

        // if it is an object，continue recursion（Limit depth to avoid infinite recursion）
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && currentPath.split('.').length < 5) {
          this.collectPaths(value, newPath, paths)
        }
      }
    }
  }

  /**
   * Preview field mapping results
   */
  previewMapping(fieldMappings: Record<string, string>): Record<string, any> {
    const preview: Record<string, any> = {}

    for (const [componentField, dataPath] of Object.entries(fieldMappings)) {
      try {
        preview[componentField] = this.extractValueByPath(this.config.data, dataPath)
      } catch {
        preview[componentField] = undefined
      }
    }

    return preview
  }

  /**
   * Clone data source
   */
  clone(): StaticDataSource {
    return new StaticDataSource({
      ...this.config,
      data: smartDeepClone(this.config.data) // Use smart deep copy
    })
  }

  /**
   * Export configuration
   */
  exportConfig(): StaticDataSourceConfig {
    return { ...this.config }
  }
}

/**
 * Static data source factory
 */
export class StaticDataSourceFactory {
  /**
   * Create a static data source
   */
  static create(config: StaticDataSourceConfig): StaticDataSource {
    return new StaticDataSource(config)
  }

  /**
   * fromJSONCreate data source from string
   */
  static createFromJson(id: string, jsonString: string, fieldMappings: Record<string, string> = {}): StaticDataSource {
    try {
      const data = JSON.parse(jsonString)
      return new StaticDataSource({
        id,
        type: 'static',
        data,
        fieldMappings
      })
    } catch (error) {
      throw new Error(`InvalidJSONdata: ${error instanceof Error ? error.message : 'Parse error'}`)
    }
  }

  /**
   * Create a sample data source
   */
  static createSample(id: string): StaticDataSource {
    return new StaticDataSource({
      id,
      type: 'static',
      name: 'Sample data source',
      data: {
        temperature: 25.6,
        humidity: 68.2,
        title: 'temperature sensor',
        unit: '°C',
        status: 'normal',
        sensor: {
          name: 'sensor001',
          location: 'engine roomA',
          value: 42.5
        }
      },
      fieldMappings: {
        value: 'temperature',
        title: 'title',
        unit: 'unit'
      }
    })
  }
}

export default StaticDataSource
