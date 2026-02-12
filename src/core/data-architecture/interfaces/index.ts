/**
 * Data architecture interface definition
 * Clarify the boundaries of responsibilities of the three data layers，Provide guidance for incremental refactoring
 */

// Editor big data management
export type { IEditorDataManager, EditorData, EditorDataChangeEvent } from '@/core/data-architecture/interfaces/IEditorDataManager'

// Component configuration management
export type {
  IComponentConfigManager,
  WidgetConfiguration,
  ConfigLayer,
  BaseConfig,
  ComponentConfig,
  DataSourceConfig,
  InteractionConfig,
  ConfigChangeEvent,
  ConfigValidationResult
} from './IComponentConfigManager'

// Runtime data management
export type {
  IComponentDataManager,
  ComponentDataRequirement,
  DataSourceDefinition,
  DataSourceType,
  DataExecutionResult,
  ComponentDataState,
  DataUpdateEvent
} from './IComponentDataManager'

// Simplified data bridge (new architecture)
export { SimpleDataBridge, simpleDataBridge, createSimpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

export type {
  SimpleDataSourceConfig,
  DataResult,
  ComponentDataRequirement as SimpleComponentDataRequirement,
  DataUpdateCallback
} from '../SimpleDataBridge'

// Configure conversion adapter
export {
  convertToSimpleDataRequirement,
  shouldConvertConfig,
  extractComponentType,
  batchConvertConfigs
} from '../ConfigToSimpleDataAdapter'

// Visual Editor Bridge
export { visualEditorBridge, VisualEditorBridge, getVisualEditorBridge } from '@/core/data-architecture/VisualEditorBridge'

/**
 * Data architecture design principles：
 *
 * 1. **Segregation of duties**：Each of the three data layers performs its own duties，Do not call each other
 *    - EditorDataManager：Manage component tree and canvas configuration
 *    - ComponentConfigManager：Management component four-layer configuration
 *    - ComponentDataManager：Manage runtime data
 *
 * 2. **event driven**：Communication between layers through events，Do not call method directly
 *    - Configuration changes → emit event → The data layer listens and updates
 *    - Data update → emit event → UILayer monitoring and re-rendering
 *
 * 3. **Simple and direct**：Avoid complex state management and dependency chains
 *    - No polling、Heavy-duty features like connection pooling
 *    - error tolerance，Does not block the interface
 *    - Caching strategy is simple and clear
 *
 * 4. **progressive refactoring**：Interface first，Implement gradual replacement
 *    - Define a clear interface first
 *    - New implementation coexists with old systems
 *    - Gradually switch to the new architecture
 */
