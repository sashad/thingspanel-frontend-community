/**
 * 🔥 data format normalizer
 * Solve the fundamental problem of inconsistent data source configuration formats in the system
 * 
 * Target：All data source configurations must be converted to a unified, standard format
 */

/**
 * Standard data item format - The only format recognized by the system
 */
export interface StandardDataItem {
  /** Data item configuration */
  item: {
    /** Data source type */
    type: 'static' | 'http' | 'json' | 'websocket' | 'file' | 'data-source-bindings'
    /** Configuration content */
    config: Record<string, any>
  }
  /** Handle configuration */
  processing: {
    /** filter path */
    filterPath: string
    /** custom script */
    customScript?: string
    /** default value */
    defaultValue?: any
  }
}

/**
 * Standard data source configuration format
 */
export interface StandardDataSourceConfig {
  /** componentsID */
  componentId: string
  /** Data source list */
  dataSources: Array<{
    /** data sourceID */
    sourceId: string
    /** List of data items */
    dataItems: StandardDataItem[]
    /** merge strategy */
    mergeStrategy: { type: 'object' | 'array' | 'replace' }
  }>
  /** creation time */
  createdAt: number
  /** Update time */
  updatedAt: number
}

/**
 * Data format normalizer class
 */
export class DataFormatNormalizer {
  
  /**
   * 🔥 core methods：Convert any format to a standard format
   */
  static normalizeToStandard(data: any, componentId: string): StandardDataSourceConfig {
    
    // 1. If it is already in standard format，Return directly
    if (this.isStandardFormat(data)) {
      return data as StandardDataSourceConfig
    }
    
    // 2. deal with SimpleConfigurationEditor Format
    if (this.isSimpleConfigEditorFormat(data)) {
      return this.convertFromSimpleConfigEditor(data, componentId)
    }
    
    // 3. Handle import and export formats（original DataItem[]）
    if (this.isImportExportFormat(data)) {
      return this.convertFromImportExport(data, componentId)
    }
    
    // 4. deal with Card2.1 Executor format
    if (this.isCard2ExecutorFormat(data)) {
      return this.convertFromCard2Executor(data, componentId)
    }
    
    // 5. deal with EditorDataSourceManager Format
    if (this.isEditorManagerFormat(data)) {
      return this.convertFromEditorManager(data, componentId)
    }
    
    // 6. Handle arbitrary object formats（reveal all the details）
    return this.convertFromGenericObject(data, componentId)
  }
  
  /**
   * 🔥 reverse conversion：Convert from standard format to target format
   */
  static convertFromStandard(standardData: StandardDataSourceConfig, targetFormat: 'simpleConfigEditor' | 'importExport' | 'card2Executor'): any {
    
    switch (targetFormat) {
      case 'simpleConfigEditor':
        return this.convertToSimpleConfigEditor(standardData)
      case 'importExport':
        return this.convertToImportExport(standardData)
      case 'card2Executor':
        return this.convertToCard2Executor(standardData)
      default:
        return standardData
    }
  }
  
  // =================== Format detection method ===================
  
  private static isStandardFormat(data: any): boolean {
    return !!(
      data && 
      typeof data === 'object' &&
      'componentId' in data &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.every((ds: any) => 
        ds && 
        'sourceId' in ds && 
        'dataItems' in ds && 
        Array.isArray(ds.dataItems) &&
        ds.dataItems.every((item: any) => 
          item && 'item' in item && 'processing' in item
        )
      )
    )
  }
  
  private static isSimpleConfigEditorFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.some((ds: any) => 
        ds && 'sourceId' in ds && 'dataItems' in ds
      )
    )
  }
  
  private static isImportExportFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'dataSourceConfig' in data &&
      data.dataSourceConfig?.dataItems &&
      Array.isArray(data.dataSourceConfig.dataItems) &&
      // Check if it is in original format（No item/processing Package）
      data.dataSourceConfig.dataItems.some((item: any) => 
        item && !('item' in item && 'processing' in item)
      )
    )
  }
  
  private static isCard2ExecutorFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      Object.keys(data).some(key => 
        data[key] && 
        typeof data[key] === 'object' && 
        ('type' in data[key] && 'data' in data[key] && 'metadata' in data[key])
      )
    )
  }
  
  private static isEditorManagerFormat(data: any): boolean {
    return !!(
      data &&
      typeof data === 'object' &&
      'type' in data &&
      'config' in data &&
      !('item' in data && 'processing' in data)
    )
  }
  
  // =================== Conversion method ===================
  
  private static convertFromSimpleConfigEditor(data: any, componentId: string): StandardDataSourceConfig {
    const dataSources = (data.dataSources || []).map((ds: any) => ({
      sourceId: ds.sourceId || 'default',
      dataItems: (ds.dataItems || []).map((item: any): StandardDataItem => {
        // If it is already in standard format
        if (item && 'item' in item && 'processing' in item) {
          return item as StandardDataItem
        }
        // If it is the original format，Need packaging
        return {
          item: {
            type: item.type || 'static',
            config: item.config || item
          },
          processing: {
            filterPath: item.filterPath || '$',
            customScript: item.customScript,
            defaultValue: item.defaultValue
          }
        }
      }),
      mergeStrategy: ds.mergeStrategy || { type: 'object' }
    }))
    
    return {
      componentId,
      dataSources,
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now()
    }
  }
  
  private static convertFromImportExport(data: any, componentId: string): StandardDataSourceConfig {
    const dataItems = (data.dataSourceConfig?.dataItems || []).map((rawItem: any): StandardDataItem => ({
      item: {
        type: rawItem.type || 'static',
        config: rawItem.config || rawItem
      },
      processing: {
        filterPath: '$',
        customScript: undefined,
        defaultValue: undefined
      }
    }))
    
    return {
      componentId,
      dataSources: [{
        sourceId: 'main',
        dataItems,
        mergeStrategy: data.dataSourceConfig?.mergeStrategy || { type: 'object' }
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  
  private static convertFromCard2Executor(data: any, componentId: string): StandardDataSourceConfig {
    const dataSources = Object.entries(data).map(([sourceId, sourceData]: [string, any]): any => ({
      sourceId,
      dataItems: [{
        item: {
          type: sourceData.type || 'static',
          config: sourceData.data || sourceData
        },
        processing: {
          filterPath: '$',
          customScript: undefined,
          defaultValue: undefined
        }
      }],
      mergeStrategy: { type: 'object' }
    }))
    
    return {
      componentId,
      dataSources,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  
  private static convertFromEditorManager(data: any, componentId: string): StandardDataSourceConfig {
    return {
      componentId,
      dataSources: [{
        sourceId: 'main',
        dataItems: [{
          item: {
            type: data.type || 'static',
            config: data.config || data
          },
          processing: {
            filterPath: data.filterPath || '$',
            customScript: data.processScript,
            defaultValue: undefined
          }
        }],
        mergeStrategy: { type: 'object' }
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  
  private static convertFromGenericObject(data: any, componentId: string): StandardDataSourceConfig {
    return {
      componentId,
      dataSources: [{
        sourceId: 'main',
        dataItems: [{
          item: {
            type: 'static',
            config: data
          },
          processing: {
            filterPath: '$',
            customScript: undefined,
            defaultValue: undefined
          }
        }],
        mergeStrategy: { type: 'object' }
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  
  // =================== reverse conversion method ===================
  
  private static convertToSimpleConfigEditor(standardData: StandardDataSourceConfig): any {
    return {
      dataSources: standardData.dataSources.map(ds => ({
        sourceId: ds.sourceId,
        dataItems: ds.dataItems,  // maintain standard format
        mergeStrategy: ds.mergeStrategy
      })),
      createdAt: standardData.createdAt,
      updatedAt: standardData.updatedAt
    }
  }
  
  private static convertToImportExport(standardData: StandardDataSourceConfig): any {
    const dataItems = standardData.dataSources.flatMap(ds => 
      ds.dataItems.map(item => item.item)  // Extract original item，remove processing Package
    )
    
    return {
      dataSourceConfig: {
        dataItems,
        mergeStrategy: standardData.dataSources[0]?.mergeStrategy || { type: 'object' }
      }
    }
  }
  
  private static convertToCard2Executor(standardData: StandardDataSourceConfig): any {
    const result: any = {}
    
    standardData.dataSources.forEach(ds => {
      ds.dataItems.forEach((item, index) => {
        const key = ds.dataItems.length === 1 ? ds.sourceId : `${ds.sourceId}_${index}`
        result[key] = {
          type: item.item.type,
          data: item.item.config,
          metadata: {
            sourceId: ds.sourceId,
            processing: item.processing
          }
        }
      })
    })
    
    return result
  }
  
  /**
   * 🔥 Batch normalization method
   */
  static normalizeMultiple(dataList: Array<{ data: any, componentId: string }>): StandardDataSourceConfig[] {
    return dataList.map(({ data, componentId }) => this.normalizeToStandard(data, componentId))
  }
  
  /**
   * 🔥 Verify standard format integrity
   */
  static validateStandardFormat(data: StandardDataSourceConfig): { 
    valid: boolean, 
    errors: string[] 
  } {
    const errors: string[] = []
    
    if (!data.componentId) {
      errors.push('Lack componentId')
    }
    
    if (!Array.isArray(data.dataSources)) {
      errors.push('dataSources Must be an array')
    } else {
      data.dataSources.forEach((ds, dsIndex) => {
        if (!ds.sourceId) {
          errors.push(`dataSources[${dsIndex}] Lack sourceId`)
        }
        
        if (!Array.isArray(ds.dataItems)) {
          errors.push(`dataSources[${dsIndex}] dataItems Must be an array`)
        } else {
          ds.dataItems.forEach((item, itemIndex) => {
            if (!item.item || !item.processing) {
              errors.push(`dataSources[${dsIndex}].dataItems[${itemIndex}] Incorrect format`)
            }
          })
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}