/**
 * fourth floor：multi-source integrator (MultiSourceIntegrator)
 * Responsibilities：Combine multiple data sources bykeySynthetic component final data
 */

export interface ComponentData {
  [dataSourceKey: string]: {
    /** Data source type */
    type: string
    /** parsed data */
    data: any
    /** Last updated */
    lastUpdated: number
    /** metadata */
    metadata?: any
  }
}

export interface DataSourceResult {
  /** data sourceID */
  sourceId: string
  /** Data source type */
  type: string
  /** Merged data */
  data: any
  /** Is it successful? */
  success: boolean
  /** error message */
  error?: string
}

/**
 * Multi-source integrator interface
 */
export interface IMultiSourceIntegrator {
  /**
   * according tokeyIntegrate multiple data sources
   * @param sources Data source result list
   * @param componentId componentsID
   * @returns Component final data，Returns null on errorComponentData
   */
  integrateDataSources(sources: DataSourceResult[], componentId: string): Promise<ComponentData>
}

/**
 * Multi-source integrator implementation class
 */
export class MultiSourceIntegrator implements IMultiSourceIntegrator {
  /**
   * Main method of integrating multiple data sources
   */
  async integrateDataSources(sources: DataSourceResult[], componentId: string): Promise<ComponentData> {
    try {
      const result: ComponentData = {}
      const timestamp = Date.now()

      // Process each data source result
      for (const source of sources) {
        if (!source.sourceId) {
          continue
        }

        // according tokeyComposite large objects
        result[source.sourceId] = {
          type: source.type || 'unknown',
          data: source.success ? source.data : {},
          lastUpdated: timestamp,
          metadata: {
            componentId,
            success: source.success,
            error: source.error,
            processedAt: new Date().toISOString()
          }
        }
      }

      // If there are no valid data sources，Return emptyComponentData
      if (Object.keys(result).length === 0) {
        return {}
      }

      return result
    } catch (error) {
      return {} // Unified error handling：Return emptyComponentData
    }
  }

  /**
   * Verify the validity of data source results
   */
  validateDataSourceResult(source: DataSourceResult): boolean {
    return !!(source && source.sourceId && source.type !== undefined)
  }

  /**
   * Get component data statistics
   */
  getDataStatistics(componentData: ComponentData): {
    totalSources: number
    successfulSources: number
    failedSources: number
    lastUpdated: number
  } {
    const sources = Object.entries(componentData)
    const successful = sources.filter(([_, data]) => data.metadata?.success !== false)
    const failed = sources.filter(([_, data]) => data.metadata?.success === false)
    const lastUpdated = Math.max(...sources.map(([_, data]) => data.lastUpdated), 0)

    return {
      totalSources: sources.length,
      successfulSources: successful.length,
      failedSources: failed.length,
      lastUpdated
    }
  }

  /**
   * Check if component data is valid
   */
  isValidComponentData(componentData: ComponentData): boolean {
    if (!componentData || typeof componentData !== 'object') {
      return false
    }

    // There must be at least one data source
    const sourceKeys = Object.keys(componentData)
    if (sourceKeys.length === 0) {
      return false
    }

    // Check the structure of each data source
    return sourceKeys.every(key => {
      const source = componentData[key]
      return (
        source && typeof source.type === 'string' && typeof source.lastUpdated === 'number' && source.data !== undefined
      )
    })
  }

  /**
   * Merge multipleComponentData (For incremental updates of component data)
   */
  mergeComponentData(existing: ComponentData, updates: ComponentData): ComponentData {
    const result = { ...existing }

    for (const [sourceId, sourceData] of Object.entries(updates)) {
      // Use timestamp to determine if updates are needed
      const existingData = result[sourceId]
      if (!existingData || existingData.lastUpdated < sourceData.lastUpdated) {
        result[sourceId] = sourceData
      }
    }

    return result
  }

  /**
   * Clean up expired data source data
   */
  cleanupExpiredData(componentData: ComponentData, maxAge: number = 5 * 60 * 1000): ComponentData {
    const now = Date.now()
    const result: ComponentData = {}

    for (const [sourceId, sourceData] of Object.entries(componentData)) {
      // Keep unexpired data
      if (now - sourceData.lastUpdated <= maxAge) {
        result[sourceId] = sourceData
      }
    }

    return result
  }

  /**
   * Convert toVisual EditorCompatible formats
   */
  toVisualEditorFormat(componentData: ComponentData): any {
    const result: Record<string, any> = {}

    for (const [sourceId, sourceData] of Object.entries(componentData)) {
      result[sourceId] = sourceData.data
    }

    return result
  }

  /**
   * Convert toCard2.1Compatible formats
   */
  toCard21Format(componentData: ComponentData): any {
    return {
      rawDataSources: {
        dataSourceBindings: Object.fromEntries(
          Object.entries(componentData).map(([sourceId, sourceData]) => [
            sourceId,
            {
              rawData: JSON.stringify(sourceData.data)
            }
          ])
        )
      }
    }
  }
}
