/**
 * Multi-level executor chain export index
 * 4Unified export portal for layer data processing pipelines
 */

// first floor：Data item getter
export {
  DataItemFetcher,
  type IDataItemFetcher,
  type DataItem,
  type JsonDataItemConfig,
  type HttpDataItemConfig,
  type WebSocketDataItemConfig,
  type ScriptDataItemConfig
} from './DataItemFetcher'

// second floor：data item handler
export { DataItemProcessor, type IDataItemProcessor, type ProcessingConfig } from '@/core/data-architecture/executors/DataItemProcessor'

// third floor：data source combiner
export { DataSourceMerger, type IDataSourceMerger, type MergeStrategy } from '@/core/data-architecture/executors/DataSourceMerger'

// fourth floor：multi-source integrator
export {
  MultiSourceIntegrator,
  type IMultiSourceIntegrator,
  type ComponentData,
  type DataSourceResult
} from './MultiSourceIntegrator'

// main coordination class：Multi-level actuator chain
export {
  MultiLayerExecutorChain,
  type IMultiLayerExecutorChain,
  type DataSourceConfiguration,
  type ExecutionState,
  type ExecutionResult
} from './MultiLayerExecutorChain'

// Import for factory function
import { MultiLayerExecutorChain } from '@/core/data-architecture/executors/MultiLayerExecutorChain'

// Convenience factory function
export function createExecutorChain(): MultiLayerExecutorChain {
  return new MultiLayerExecutorChain()
}

// type tools
export type AllDataItemTypes = 'json' | 'http' | 'websocket' | 'script'
export type AllMergeStrategyTypes = 'object' | 'array' | 'script'

// Version information
export const EXECUTOR_CHAIN_VERSION = '1.0.0'
