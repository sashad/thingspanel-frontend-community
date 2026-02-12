/**
 * Data architecture core module export
 * Contains multi-level executor chains、Enhanced type system and configuration adapter
 *
 * Release Notes：
 * - v1.0: Original actuator chain and configuration system
 * - v2.0: Enhanced generic type system，Support dynamic parameters and version management
 */

// Multi-level actuator chain (v1.0)
export * from '@/core/data-architecture/executors'

// Enhanced type system (v2.0)
export * from '@/core/data-architecture/types'

// Configure adapter system
export * from '@/core/data-architecture/adapters'

// Configure the build module
export * from '@/core/data-architecture/config-generation'

// Convenient function export
export {
  ExampleConfigGenerator,
  ExecutorChainUsageExample,
  exampleRunner,
  configGenerator
} from './executors/example-usage'

// Easy configuration system (SUBTASK-010)
export { ConfigurationManager, configurationManager, type ConfigurationTemplate } from '@/core/data-architecture/services/ConfigurationManager'

// Simple configuration of editor components
export { default as SimpleConfigurationEditor } from '@/core/data-architecture/components/SimpleConfigurationEditor.vue'

// Version information
export { EXECUTOR_CHAIN_VERSION } from '@/core/data-architecture/executors'
export { TYPE_SYSTEM_VERSION, SUPPORTED_CONFIG_VERSIONS } from '@/core/data-architecture/types'
export { ADAPTER_VERSION } from '@/core/data-architecture/adapters'

// Data architecture system version information
export const DATA_ARCHITECTURE_VERSION = {
  EXECUTORS: '1.0.0', // Actuator chain version
  TYPES: '2.0.0', // type system version
  ADAPTERS: '1.0.0', // Adapter version
  OVERALL: '2.0.0' // Overall system version
} as const

// Type re-export
export type {
  // Actuator chain related types
  DataSourceConfiguration,
  ExecutionState,
  ExecutionResult,
  ComponentData,
  DataItem,
  MergeStrategy,
  ProcessingConfig,

  // generic type
  AllDataItemTypes,
  AllMergeStrategyTypes
} from './executors'

// Original core components (Export only when needed)
// export { UnifiedDataExecutor } from '@/core/data-architecture/UnifiedDataExecutor'
