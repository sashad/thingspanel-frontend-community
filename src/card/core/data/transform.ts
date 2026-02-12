/**
 * data converter
 * Implement the conversion logic of the unified data node protocol
 */

import type { IDataNode, IDataTransform } from '../types/index'

/**
 * Data converter implementation class
 */
export class DataTransform implements IDataTransform {
  /**
   * Convert raw data into unified data nodes
   * @param rawData raw data
   * @param sourceType Data source type
   * @returns unified data node
   */
  transform(rawData: any, sourceType: string): IDataNode {
    const timestamp = Date.now()

    try {
      switch (sourceType) {
        case 'device':
          return this.transformDeviceData(rawData, timestamp)
        case 'system':
          return this.transformSystemData(rawData, timestamp)
        case 'api':
          return this.transformApiData(rawData, timestamp)
        case 'mock':
          return this.transformMockData(rawData, timestamp)
        default:
          return this.transformGenericData(rawData, timestamp, sourceType)
      }
    } catch (error) {
      console.error(`[DataTransform] Data conversion failed (${sourceType}):`, error)
      return this.createErrorNode(error as Error, timestamp)
    }
  }

  /**
   * Convert data in batches
   * @param dataList Raw data list
   * @param sourceType Data source type
   * @returns Unified data node array
   */
  transformBatch(dataList: any[], sourceType: string): IDataNode[] {
    return dataList.map(data => this.transform(data, sourceType))
  }

  /**
   * Verify data node
   * @param node data node
   * @returns Is it valid?
   */
  validate(node: IDataNode): boolean {
    try {
      // Check required fields
      if (!node.id || !node.type || node.timestamp === undefined) {
        return false
      }

      // Check timestamp validity
      if (typeof node.timestamp !== 'number' || node.timestamp <= 0) {
        return false
      }

      // Check metadata
      if (!node.metadata || typeof node.metadata !== 'object') {
        return false
      }

      return true
    } catch (error) {
      console.error('[DataTransform] Data node verification failed:', error)
      return false
    }
  }

  /**
   * Convert device data
   * @param rawData raw device data
   * @param timestamp Timestamp
   * @returns data node
   */
  private transformDeviceData(rawData: any, timestamp: number): IDataNode {
    // Process device telemetry data
    if (rawData.telemetry) {
      return {
        id: `device_${rawData.device_id || rawData.deviceId}_${timestamp}`,
        type: 'telemetry',
        value: rawData.telemetry,
        timestamp: rawData.timestamp || timestamp,
        metadata: {
          deviceId: rawData.device_id || rawData.deviceId,
          deviceName: rawData.device_name || rawData.deviceName,
          source: 'device',
          dataType: this.inferDataType(rawData.telemetry),
          unit: rawData.unit,
          quality: rawData.quality || 'good'
        }
      }
    }

    // Process device attribute data
    if (rawData.attributes) {
      return {
        id: `device_attr_${rawData.device_id || rawData.deviceId}_${timestamp}`,
        type: 'attribute',
        value: rawData.attributes,
        timestamp: rawData.timestamp || timestamp,
        metadata: {
          deviceId: rawData.device_id || rawData.deviceId,
          deviceName: rawData.device_name || rawData.deviceName,
          source: 'device',
          dataType: 'object',
          attributeKeys: Object.keys(rawData.attributes)
        }
      }
    }

    // Handle common device data
    return {
      id: `device_${rawData.device_id || rawData.id}_${timestamp}`,
      type: 'device',
      value: rawData.value !== undefined ? rawData.value : rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        deviceId: rawData.device_id || rawData.id,
        deviceName: rawData.device_name || rawData.name,
        source: 'device',
        dataType: this.inferDataType(rawData.value || rawData),
        raw: rawData
      }
    }
  }

  /**
   * Convert system data
   * @param rawData raw system data
   * @param timestamp Timestamp
   * @returns data node
   */
  private transformSystemData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `system_${rawData.metric || 'data'}_${timestamp}`,
      type: 'system',
      value: rawData.value !== undefined ? rawData.value : rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        metric: rawData.metric,
        source: 'system',
        dataType: this.inferDataType(rawData.value || rawData),
        category: rawData.category || 'general',
        tags: rawData.tags || {},
        raw: rawData
      }
    }
  }

  /**
   * ConvertAPIdata
   * @param rawData originalAPIdata
   * @param timestamp Timestamp
   * @returns data node
   */
  private transformApiData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `api_${rawData.id || timestamp}`,
      type: 'api',
      value: rawData.data || rawData.value || rawData,
      timestamp: rawData.timestamp || timestamp,
      metadata: {
        source: 'api',
        dataType: this.inferDataType(rawData.data || rawData.value || rawData),
        endpoint: rawData.endpoint,
        method: rawData.method,
        status: rawData.status,
        raw: rawData
      }
    }
  }

  /**
   * Convert simulated data
   * @param rawData Raw simulation data
   * @param timestamp Timestamp
   * @returns data node
   */
  private transformMockData(rawData: any, timestamp: number): IDataNode {
    return {
      id: `mock_${timestamp}`,
      type: 'mock',
      value: rawData,
      timestamp,
      metadata: {
        source: 'mock',
        dataType: this.inferDataType(rawData),
        generated: true
      }
    }
  }

  /**
   * Convert common data
   * @param rawData raw data
   * @param timestamp Timestamp
   * @param sourceType Data source type
   * @returns data node
   */
  private transformGenericData(rawData: any, timestamp: number, sourceType: string): IDataNode {
    return {
      id: `${sourceType}_${timestamp}`,
      type: 'generic',
      value: rawData,
      timestamp,
      metadata: {
        source: sourceType,
        dataType: this.inferDataType(rawData),
        raw: rawData
      }
    }
  }

  /**
   * Create error node
   * @param error error object
   * @param timestamp Timestamp
   * @returns Bad data node
   */
  private createErrorNode(error: Error, timestamp: number): IDataNode {
    return {
      id: `error_${timestamp}`,
      type: 'error',
      value: null,
      timestamp,
      metadata: {
        source: 'error',
        dataType: 'error',
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }
    }
  }

  /**
   * Infer data type
   * @param value data value
   * @returns data type
   */
  private inferDataType(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    const type = typeof value

    if (type === 'object') {
      if (Array.isArray(value)) return 'array'
      if (value instanceof Date) return 'date'
      return 'object'
    }

    return type
  }
}

/**
 * data aggregator
 * Implement data aggregation and statistical functions
 */
export class DataAggregator {
  /**
   * aggregate data node
   * @param nodes data node array
   * @param aggregationType Aggregation type
   * @returns Aggregation results
   */
  aggregate(nodes: IDataNode[], aggregationType: 'sum' | 'avg' | 'max' | 'min' | 'count'): number {
    if (nodes.length === 0) return 0

    const numericValues = nodes
      .map(node => this.extractNumericValue(node.value))
      .filter(val => val !== null) as number[]

    if (numericValues.length === 0) return 0

    switch (aggregationType) {
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0)
      case 'avg':
        return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      case 'max':
        return Math.max(...numericValues)
      case 'min':
        return Math.min(...numericValues)
      case 'count':
        return numericValues.length
      default:
        return 0
    }
  }

  /**
   * Aggregate by time window
   * @param nodes data node array
   * @param windowMs time window（millisecond）
   * @param aggregationType Aggregation type
   * @returns Time window aggregation results
   */
  aggregateByTimeWindow(
    nodes: IDataNode[],
    windowMs: number,
    aggregationType: 'sum' | 'avg' | 'max' | 'min' | 'count'
  ): Array<{ timestamp: number; value: number; count: number }> {
    if (nodes.length === 0) return []

    // Group by time window
    const windows = new Map<number, IDataNode[]>()

    nodes.forEach(node => {
      const windowStart = Math.floor(node.timestamp / windowMs) * windowMs
      if (!windows.has(windowStart)) {
        windows.set(windowStart, [])
      }
      windows.get(windowStart)!.push(node)
    })

    // Aggregate per window
    return Array.from(windows.entries())
      .map(([timestamp, windowNodes]) => ({
        timestamp,
        value: this.aggregate(windowNodes, aggregationType),
        count: windowNodes.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Extract value
   * @param value original value
   * @returns numerical value ornull
   */
  private extractNumericValue(value: any): number | null {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }
    if (typeof value === 'boolean') return value ? 1 : 0
    return null
  }
}

// Create a global instance
export const dataTransform = new DataTransform()
export const dataAggregator = new DataAggregator()

// Export type
export type { IDataTransform }
