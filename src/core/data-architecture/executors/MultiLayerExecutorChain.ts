/**
 * Multi-level executor chain main coordination class
 * Integrate4layer executor，Provides a complete data processing pipeline
 */

import { DataItemFetcher, DataItem, IDataItemFetcher } from '@/core/data-architecture/executors/DataItemFetcher'
import { DataItemProcessor, ProcessingConfig, IDataItemProcessor } from '@/core/data-architecture/executors/DataItemProcessor'
import { DataSourceMerger, MergeStrategy, IDataSourceMerger } from '@/core/data-architecture/executors/DataSourceMerger'
import { MultiSourceIntegrator, ComponentData, DataSourceResult, IMultiSourceIntegrator } from '@/core/data-architecture/executors/MultiSourceIntegrator'

/**
 * Data source configuration structure
 */
export interface DataSourceConfiguration {
  componentId: string
  dataSources: Array<{
    sourceId: string
    dataItems: Array<{
      item: DataItem
      processing: ProcessingConfig
    }>
    mergeStrategy: MergeStrategy
  }>
  createdAt: number
  updatedAt: number
}

/**
 * Execution status tracking (for debugging monitoring)
 */
export interface ExecutionState {
  componentId: string
  dataSourceId: string
  stages: {
    /** first floor: Raw data acquisition results */
    rawData: Map<string, { data: any; timestamp: number; success: boolean }>
    /** second floor: Data processing results */
    processedData: Map<string, { data: any; timestamp: number; success: boolean }>
    /** third floor: Data source merge results */
    mergedData: { data: any; timestamp: number; success: boolean } | null
    /** fourth floor: final component data */
    finalData: { data: any; timestamp: number; success: boolean } | null
  }
  debugMode: boolean
  lastExecuted: number
}

/**
 * Execution result
 */
export interface ExecutionResult {
  /** Is it successful? */
  success: boolean
  /** component data */
  componentData?: ComponentData
  /** error message */
  error?: string
  /** Execution time（millisecond） */
  executionTime: number
  /** Timestamp */
  timestamp: number
  /** debug status */
  executionState?: ExecutionState
}

/**
 * Multi-level actuator link interface
 */
export interface IMultiLayerExecutorChain {
  /**
   * Execute complete data processing pipeline
   * @param config Data source configuration
   * @param debugMode Whether to enable debugging mode
   * @returns Execution result
   */
  executeDataProcessingChain(config: DataSourceConfiguration, debugMode?: boolean): Promise<ExecutionResult>
}

/**
 * Multi-level executor chain implementation class
 */
export class MultiLayerExecutorChain implements IMultiLayerExecutorChain {
  private dataItemFetcher: IDataItemFetcher
  private dataItemProcessor: IDataItemProcessor
  private dataSourceMerger: IDataSourceMerger
  private multiSourceIntegrator: IMultiSourceIntegrator

  constructor() {
    this.dataItemFetcher = new DataItemFetcher()
    this.dataItemProcessor = new DataItemProcessor()
    this.dataSourceMerger = new DataSourceMerger()
    this.multiSourceIntegrator = new MultiSourceIntegrator()
  }

  /**
   * Execute complete data processing pipeline
   */
  async executeDataProcessingChain(
    config: DataSourceConfiguration,
    debugMode: boolean = false
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    // 🔥 set upDataItemFetchercomponent context
    this.dataItemFetcher.setCurrentComponentId(config.componentId)

    // 🔥 Remove circular print log，avoid200+Performance issues in component scenarios

    try {
      const dataSourceResults: DataSourceResult[] = []
      let executionState: ExecutionState | undefined

      // Initialize debugging state
      if (debugMode) {
        executionState = this.initializeExecutionState(config.componentId)
      }

      // Process each data source
      for (const dataSourceConfig of config.dataSources) {
        // 🔥 Remove circular print log

        // 🔥 critical debugging：ifdataItemsDoes not exist or is empty，Report immediately
        if (!dataSourceConfig.dataItems || dataSourceConfig.dataItems.length === 0) {
          console.error(`🚨 [MultiLayerExecutorChain] Data source configuration exception - dataItemsis empty！`, {
            dataSourceID: dataSourceConfig.sourceId,
            dataItemsType: typeof dataSourceConfig.dataItems,
            dataItemsValue: dataSourceConfig.dataItems,
            thisMeans: 'DataItemFetcher.fetchDatamethod will not be called',
            completeDataSourceConfiguration: JSON.stringify(dataSourceConfig, null, 2)
          })
        }

        try {

          const sourceResult = await this.processDataSource(dataSourceConfig, executionState, config.componentId)


          // 🔥 Remove circular print log

          dataSourceResults.push(sourceResult)
        } catch (error) {
          console.error(`❌ [MultiLayerExecutorChain] processDataSourcecall failed:`, {
            dataSourceID: dataSourceConfig.sourceId,
            rrrorType: typeof error,
            errorMessage: error instanceof Error ? error.message : error,
            errorStack: error instanceof Error ? error.stack : undefined,
            originalErrorObject: error
          })

          dataSourceResults.push({
            sourceId: dataSourceConfig.sourceId,
            type: 'unknown',
            data: {},
            success: false,
            error: error instanceof Error ? error.message : 'unknown error'
          })
        }
      }

      // 🔥 Remove circular print log

      // fourth floor：Multi-source integration
      const componentData = await this.multiSourceIntegrator.integrateDataSources(dataSourceResults, config.componentId)

      // 🔥 Remove circular print log

      // Update debugging status
      if (executionState) {
        executionState.stages.finalData = {
          data: componentData,
          timestamp: Date.now(),
          success: Object.keys(componentData).length > 0
        }
        executionState.lastExecuted = Date.now()
      }

      const executionTime = Date.now() - startTime

      // 🔥 repair：Successful execution is success，Regardless of whether the data is empty
      return {
        success: true, // As long as there are no exceptions, it is a success
        componentData,
        executionTime,
        timestamp: Date.now(),
        executionState,
        // Add supporting information
        isEmpty: Object.keys(componentData).length === 0
      }
    } catch (error) {
      const executionTime = Date.now() - startTime

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution of executor chain failed',
        executionTime,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Work with a single data source
   */
  private async processDataSource(
    dataSourceConfig: {
      sourceId: string
      dataItems: Array<{ item: DataItem; processing: ProcessingConfig }>
      mergeStrategy: MergeStrategy
    },
    executionState?: ExecutionState,
    componentId?: string
  ): Promise<DataSourceResult> {
    // 🔥 The simplest confirmation log

    // 🔥 critical debugging：RecordprocessDataSourceEntry parameters of


    try {
      const processedItems: any[] = []

      // 🔥 critical debugging：examinedataItemsarray

      if (dataSourceConfig.dataItems.length === 0) {
        console.warn(`⚠️ [MultiLayerExecutorChain] dataItemsArray is empty，Unable to perform any data acquisition！`, {
          dataSourceID: dataSourceConfig.sourceId,
          thisMeans: 'will not be calledDataItemFetcher.fetchDatamethod'
        })
      }


      // Process each data item
      for (let i = 0; i < dataSourceConfig.dataItems.length; i++) {

        const { item, processing } = dataSourceConfig.dataItems[i]
        const itemId = `${dataSourceConfig.sourceId}_item_${i}`


        try {
          // 🔍 debug：Check passed tofetchDataofitemobject

          // 🔥 special inspectionHTTPType configuration
          if (item.type === 'http' && item.config) {

            // 🚨 examineHTTPIs there a broken binding path in the parameter?
            const allParams = [
              ...(item.config.params || []),
              ...(item.config.parameters || []),
              ...(item.config.pathParams || [])
            ]

            allParams.forEach((param, paramIndex) => {
              if (param.value && typeof param.value === 'string') {
                const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName

                if (isSuspiciousPath) {
                  console.error(`🚨 [MultiLayerExecutorChain] passing tofetchDataCorrupted binding path found before!`, {
                    componentsID: componentId || 'unknown',
                    dataSourceID: dataSourceConfig.sourceId,
                    parameterIndex: paramIndex,
                    parameterKey: param.key,
                    damagedValue: param.value,
                    variableName: param.variableName,
                    completeParameterObject: JSON.stringify(param, null, 2)
                  })
                } else {
                }
              }
            })
          }

          // 🔥 first floor：Data item acquisition - About to be calledDataItemFetcher.fetchData

          const rawData = await this.dataItemFetcher.fetchData(item)


          // Update debugging status
          if (executionState) {
            executionState.stages.rawData.set(itemId, {
              data: rawData,
              timestamp: Date.now(),
              success: Object.keys(rawData || {}).length > 0
            })
          }

          // second floor：Data item processing
          const processedData = await this.dataItemProcessor.processData(rawData, processing)

          // Update debugging status
          if (executionState) {
            executionState.stages.processedData.set(itemId, {
              data: processedData,
              timestamp: Date.now(),
              success: Object.keys(processedData || {}).length > 0
            })
          }

          processedItems.push(processedData)
        } catch (error) {
          console.error(`🚨 [MultiLayerExecutorChain] Data item processing failed - This is the critical exception！`, {
            itemId: itemId,
            itemType: item.type,
            DataItemIndex: i,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : error,
            errorStack: error instanceof Error ? error.stack : undefined,
            originalErrorObject: error,
            itemConfiguration: item.config,
            thatIsWhyThereIsNotHTTPReasonForRequest: 'Exceptions are handled silently'
          })
          processedItems.push({}) // Add empty object on failure
        }
      }

      // third floor：Data source merge
      const mergedData = await this.dataSourceMerger.mergeDataItems(processedItems, dataSourceConfig.mergeStrategy)

      // Update debugging status
      if (executionState) {
        executionState.stages.mergedData = {
          data: mergedData,
          timestamp: Date.now(),
          success: Object.keys(mergedData || {}).length > 0
        }
      }

      return {
        sourceId: dataSourceConfig.sourceId,
        type: dataSourceConfig.dataItems[0]?.item.type || 'unknown',
        data: mergedData,
        success: true
      }
    } catch (error) {
      return {
        sourceId: dataSourceConfig.sourceId,
        type: 'unknown',
        data: {},
        success: false,
        error: error instanceof Error ? error.message : 'Data source processing failed'
      }
    }
  }

  /**
   * Initialize execution status
   */
  private initializeExecutionState(componentId: string): ExecutionState {
    return {
      componentId,
      dataSourceId: '',
      stages: {
        rawData: new Map(),
        processedData: new Map(),
        mergedData: null,
        finalData: null
      },
      debugMode: true,
      lastExecuted: 0
    }
  }

  /**
   * Verify data source configuration
   */
  validateConfiguration(config: DataSourceConfiguration): boolean {
    if (!config.componentId || !config.dataSources) {
      return false
    }

    // 允许data项数组为空，This will return null data
    return config.dataSources.every(ds => ds.sourceId && Array.isArray(ds.dataItems) && ds.mergeStrategy)
  }

  /**
   * Get executor chain statistics
   */
  getChainStatistics(): {
    version: string
    supportedDataTypes: string[]
    supportedMergeStrategies: string[]
    features: string[]
  } {
    return {
      version: '1.0.0',
      supportedDataTypes: ['json', 'http', 'websocket', 'script'],
      supportedMergeStrategies: ['object', 'array', 'script'],
      features: [
        'JSONPathData filtering',
        'Custom script processing',
        'Multiple merge strategies',
        'Debugging monitoring mechanism',
        'Visual Editorcompatible',
        'Card2.1compatible'
      ]
    }
  }
}
