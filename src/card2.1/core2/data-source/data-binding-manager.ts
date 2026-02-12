/**
 * data binding manager
 * Responsible for binding and synchronizing data sources and components
 */

import type { StaticDataSource } from './static-data-source'
import type { DeviceApiDataSource } from './device-api-data-source'
import { componentSchemaManager } from './component-schema'

type DataSource = StaticDataSource | DeviceApiDataSource

export interface ComponentDataBinding {
  componentId: string
  componentInstanceId?: string // There may be multiple instances of the same component
  dataSourceId: string
  bindingConfig: {
    [componentField: string]: {
      dataPath: string
      transform?: (value: any) => any // Optional data conversion functions
      fallbackValue?: any
    }
  }
}

export interface DataBindingStatus {
  [fieldName: string]: {
    isBound: boolean
    isValid: boolean
    currentValue: any
    lastUpdated?: Date
    error?: string
  }
}

/**
 * data binding manager
 */
export class DataBindingManager {
  private dataSources = new Map<string, DataSource>()
  private bindings = new Map<string, ComponentDataBinding>()
  private bindingStatuses = new Map<string, DataBindingStatus>()
  private updateCallbacks = new Map<string, Array<(data: any) => void>>()

  /**
   * Register data source
   */
  registerDataSource(dataSource: DataSource) {
    this.dataSources.set(dataSource.getId(), dataSource)
  }

  /**
   * Remove data source
   */
  removeDataSource(dataSourceId: string) {
    this.dataSources.delete(dataSourceId)

    // Clean up related bindings
    const bindingsToRemove: string[] = []
    for (const [bindingId, binding] of this.bindings.entries()) {
      if (binding.dataSourceId === dataSourceId) {
        bindingsToRemove.push(bindingId)
      }
    }

    bindingsToRemove.forEach(bindingId => {
      this.removeBinding(bindingId)
    })
  }

  /**
   * Create component data binding
   */
  createBinding(binding: ComponentDataBinding): string {
    const bindingId = `${binding.componentId}-${binding.componentInstanceId || 'default'}`

    this.bindings.set(bindingId, binding)
    this.bindingStatuses.set(bindingId, {})

    // Update binding status now
    this.updateBinding(bindingId)

    return bindingId
  }

  /**
   * Remove binding
   */
  removeBinding(bindingId: string) {
    this.bindings.delete(bindingId)
    this.bindingStatuses.delete(bindingId)
    this.updateCallbacks.delete(bindingId)
  }

  /**
   * Update binding configuration
   */
  updateBindingConfig(bindingId: string, newConfig: Partial<ComponentDataBinding>) {
    const existingBinding = this.bindings.get(bindingId)
    if (!existingBinding) {
      return
    }

    const updatedBinding = { ...existingBinding, ...newConfig }
    this.bindings.set(bindingId, updatedBinding)
    // Update binding status now
    this.updateBinding(bindingId)
  }

  /**
   * Subscribe to data updates
   */
  subscribe(bindingId: string, callback: (data: any) => void) {
    if (!this.updateCallbacks.has(bindingId)) {
      this.updateCallbacks.set(bindingId, [])
    }

    this.updateCallbacks.get(bindingId)!.push(callback)

    // Trigger a callback immediately
    const currentData = this.getCurrentData(bindingId)
    if (currentData) {
      callback(currentData)
    }
  }

  /**
   * Unsubscribe
   */
  unsubscribe(bindingId: string, callback: (data: any) => void) {
    const callbacks = this.updateCallbacks.get(bindingId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Manually refresh binding data
   */
  async refreshBinding(bindingId: string) {
    await this.updateBinding(bindingId)
  }

  /**
   * Get binding status
   */
  getBindingStatus(bindingId: string): DataBindingStatus | undefined {
    return this.bindingStatuses.get(bindingId)
  }

  /**
   * Get current binding data
   */
  getCurrentData(bindingId: string): any {
    const status = this.bindingStatuses.get(bindingId)
    if (!status) return null

    const data: any = {}
    for (const [field, fieldStatus] of Object.entries(status)) {
      if (fieldStatus.isValid) {
        data[field] = fieldStatus.currentValue
      }
    }

    return data
  }

  /**
   * Update binding status（core methods）
   */
  private async updateBinding(bindingId: string) {
    const binding = this.bindings.get(bindingId)
    if (!binding) return

    const dataSource = this.dataSources.get(binding.dataSourceId)
    if (!dataSource) {
      return
    }

    try {
      // Get component data requirements
      const componentSchema = componentSchemaManager.getSchema(binding.componentId)
      if (!componentSchema) {
        return
      }

      // Get raw data from data source
      const sourceData = await dataSource.getValue()
      const newStatus: DataBindingStatus = {}
      const componentData: any = {}

      // Process each component field
      for (const [componentField, fieldDef] of Object.entries(componentSchema.fields)) {
        const bindingConfig = binding.bindingConfig[componentField]

        if (bindingConfig) {
          // There is a binding configuration，Extract values ​​from data source
          const rawValue = sourceData[componentField]
          let finalValue = rawValue

          // Apply data transformation
          if (bindingConfig.transform && rawValue !== undefined) {
            try {
              finalValue = bindingConfig.transform(rawValue)
            } catch (error) {
              finalValue = bindingConfig.fallbackValue ?? fieldDef.defaultValue
            }
          }

          // If the value isundefined，usefallbackor default value
          if (finalValue === undefined) {
            finalValue = bindingConfig.fallbackValue ?? fieldDef.defaultValue
          }

          newStatus[componentField] = {
            isBound: true,
            isValid: finalValue !== undefined,
            currentValue: finalValue,
            lastUpdated: new Date()
          }

          componentData[componentField] = finalValue
        } else {
          // No binding configuration，Use default value
          const defaultValue = fieldDef.defaultValue

          newStatus[componentField] = {
            isBound: false,
            isValid: true,
            currentValue: defaultValue,
            lastUpdated: new Date()
          }

          componentData[componentField] = defaultValue
        }
      }

      // Update binding status
      this.bindingStatuses.set(bindingId, newStatus)

      // Validate data
      const validation = componentSchemaManager.validateComponentData(binding.componentId, componentData)
      // Notify subscribers
      const callbacks = this.updateCallbacks.get(bindingId)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(componentData)
          } catch (error) {}
        })
      }
    } catch (error) {}
  }

  /**
   * Get all bindings
   */
  getAllBindings(): Array<{ id: string; binding: ComponentDataBinding; status: DataBindingStatus }> {
    const result: Array<{ id: string; binding: ComponentDataBinding; status: DataBindingStatus }> = []

    for (const [bindingId, binding] of this.bindings.entries()) {
      const status = this.bindingStatuses.get(bindingId) || {}
      result.push({ id: bindingId, binding, status })
    }

    return result
  }

  /**
   * Get a list of data sources
   */
  getDataSourceList(): Array<{ id: string; type: string; name?: string }> {
    return Array.from(this.dataSources.values()).map(ds => ({
      id: ds.getId(),
      type: ds.getType(),
      name: ds.exportConfig().name
    }))
  }
}

// Export singleton
export const dataBindingManager = new DataBindingManager()
export default dataBindingManager
