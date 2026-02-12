/**
 * Unified Data Executor (UnifiedDataExecutor)
 * Task 2.1: Merge multiple scattered executors，Provide a unified data acquisition interface
 *
 * design principles：
 * 1. Single responsibility：Only do data acquisition and basic conversion
 * 2. Type unity：Supports all common data source types
 * 3. Lightweight and efficient：Remove enterprise-level redundant features
 * 4. Plug-in extension：Support for new data source type extensions
 * 5. event integration：Works with configuration event bus
 */

import { request } from '@/service/request'
import type { HttpParam, HttpHeader } from '@/core/data-architecture/types/enhanced-types'

/**
 * Unified data source configuration
 * Unified configuration interface that supports multiple data source types
 */
export interface UnifiedDataConfig {
  /** Data source unique identifier */
  id: string
  /** Data source type */
  type: 'static' | 'http' | 'websocket' | 'json' | 'file' | 'data-source-bindings'
  /** Data source name */
  name?: string
  /** Whether to enable */
  enabled?: boolean
  /** Configuration options */
  config: {
    // === Static data configuration ===
    data?: any

    // === HTTPConfiguration ===
    /** askURL (Required) */
    url?: string
    /** HTTPRequest method (Required) */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    /** Request timeout */
    timeout?: number
    /** HTTPRequest header configuration */
    headers?: HttpHeader[]
    /** HTTPRequest parameter configuration */
    params?: HttpParam[]

    // === WebSocketConfiguration ===
    wsUrl?: string
    protocols?: string[]
    reconnect?: boolean
    heartbeat?: boolean

    // === JSONData configuration ===
    jsonContent?: string
    jsonPath?: string

    // === File configuration ===
    filePath?: string
    fileType?: 'json' | 'csv' | 'xml'
    encoding?: string

    // === Data conversion configuration ===
    transform?: {
      /** JSONPathexpression */
      path?: string
      /** Data mapping rules */
      mapping?: Record<string, string>
      /** Data filter conditions */
      filter?: any
      /** Custom conversion function */
      script?: string
    }

    // === extended configuration ===
    [key: string]: any
  }
}

/**
 * Unified execution results
 */
export interface UnifiedDataResult {
  /** Whether the execution was successful */
  success: boolean
  /** Data content */
  data?: any
  /** error message */
  error?: string
  /** error code */
  errorCode?: string
  /** Execution timestamp */
  timestamp: number
  /** data sourceID */
  sourceId: string
  /** additional metadata */
  metadata?: {
    /** response time(ms) */
    responseTime?: number
    /** Data size */
    dataSize?: number
    /** original response(for debugging) */
    rawResponse?: any
  }
}

/**
 * Data source executor interface
 * Support plug-in expansion of different types of data sources
 */
export interface DataSourceExecutor {
  /** Actuator type */
  type: string
  /** Perform data acquisition */
  execute(config: UnifiedDataConfig): Promise<UnifiedDataResult>
  /** Verify configuration */
  validate?(config: UnifiedDataConfig): boolean
  /** Clean up resources */
  cleanup?(): void
}

/**
 * HTTPdata source executor
 */
class HttpExecutor implements DataSourceExecutor {
  type = 'http'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { url, method = 'GET', headers, params, body, timeout = 5000 } = config.config

      if (!url) {
        return this.createErrorResult(config.id, 'HTTP_NO_URL', 'URLNot configured', startTime)
      }
      const response = await request({
        url,
        method: method.toLowerCase() as any,
        headers,
        params,
        data: body,
        timeout
      })

      const responseTime = Date.now() - startTime

      // Apply data transformation
      const transformedData = this.applyTransform(response.data, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime,
          dataSize: JSON.stringify(response.data).length,
          rawResponse: response
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      return this.createErrorResult(config.id, 'HTTP_REQUEST_FAILED', error.message || 'Request failed', startTime, {
        responseTime
      })
    }
  }

  private createErrorResult(
    sourceId: string,
    errorCode: string,
    error: string,
    startTime: number,
    metadata?: any
  ): UnifiedDataResult {
    return {
      success: false,
      error,
      errorCode,
      timestamp: Date.now(),
      sourceId,
      metadata: {
        responseTime: Date.now() - startTime,
        ...metadata
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    if (!transform) return data

    let result = data

    // JSONPathdeal with
    if (transform.path) {
      result = this.extractByPath(result, transform.path)
    }

    // Field mapping
    if (transform.mapping) {
      result = this.applyMapping(result, transform.mapping)
    }

    // Data filtering
    if (transform.filter) {
      result = this.applyFilter(result, transform.filter)
    }

    return result
  }

  private extractByPath(data: any, path: string): any {
    // simpleJSONPathaccomplish，Supports basic dot syntax
    const keys = path.split('.')
    let result = data

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return null
      }
    }

    return result
  }

  private applyMapping(data: any, mapping: Record<string, string>): any {
    if (!data || typeof data !== 'object') return data

    const result: any = {}
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      result[targetKey] = this.extractByPath(data, sourceKey)
    }

    return result
  }

  private applyFilter(data: any, filter: any): any {
    // Simple filtering implementation，Support array filtering
    if (Array.isArray(data)) {
      return data.filter(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) return false
        }
        return true
      })
    }

    return data
  }
}

/**
 * Static data source executor
 */
class StaticExecutor implements DataSourceExecutor {
  type = 'static'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { data } = config.config
      // Apply data transformation
      const transformedData = this.applyTransform(data, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          dataSize: JSON.stringify(data).length
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Static data processing failed',
        errorCode: 'STATIC_DATA_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    // ReuseHTTPExecutor conversion logic
    if (!transform) return data
    // Implement basic conversion functions
    return data
  }
}

/**
 * JSONdata source executor
 */
class JsonExecutor implements DataSourceExecutor {
  type = 'json'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { jsonContent } = config.config

      if (!jsonContent) {
        return {
          success: false,
          error: 'JSONContent not configured',
          errorCode: 'JSON_NO_CONTENT',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // parseJSON
      const parsedData = JSON.parse(jsonContent)

      // Apply data transformation
      const transformedData = this.applyTransform(parsedData, config.config.transform)

      return {
        success: true,
        data: transformedData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          dataSize: jsonContent.length
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'JSONParsing failed',
        errorCode: 'JSON_PARSE_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  private applyTransform(data: any, transform?: any): any {
    // Reuse conversion logic
    return data
  }
}

/**
 * WebSocketdata source executor (Basic implementation)
 */
class WebSocketExecutor implements DataSourceExecutor {
  type = 'websocket'
  private connections = new Map<string, WebSocket>()

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      const { wsUrl } = config.config

      if (!wsUrl) {
        return {
          success: false,
          error: 'WebSocket URLNot configured',
          errorCode: 'WS_NO_URL',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // Simple implementation：WebSocketRequires asynchronous processing，Return the connection status here
      return {
        success: true,
        data: { status: 'connecting', url: wsUrl },
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'WebSocketConnection failed',
        errorCode: 'WS_CONNECTION_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }

  cleanup() {
    // clean allWebSocketconnect
    this.connections.forEach(ws => ws.close())
    this.connections.clear()
  }
}

/**
 * Unified Data Executor Class
 * Core functions：Manage different types of data source executors，Provide a unified interface
 */
export class UnifiedDataExecutor {
  private executors = new Map<string, DataSourceExecutor>()

  constructor() {
    // Register built-in executor
    this.registerExecutor(new HttpExecutor())
    this.registerExecutor(new StaticExecutor())
    this.registerExecutor(new JsonExecutor())
    this.registerExecutor(new WebSocketExecutor())
    this.registerExecutor(new DataSourceBindingsExecutor()) // 🆕 supportdata-source-bindingstype
  }

  /**
   * Register data source executor (Support plug-in extension)
   */
  registerExecutor(executor: DataSourceExecutor): void {
    this.executors.set(executor.type, executor)
  }

  /**
   * Perform data source configuration
   * Unified data acquisition entrance
   */
  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const { type, enabled = true } = config

    // Check if enabled
    if (!enabled) {
      return {
        success: false,
        error: 'Data source is not enabled',
        errorCode: 'DATA_SOURCE_DISABLED',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }

    // Get the corresponding executor
    const executor = this.executors.get(type)
    if (!executor) {
      return {
        success: false,
        error: `Unsupported data source type: ${type}`,
        errorCode: 'UNSUPPORTED_DATA_SOURCE',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }

    try {
      const result = await executor.execute(config)

      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Executor exception',
        errorCode: 'EXECUTOR_EXCEPTION',
        timestamp: Date.now(),
        sourceId: config.id
      }
    }
  }

  /**
   * Execute multiple data sources in batches
   */
  async executeMultiple(configs: UnifiedDataConfig[]): Promise<UnifiedDataResult[]> {
    const results = await Promise.allSettled(configs.map(config => this.execute(config)))

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Batch execution failed',
          errorCode: 'BATCH_EXECUTION_ERROR',
          timestamp: Date.now(),
          sourceId: configs[index]?.id || 'unknown'
        }
      }
    })
  }

  /**
   * Get supported data source types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.executors.keys())
  }

  /**
   * Verify data source configuration
   */
  validateConfig(config: UnifiedDataConfig): boolean {
    const executor = this.executors.get(config.type)
    if (!executor) return false

    // If the executor provides a verification method，use it
    if (executor.validate) {
      return executor.validate(config)
    }

    // Basic verification：Check required fields
    return !!(config.id && config.type)
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.executors.forEach(executor => {
      if (executor.cleanup) {
        executor.cleanup()
      }
    })
  }
}

/**
 * 🆕 Data source binding executor - deal withdata-source-bindingstype
 * Used to handle complex data source binding configurations
 */
class DataSourceBindingsExecutor implements DataSourceExecutor {
  type = 'data-source-bindings'

  async execute(config: UnifiedDataConfig): Promise<UnifiedDataResult> {
    const startTime = Date.now()

    try {
      // fromconfigextracted fromdataSourceBindingsConfiguration
      const bindings = config.config?.dataSourceBindings || config.config

      if (!bindings || typeof bindings !== 'object') {
        return {
          success: false,
          error: 'dataSourceBindingsConfiguration is missing or in the wrong format',
          errorCode: 'BINDINGS_CONFIG_ERROR',
          timestamp: Date.now(),
          sourceId: config.id,
          metadata: {
            responseTime: Date.now() - startTime
          }
        }
      }

      // 🔥 key：Handles every possible data format
      let resultData: any = null

      // Condition1：ifbindingsIncluderawDataField（fromFinalDataProcessing）
      const bindingKeys = Object.keys(bindings)
      if (bindingKeys.length > 0) {
        const firstBinding = bindings[bindingKeys[0]]

        if (firstBinding?.rawData) {
          // try to parserawData（may beJSONstring）
          try {
            resultData =
              typeof firstBinding.rawData === 'string' ? JSON.parse(firstBinding.rawData) : firstBinding.rawData
          } catch (error) {
            // If parsing fails，Use raw data directly
            resultData = firstBinding.rawData
          }
        } else if (firstBinding?.finalResult) {
          // usefinalResult
          resultData = firstBinding.finalResult
        } else {
          // Use the entirebindingas data
          resultData = firstBinding
        }
      } else {
        // Condition2：Use directlyconfigdata in
        resultData = bindings
      }

      return {
        success: true,
        data: resultData,
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime,
          bindingKeys: bindingKeys,
          dataType: typeof resultData
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Data source binding processing failed',
        errorCode: 'BINDINGS_EXECUTION_ERROR',
        timestamp: Date.now(),
        sourceId: config.id,
        metadata: {
          responseTime: Date.now() - startTime
        }
      }
    }
  }
}

// Create a global unified executor instance
export const unifiedDataExecutor = new UnifiedDataExecutor()

// Exposed to global scope in development environment，Easy to debug
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).unifiedDataExecutor = unifiedDataExecutor
}
