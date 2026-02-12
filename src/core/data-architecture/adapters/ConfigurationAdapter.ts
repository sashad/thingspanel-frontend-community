/**
 * Configuration version adapter implementation
 * Responsible for automatic conversion and compatibility processing of old and new configuration formats
 *
 * Core functions：
 * 1. Automatically detect configuration versions
 * 2. Lossless upgrade v1 -> v2
 * 3. Compatibility downgrade v2 -> v1
 * 4. Data item format conversion
 */

import type {
  // Existing types
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  ExecutionResult
} from '../executors/MultiLayerExecutorChain'

import type {
  DataItem as LegacyDataItem,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig
} from '../executors/DataItemFetcher'

import type {
  // Enhancement type
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  HttpHeader,
  HttpParam,
  ConfigurationAdapter as IConfigurationAdapter
} from '../types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '@/core/data-architecture/types/enhanced-types'

/**
 * Configuration conversion results
 */
export interface ConversionResult<T = any> {
  /** Is the conversion successful? */
  success: boolean

  /** converted data */
  data?: T

  /** Warnings during conversion */
  warnings: string[]

  /** Errors during conversion */
  errors: string[]

  /** Convert meta information */
  metadata: {
    /** source version */
    sourceVersion: string
    /** target version */
    targetVersion: string
    /** conversion time */
    convertedAt: number
  }
}

/**
 * Configuration version adapter implementation class
 */
export class ConfigurationAdapter implements IConfigurationAdapter {
  /**
   * Check configuration version
   */
  detectVersion(config: any): 'v1.0' | 'v2.0' {
    // Check version field
    if (config && typeof config.version === 'string') {
      return config.version.startsWith('2.') ? 'v2.0' : 'v1.0'
    }

    // Check the Enhanced Features field
    if (config && (config.dynamicParams || config.enhancedFeatures)) {
      return 'v2.0'
    }

    // Check data item format characteristics
    if (config && config.dataSources && Array.isArray(config.dataSources)) {
      const firstDataSource = config.dataSources[0]
      if (firstDataSource && firstDataSource.dataItems && Array.isArray(firstDataSource.dataItems)) {
        const firstDataItem = firstDataSource.dataItems[0]
        if (firstDataItem && firstDataItem.id) {
          return 'v2.0' // haveidField，yesv2Format
        }
      }
    }

    // Default isv1Format
    return 'v1.0'
  }

  /**
   * Adapt configuration to specified version
   */
  adaptToVersion(config: any, targetVersion: 'v1.0' | 'v2.0'): ConversionResult {
    const sourceVersion = this.detectVersion(config)

    try {
      if (sourceVersion === targetVersion) {
        return {
          success: true,
          data: config,
          warnings: [],
          errors: [],
          metadata: {
            sourceVersion,
            targetVersion,
            convertedAt: Date.now()
          }
        }
      }

      const convertedData = targetVersion === 'v2.0' ? this.upgradeV1ToV2(config) : this.downgradeV2ToV1(config)

      return {
        success: true,
        data: convertedData,
        warnings: [],
        errors: [],
        metadata: {
          sourceVersion,
          targetVersion,
          convertedAt: Date.now()
        }
      }
    } catch (error) {
      return {
        success: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          sourceVersion,
          targetVersion,
          convertedAt: Date.now()
        }
      }
    }
  }

  /**
   * v1upgrade tov2（Lossless upgrade）
   */
  upgradeV1ToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration {
    const enhancedConfig: EnhancedDataSourceConfiguration = {
      // Keep all original fields
      ...v1Config,

      // Add version identifier
      version: '2.0.0',

      // Default dynamic parameter configuration
      dynamicParams: [],

      // Default enhancement switch
      enhancedFeatures: {
        ...DEFAULT_ENHANCED_FEATURES
      },

      // Add configuration metadata
      metadata: {
        name: `Configuration_${v1Config.componentId}`,
        description: `fromv1.0Upgraded configuration`,
        author: 'system',
        versionHistory: [
          {
            version: '2.0.0',
            timestamp: Date.now(),
            changelog: 'fromv1.0Automatically upgrade tov2.0',
            author: 'ConfigurationAdapter'
          }
        ],
        tags: ['upgraded', 'v2']
      },

      // Upgrade data source configuration
      dataSources: v1Config.dataSources.map(dataSource => ({
        ...dataSource,
        dataItems: dataSource.dataItems.map((dataItemWrapper, index) => ({
          ...dataItemWrapper,
          item: this.upgradeDataItemToV2(dataItemWrapper.item, `${dataSource.sourceId}_item_${index}`)
        }))
      }))
    }

    return enhancedConfig
  }

  /**
   * v2downgrade tov1（Compatibility downgrade）
   */
  downgradeV2ToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration {
    const legacyConfig: LegacyDataSourceConfiguration = {
      componentId: v2Config.componentId,
      dataSources: v2Config.dataSources.map(dataSource => ({
        sourceId: dataSource.sourceId,
        dataItems: dataSource.dataItems.map(dataItemWrapper => ({
          item: this.downgradeDataItemToV1(dataItemWrapper.item),
          processing: dataItemWrapper.processing
        })),
        mergeStrategy: dataSource.mergeStrategy
      })),
      createdAt: v2Config.createdAt,
      updatedAt: Date.now() // Update timestamp
    }

    return legacyConfig
  }

  /**
   * The data item is upgraded tov2Format
   */
  private upgradeDataItemToV2(v1Item: LegacyDataItem, itemId: string): DataItemConfig {
    const baseItem: DataItemConfig = {
      type: v1Item.type,
      id: itemId,
      config: v1Item.config,
      metadata: {
        displayName: `${v1Item.type}data item`,
        description: `fromv1.0upgraded${v1Item.type}data item`,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        enabled: true,
        tags: ['upgraded']
      }
    }

    // Special handling of different types of configurations
    switch (v1Item.type) {
      case 'json':
        const legacyJsonConfig = v1Item.config as LegacyJsonDataItemConfig
        const enhancedJsonConfig: EnhancedJsonDataItemConfig = {
          jsonData: legacyJsonConfig.jsonString, // Field rename
          validation: {
            enableFormat: true,
            enableStructure: false
          },
          preprocessing: {
            removeComments: false,
            formatOutput: false
          }
        }
        return { ...baseItem, config: enhancedJsonConfig }

      case 'http':
        const legacyHttpConfig = v1Item.config as LegacyHttpDataItemConfig
        const enhancedHttpConfig: EnhancedHttpDataItemConfig = {
          url: legacyHttpConfig.url,
          method: legacyHttpConfig.method,
          headers: this.convertHeadersRecordToArray(legacyHttpConfig.headers || {}),
          params: [], // v1Noneparams，Default is empty array
          body: legacyHttpConfig.body
            ? {
                type: 'json',
                content: legacyHttpConfig.body
              }
            : undefined,
          timeout: legacyHttpConfig.timeout,
          retry: {
            maxRetries: 3,
            retryDelay: 1000
          }
        }
        return { ...baseItem, config: enhancedHttpConfig }

      default:
        // Leave other types as is
        return baseItem
    }
  }

  /**
   * The data item is downgraded tov1Format
   */
  private downgradeDataItemToV1(v2Item: DataItemConfig): LegacyDataItem {
    switch (v2Item.type) {
      case 'json':
        const enhancedJsonConfig = v2Item.config as EnhancedJsonDataItemConfig
        return {
          type: 'json',
          config: {
            jsonString: enhancedJsonConfig.jsonData // Field renamed back
          }
        }

      case 'http':
        const enhancedHttpConfig = v2Item.config as EnhancedHttpDataItemConfig
        return {
          type: 'http',
          config: {
            url: enhancedHttpConfig.url,
            method: enhancedHttpConfig.method,
            headers: this.convertHeadersArrayToRecord(enhancedHttpConfig.headers),
            body: enhancedHttpConfig.body?.content,
            timeout: enhancedHttpConfig.timeout
          }
        }

      case 'websocket':
        return {
          type: 'websocket',
          config: v2Item.config // WebSocketConfiguration remains unchanged
        }

      case 'script':
        return {
          type: 'script',
          config: v2Item.config // ScriptConfiguration remains unchanged
        }

      default:
        // unknown type，Try to keep the original format
        return {
          type: v2Item.type as any,
          config: v2Item.config
        }
    }
  }

  /**
   * WillRecordFormat的headersConvert toArrayFormat
   */
  private convertHeadersRecordToArray(headers: Record<string, string>): HttpHeader[] {
    return Object.entries(headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
      isDynamic: false
    }))
  }

  /**
   * WillArrayFormat的headersConvert toRecordFormat
   */
  private convertHeadersArrayToRecord(headers: HttpHeader[]): Record<string, string> {
    return headers
      .filter(header => header.enabled)
      .reduce(
        (acc, header) => {
          acc[header.key] = header.value
          return acc
        },
        {} as Record<string, string>
      )
  }

  /**
   * Batch conversion configuration
   */
  public batchConvert(configs: any[], targetVersion: 'v1.0' | 'v2.0'): ConversionResult[] {
    return configs.map(config => this.adaptToVersion(config, targetVersion))
  }

  /**
   * Verify consistency of configuration transformations
   */
  public validateConversion(original: any, converted: any): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check basic fields
    if (original.componentId !== converted.componentId) {
      issues.push('componentIdno match')
    }

    if (original.dataSources.length !== converted.dataSources.length) {
      issues.push('dataSourcesQuantity does not match')
    }

    // Check data source
    for (let i = 0; i < original.dataSources.length; i++) {
      const origDs = original.dataSources[i]
      const convDs = converted.dataSources[i]

      if (origDs.sourceId !== convDs.sourceId) {
        issues.push(`data source${i}ofsourceIdno match`)
      }

      if (origDs.dataItems.length !== convDs.dataItems.length) {
        issues.push(`data source${i}ofdataItemsQuantity does not match`)
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

// ==================== Factory function ====================

/**
 * Create a configuration adapter instance
 */
export function createConfigurationAdapter(): ConfigurationAdapter {
  return new ConfigurationAdapter()
}

// ==================== Convenience function ====================

/**
 * Quickly detect configuration versions
 */
export function detectConfigVersion(config: any): 'v1.0' | 'v2.0' {
  return createConfigurationAdapter().detectVersion(config)
}

/**
 * Quickly upgrade configuration tov2
 */
export function upgradeToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration {
  return createConfigurationAdapter().upgradeV1ToV2(v1Config)
}

/**
 * Quickly downgrade configuration tov1
 */
export function downgradeToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration {
  return createConfigurationAdapter().downgradeV2ToV1(v2Config)
}

// ==================== Export ====================
export type { ConversionResult }
