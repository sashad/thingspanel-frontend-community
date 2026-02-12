/**
 * equipmentAPIData source implementation
 * supporttelemetryDataCurrentKeysand other equipmentAPIcall
 */

import { telemetryDataCurrentKeys } from '@/service/api/device'

export interface DeviceApiDataSourceConfig {
  id: string
  type: 'device-api'
  name?: string
  apiType: 'telemetryDataCurrentKeys' // Currently only this one is supportedAPI
  parameters: {
    device_id: string
    keys: string
  }
  fieldMappings: {
    [componentField: string]: string // data path，like 'data[0].value'
  }
}

export interface DeviceApiResponse {
  data: Array<{
    value: any
    name?: string
    unit?: string
    timestamp?: string
  }>
}

/**
 * equipmentAPIdata source processor
 */
export class DeviceApiDataSource {
  private config: DeviceApiDataSourceConfig
  private lastResponse: DeviceApiResponse | null = null
  private lastFetchTime: Date | null = null

  constructor(config: DeviceApiDataSourceConfig) {
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
   * GetAPItype
   */
  getApiType(): string {
    return this.config.apiType
  }

  /**
   * GetAPIparameter
   */
  getParameters(): any {
    return this.config.parameters
  }

  /**
   * Get field mapping configuration
   */
  getFieldMappings(): Record<string, string> {
    return this.config.fieldMappings
  }

  /**
   * call deviceAPIGet data
   */
  async fetchData(): Promise<DeviceApiResponse> {
    let response: any

    switch (this.config.apiType) {
      case 'telemetryDataCurrentKeys':
        response = await telemetryDataCurrentKeys({
          device_id: this.config.parameters.device_id,
          keys: this.config.parameters.keys
        })
        break
      default:
        throw new Error(`Not supportedAPItype: ${this.config.apiType}`)
    }

    this.lastResponse = response
    this.lastFetchTime = new Date()
    return response
  }

  /**
   * Extract data based on mapping configuration
   */
  async getValue(): Promise<Record<string, any>> {
    // Get the latest data
    const response = await this.fetchData()
    const result: Record<string, any> = {}

    for (const [componentField, dataPath] of Object.entries(this.config.fieldMappings)) {
      try {
        const value = this.extractValueByPath(response, dataPath)
        result[componentField] = value
      } catch (error) {
        result[componentField] = undefined
      }
    }

    return result
  }

  /**
   * Extract value based on path（Supports array indexing）
   */
  private extractValueByPath(data: any, path: string): any {
    if (!path || path === '') {
      return data
    }

    // parse path，support 'data[0].value' Format
    const pathParts = this.parsePath(path)
    let current = data

    for (const part of pathParts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof part === 'number') {
        // array index
        if (Array.isArray(current)) {
          current = current[part]
        } else {
          return undefined
        }
      } else {
        // Object properties
        if (typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          return undefined
        }
      }
    }

    return current
  }

  /**
   * Parse path string，Supports array indexing
   */
  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = []
    let current = ''
    let inBrackets = false
    let bracketContent = ''

    for (let i = 0; i < path.length; i++) {
      const char = path[i]

      if (char === '[') {
        if (current) {
          parts.push(current)
          current = ''
        }
        inBrackets = true
        bracketContent = ''
      } else if (char === ']') {
        inBrackets = false
        const index = parseInt(bracketContent, 10)
        if (!isNaN(index)) {
          parts.push(index)
        }
        bracketContent = ''
      } else if (char === '.') {
        if (inBrackets) {
          bracketContent += char
        } else {
          if (current) {
            parts.push(current)
            current = ''
          }
        }
      } else {
        if (inBrackets) {
          bracketContent += char
        } else {
          current += char
        }
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  /**
   * Verify that the data path is valid
   */
  async validatePath(path: string): Promise<boolean> {
    try {
      // Use a cached response or get new data
      const response = this.lastResponse || (await this.fetchData())
      const value = this.extractValueByPath(response, path)
      return value !== undefined
    } catch {
      return false
    }
  }

  /**
   * Get available data paths
   */
  async getAvailablePaths(): Promise<Array<{ path: string; type: string; value: any }>> {
    try {
      // Use a cached response or get new data
      const response = this.lastResponse || (await this.fetchData())
      const paths: Array<{ path: string; type: string; value: any }> = []

      this.collectPaths(response, '', paths)

      return paths
    } catch (error) {
      return []
    }
  }

  /**
   * Recursively collect all available paths
   */
  private collectPaths(obj: any, currentPath: string, paths: Array<{ path: string; type: string; value: any }>) {
    if (obj === null || obj === undefined) {
      return
    }

    if (Array.isArray(obj)) {
      // array：Only process the first few elements to avoid too many paths
      const maxItems = Math.min(obj.length, 3)
      for (let i = 0; i < maxItems; i++) {
        const newPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`
        const item = obj[i]

        paths.push({
          path: newPath,
          type: Array.isArray(item) ? 'array' : typeof item,
          value: item
        })

        // If the array element is an object，continue recursion
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          this.collectPaths(item, newPath, paths)
        }
      }
    } else if (typeof obj === 'object') {
      // object
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key

        paths.push({
          path: newPath,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: value
        })

        // If value is an object or array，continue recursion
        if (typeof value === 'object' && value !== null) {
          this.collectPaths(value, newPath, paths)
        }
      }
    }
  }

  /**
   * Preview field mapping results
   */
  async previewMapping(fieldMappings: Record<string, string>): Promise<Record<string, any>> {
    try {
      const response = this.lastResponse || (await this.fetchData())
      const preview: Record<string, any> = {}

      for (const [componentField, dataPath] of Object.entries(fieldMappings)) {
        try {
          preview[componentField] = this.extractValueByPath(response, dataPath)
        } catch {
          preview[componentField] = undefined
        }
      }

      return preview
    } catch (error) {
      return {}
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DeviceApiDataSourceConfig>) {
    this.config = { ...this.config, ...newConfig }
    // clear cache，Force data retrieval
    this.lastResponse = null
    this.lastFetchTime = null
  }

  /**
   * Get the last time data was obtained
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime
  }

  /**
   * Export configuration
   */
  exportConfig(): DeviceApiDataSourceConfig {
    return { ...this.config }
  }
}

/**
 * equipmentAPIdata source factory
 */
export class DeviceApiDataSourceFactory {
  /**
   * Create deviceAPIdata source
   */
  static create(config: DeviceApiDataSourceConfig): DeviceApiDataSource {
    return new DeviceApiDataSource(config)
  }

  /**
   * createtelemetryDataCurrentKeysdata source
   */
  static createTelemetryDataSource(
    id: string,
    deviceId: string,
    keys: string,
    fieldMappings: Record<string, string> = {}
  ): DeviceApiDataSource {
    return new DeviceApiDataSource({
      id,
      type: 'device-api',
      name: `equipment${deviceId}telemetry data`,
      apiType: 'telemetryDataCurrentKeys',
      parameters: {
        device_id: deviceId,
        keys: keys
      },
      fieldMappings
    })
  }

  /**
   * Create a sample deviceAPIdata source
   */
  static createSample(id: string): DeviceApiDataSource {
    return new DeviceApiDataSource({
      id,
      type: 'device-api',
      name: 'Example deviceAPI',
      apiType: 'telemetryDataCurrentKeys',
      parameters: {
        device_id: 'sample-device-001',
        keys: 'temperature,humidity'
      },
      fieldMappings: {
        value: 'data[0].value',
        title: 'data[0].name',
        unit: 'data[0].unit'
      }
    })
  }
}

export default DeviceApiDataSource
