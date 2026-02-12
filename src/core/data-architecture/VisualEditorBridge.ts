/**
 * Visual Editor data bridge
 * for Visual Editor Components provide new architecture data execution capabilities
 * replace the original ComponentExecutorManager Direct dependence
 */

import { simpleDataBridge, type ComponentDataRequirement, type DataResult } from '@/core/data-architecture/SimpleDataBridge'
import type { DataSourceDefinition } from '@/core/data-architecture/interfaces/IComponentDataManager'
import { dataSourceBindingConfig, type AutoBindConfig } from '@/core/data-architecture/DataSourceBindingConfig'

// 🔥 repair：Use dynamic imports to avoid circular dependencies
// import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { useEditorStore } from '@/components/visual-editor/store/editor'

/**
 * Visual Editor dedicated data bridge
 * Encapsulation SimpleDataBridge，Provided with oldAPICompatible interface
 */
export class VisualEditorBridge {
  private dataUpdateCallbacks = new Map<string, (componentId: string, data: any) => void>()

  /**
   * Update component executor（Compatible with oldAPI）
   * @param componentId componentsID
   * @param componentType Component type
   * @param config Data source configuration
   */
  async updateComponentExecutor(componentId: string, componentType: string, config: any): Promise<DataResult> {


    // 🔥 Add detailed configuration structure debugging
  

    // Convert old configuration format to new data requirements format
    const requirement = this.convertConfigToRequirement(componentId, componentType, config)



    const result = await simpleDataBridge.executeComponent(requirement)


    // Notification data update callback
    this.notifyDataUpdate(componentId, result.data)

    return result
  }

  /**
   * Monitor data updates（Compatible with oldAPI）
   * @param callback Data update callback function
   */
  onDataUpdate(callback: (componentId: string, data: any) => void): () => void {
    const callbackId = Math.random().toString(36).substring(2, 15)
    this.dataUpdateCallbacks.set(callbackId, callback)

    return () => {
      this.dataUpdateCallbacks.delete(callbackId)
    }
  }

  /**
   * Get the current data of the component
   * @param componentId componentsID
   */
  getComponentData(componentId: string): Record<string, any> | null {
    return simpleDataBridge.getComponentData(componentId)
  }

  /**
   * Clear component data cache
   * @param componentId componentsID
   */
  clearComponentCache(componentId: string): void {
    simpleDataBridge.clearComponentCache(componentId)
  }

  /**
   * Notify data updates
   * @param componentId componentsID
   * @param data data
   */
  private notifyDataUpdate(componentId: string, data: any): void {
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {}
    })
  }

  /**
   * Convert the old configuration format to the new data requirements format
   * @param componentId componentsID
   * @param componentType Component type
   * @param config Configuration object
   */
  private convertConfigToRequirement(
    componentId: string,
    componentType: string,
    config: any
  ): ComponentDataRequirement {
    const dataSources: DataSourceDefinition[] = []

    // 🔥 critical fix：Extract basic configuration properties and inject them into data source parameters
    let resolvedConfig = config
    let baseConfig: any = null

    // If the configuration is WidgetConfiguration Format，Extract relevant parts
    if (config && typeof config === 'object') {
      // Check if it is the new hierarchical configuration format
      if (config.base || config.dataSource) {
        baseConfig = config.base || {}
        resolvedConfig = {
          // Merge device attributes in the basic configuration into the main configuration，Used for data source parsing
          ...config.dataSource,
          // Expose the device properties in the basic configuration to the data source for use
          deviceId: baseConfig.deviceId,
          metricsList: baseConfig.metricsList,
          // Keep the original data source configuration
          ...(config.dataSource || {})
        }



        // 🔥 New：Inject basic configuration intoHTTPin parameters，Make sure parameter bindings use the latest values
        resolvedConfig = this.injectBaseConfigToDataSource(resolvedConfig, baseConfig)
      }
    }

    // Handle data sources in configuration
    if (resolvedConfig && typeof resolvedConfig === 'object') {
      // 🔥 New：Detailed configuration structure debugging log
    

      // 🆕 process new DataSourceConfiguration Format
      if (resolvedConfig.dataSources && Array.isArray(resolvedConfig.dataSources)) {
        resolvedConfig.dataSources.forEach((dataSource: any) => {
          if (dataSource.sourceId && dataSource.dataItems && Array.isArray(dataSource.dataItems)) {
            // 🔥 critical fix：Maintain data source integrity，Do not split into independent data sources
            // Maintain the original data source structure，let MultiLayerExecutorChain Handle multiple data item merges
            const processedDataItems = dataSource.dataItems
              .map((dataItem: any, itemIndex: number) => {
                if (dataItem && dataItem.item) {
                  return {
                    item: {
                      type: dataItem.item.type,
                      config: this.convertItemConfig(dataItem.item)
                    },
                    processing: {
                      filterPath: dataItem.processing?.filterPath || '$',
                      customScript: dataItem.processing?.customScript,
                      defaultValue: {}
                    }
                  }
                }
                return null
              })
              .filter(Boolean)

            // Create a single data source configuration，Contains all data items and merge strategies
            dataSources.push({
              sourceId: dataSource.sourceId,
              dataItems: processedDataItems,
              mergeStrategy: dataSource.mergeStrategy || { type: 'object' }
            })
          }
        })
      }

      // 🆕 deal with rawDataList structure（From the data source configuration form）
      else if (resolvedConfig.rawDataList && Array.isArray(resolvedConfig.rawDataList)) {
        resolvedConfig.rawDataList.forEach((item: any, index: number) => {
          if (item && item.type && item.enabled !== false) {
            dataSources.push({
              id: `dataSource${index + 1}`,
              type: item.type as any,
              config: item.config || {},
              filterPath: item.filterPath,
              processScript: item.processScript
            })
          }
        })
      }

      // Handling multiple data sources（like dataSource1, dataSource2, dataSource3）
      if (dataSources.length === 0) {
        for (const [key, value] of Object.entries(resolvedConfig)) {
          if (key.startsWith('dataSource') && value && typeof value === 'object') {
            // 🔥 critical fix：Inject basic configuration properties into the data source configuration
            const enhancedDataSourceConfig = this.injectBaseConfigToDataSource(value as any, baseConfig)
            const dataSourceConfig = value as any

            if (enhancedDataSourceConfig.type && enhancedDataSourceConfig.enabled !== false) {
              dataSources.push({
                id: key,
                type: enhancedDataSourceConfig.type as any,
                config: enhancedDataSourceConfig.config || {},
                filterPath: enhancedDataSourceConfig.filterPath,
                processScript: enhancedDataSourceConfig.processScript
              })
            }
          }
        }
      }

      // Dealing with a single data source situation
      if (dataSources.length === 0 && resolvedConfig.type && resolvedConfig.enabled !== false) {
        // 🔥 special handling data-source-bindings type
        if (resolvedConfig.type === 'data-source-bindings') {
          // fordata-source-bindings，data inconfigof variousdataSourceXin field
          for (const [key, value] of Object.entries(resolvedConfig)) {
            if (key.startsWith('dataSource') && value && typeof value === 'object') {
              dataSources.push({
                id: key,
                type: resolvedConfig.type as any,
                config: { dataSourceBindings: { [key]: value } }, // 🔥 key：Pack data correctly
                filterPath: undefined,
                processScript: undefined
              })
            }
          }
        } else {
          // 🔥 critical fix：Inject basic configuration into a single data source
          const enhancedConfig = this.injectBaseConfigToDataSource(resolvedConfig, baseConfig)
          dataSources.push({
            id: 'dataSource1',
            type: enhancedConfig.type as any,
            config: enhancedConfig.config || enhancedConfig,
            filterPath: enhancedConfig.filterPath,
            processScript: enhancedConfig.processScript
          })
        }
      }
    }

    // 🔥 Final result debug log

    return {
      componentId,
      componentType,
      dataSources,
      enabled: true
    }
  }

  /**
   * 🔥 Key new additions：Inject basic configuration properties into the data source configuration
   * make sure deviceId and metricsList Wait for the basic configuration to be used correctly by the data source
   * @param dataSourceConfig Data source configuration
   * @param baseConfig Basic configuration
   */
  private injectBaseConfigToDataSource(dataSourceConfig: any, baseConfig: any): any {
    if (!baseConfig) {
      return dataSourceConfig
    }


    // Create enhanced configuration objects
    const enhanced = JSON.parse(JSON.stringify(dataSourceConfig)) // deep copy

    // 🚀 key extension：Not only inject basic configuration，Also handle all binding expression substitutions
    this.processBindingReplacements(enhanced, baseConfig)


    return enhanced
  }

  /**
   * 🚀 New：Handles all binding expression substitutions
   * Includes basic configuration injection and component property binding replacement
   * ⚠️ critical warning：This method modifies the configuration object passed in，Make sure you pass in a cloned object！
   */
  private processBindingReplacements(config: any, baseConfig: any): void {

    // 🚀 New：Check if enabledautoBind
    const autoBindConfig = this.getAutoBindConfigFromDataSource(config)

    if (autoBindConfig && autoBindConfig.enabled) {
      // useautoBindConfiguration processing parameter binding（sync version）
      this.processAutoBindParamsSync(config, baseConfig, autoBindConfig)
    } else {
      // Handling parameter bindings the traditional way
      this.processTraditionalBinding(config, baseConfig)
    }
  }

  /**
   * 🚀 New：useautoBindConfiguration processing parameter binding（sync version）
   */
  private processAutoBindParamsSync(config: any, baseConfig: any, autoBindConfig: AutoBindConfig): void {
    // Use the importeddataSourceBindingConfig

    // Build a complete configuration object
    const fullConfig = {
      base: baseConfig,
      dataSource: config,
      componentType: config.componentType || 'widget'
    }

    // useautoBindgenerateHTTPparameter
    const autoBindParams = dataSourceBindingConfig.buildAutoBindParams(
      fullConfig,
      autoBindConfig,
      config.componentType
    )

    // WillautoBindParameters are injected intoHTTPConfiguring
    if (config.type === 'http' && config.config) {
      config.config.params = {
        ...config.config.params,
        ...autoBindParams
      }
    } else if (config.config) {
      config.config = {
        ...config.config,
        ...autoBindParams
      }
    }

    console.log(`🚀 [VisualEditorBridge] AutoBindParameter injection completed:`, {
      mode: autoBindConfig.mode,
      autoBindParams,
      finalConfig: config.config
    })
  }

  /**
   * Traditional way to handle parameter binding
   */
  private processTraditionalBinding(config: any, baseConfig: any): void {
    // 1. First handle the basic configuration injection（original logic，Analog deviceIDhard-coded mechanism）
    if (config.config && typeof config.config === 'object') {
      config.config = {
        ...config.config,
        // Inject device properties in base configuration（Analog deviceIDhardcoded logic）
        ...(baseConfig.deviceId && { deviceId: baseConfig.deviceId }),
        ...(baseConfig.metricsList && { metricsList: baseConfig.metricsList })
      }
    } else {
      // if not config object，Inject directly at the top level
      config.deviceId = config.deviceId || baseConfig.deviceId
      config.metricsList = config.metricsList || baseConfig.metricsList
    }

    // 2. 🔥 Key new additions：Then handle all binding expression substitutions（This is the core logic of component property binding）
    this.recursivelyReplaceBindings(config)
  }

  /**
   * 🚀 New：Extract from data source configurationautoBindset up
   * @param dataSourceConfig Data source configuration
   * @returns autoBindconfigure ornull
   */
  private getAutoBindConfigFromDataSource(dataSourceConfig: any): import('./DataSourceBindingConfig').AutoBindConfig | null {
    // Check the data source configuration forautoBindset up
    if (dataSourceConfig.autoBind) {
      return dataSourceConfig.autoBind
    }

    // examineconfighierarchicalautoBindset up
    if (dataSourceConfig.config?.autoBind) {
      return dataSourceConfig.config.autoBind
    }

    return null
  }

  /**
   * 🚀 New：Recursively replace all binding expressions
   * from useCard2Props Get all property values ​​of the current component，and replace the binding expression with
   * 🔥 critical fix：Accurately detect and replace component property binding expressions，Supports multiple binding formats
   */
  private recursivelyReplaceBindings(obj: any, path: string = 'root'): void {
    if (!obj || typeof obj !== 'object') {
      return
    }


    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key]
        const currentPath = `${path}.${key}`

        if (typeof val === 'string') {

          // 🔥 critical fix：Check multiple binding expression formats
          // Format1: componentId.component.propertyName （Standard component property binding）
          const componentBindingMatch = val.match(/^([^.]+)\.component\.(.+)$/)

          // Format2: componentId.base.propertyName （Basic configuration binding）
          const baseBindingMatch = val.match(/^([^.]+)\.base\.(.+)$/)

          // Format3: componentId.whitelist.propertyName （旧Format兼容，Deprecated but needs compatibility）
          const whitelistBindingMatch = val.match(/^([^.]+)\.whitelist\.(.+)$/)

          if (componentBindingMatch) {
            const [, componentId, propertyName] = componentBindingMatch

            // 🚀 critical fix：Get the current property value of the component，Use correct fetch logic
            const actualValue = this.getComponentPropertyValueFixed(componentId, propertyName)
            if (actualValue !== undefined) {
              obj[key] = String(actualValue)
            } else {
            }
          } else if (baseBindingMatch) {
            const [, componentId, propertyName] = baseBindingMatch

            // Try to get basic configuration values（Use existing acquisition logic）
            const actualValue = this.getBaseConfigPropertyValue(componentId, propertyName)
            if (actualValue !== undefined) {
              obj[key] = String(actualValue)
            } else {
            }
          } else if (whitelistBindingMatch) {
            // 🔥 Compatibility processing：will oldwhitelistThe format is converted tocomponentformat reprocessing
            const [, componentId, propertyName] = whitelistBindingMatch

            // convert to standardcomponentformat reprocessing
            const actualValue = this.getComponentPropertyValueFixed(componentId, propertyName)
            if (actualValue !== undefined) {
              obj[key] = String(actualValue)
            } else {
            }
          } else {
            // Not a binding expression，No processing required
            if (val.includes('.')) {
            }
          }
        } else if (typeof val === 'object' && val !== null) {
          // Process nested objects recursively
          this.recursivelyReplaceBindings(val, currentPath)
        }
      }
    }
  }

  /**
   * 🔥 New：Get basic configuration property values（used forbaselayer binding）
   */
  private getBaseConfigPropertyValue(componentId: string, propertyName: string): any {
    try {
      // Simplified processing：Return directlyundefined，Avoid circular dependencies
      // TODO: Reimplement this feature if needed
      return undefined

      if (config?.base?.[propertyName] !== undefined) {
        const value = config.base[propertyName]
        return value
      }

      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] Failed to obtain basic configuration property values:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 🚀 Repair version：Get the current property value of the component
   * Specially handles actual attribute value acquisition，priority：latest configuration > Editor node > DOM
   */
  private getComponentPropertyValueFixed(componentId: string, propertyName: string): any {
    try {
      // Simplified processing：Return directlyundefined，Avoid circular dependencies
      // TODO: Reimplement this feature if needed
      return undefined


      // 1. Prioritize fromcomponentThe layer directly obtains the properties
      if (fullConfig?.component?.[propertyName] !== undefined) {
        const value = fullConfig.component[propertyName]
        return value
      }

      // 2. examinecustomizelayer（Compatible with certain component structures）
      if (fullConfig?.component?.customize?.[propertyName] !== undefined) {
        const value = fullConfig.component.customize[propertyName]
        return value
      }

      // 3. Get from editor node（backup plan）
      const editorStore = useEditorStore()
      const node = editorStore.nodes?.find((n: any) => n.id === componentId)

      if (node?.properties?.[propertyName] !== undefined) {
        const value = node.properties[propertyName]
        return value
      }

      // 4. Check the unified configuration of the editor node
      if (node?.metadata?.unifiedConfig?.component?.[propertyName] !== undefined) {
        const value = node.metadata.unifiedConfig.component[propertyName]
        return value
      }

      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] getComponentPropertyValueFixedfail:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 🚀 original version：Get the current property value of the component（Keep compatible）
   * Get the actual value of a component property from the configuration manager or other data source
   * 🔥 critical fix：Make sure you get the latest attribute values，priority：configuration manager > Editor node > DOMexposed properties
   */
  private getComponentPropertyValue(componentId: string, propertyName: string): any {
    try {
      // Simplified processing：Return directlyundefined，Avoid circular dependencies
      // TODO: Reimplement this feature if needed
      return undefined


      // 🔥 critical fix：Prioritize fromcomponentlayer获取，then checkcustomizelayer（Compatible with different component structures）
      let value = undefined
      if (config?.component?.[propertyName] !== undefined) {
        value = config.component[propertyName]
        return value
      }

      // Compatibility check：Some components may store properties incustomizelayer
      if (config?.component?.customize?.[propertyName] !== undefined) {
        value = config.component.customize[propertyName]
        return value
      }

      // 🚀 Key new additions：Check the root levelcomponentConfiguration（Card2.1new format）
      if (config?.component !== undefined) {
        // TraversecomponentAll properties of the layer，Find matching attribute names
        const componentConfig = config.component
        for (const [key, val] of Object.entries(componentConfig)) {
          if (key === propertyName && val !== undefined) {
            return val
          }
        }
      }

      // method2: Get from editor node（second priority）
      const editorStore = useEditorStore()
      const node = editorStore.nodes?.find((n: any) => n.id === componentId)


      if (node?.properties?.[propertyName] !== undefined) {
        value = node.properties[propertyName]
        return value
      }

      // Check the editor node'scomponentLayer properties
      if (node?.properties?.component?.[propertyName] !== undefined) {
        value = node.properties.component[propertyName]
        return value
      }

      // 🚀 Key new additions：Check unified configuration format（metadata.unifiedConfig）
      if (node?.metadata?.unifiedConfig?.component?.[propertyName] !== undefined) {
        value = node.metadata.unifiedConfig.component[propertyName]
        return value
      }

      // method3: fromDOMelement acquisition（final choice）
      if (typeof window !== 'undefined') {
        const element = document.querySelector(`[data-component-id="${componentId}"]`)
        if (element) {
          const exposedProps = (element as any).__exposedProperties
          if (exposedProps?.[propertyName] !== undefined) {
            value = exposedProps[propertyName]
            return value
          }
        }
      }

      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] Failed to get component property value:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * Transform data item configuration，Handle field mapping
   */
  private convertItemConfig(item: any): any {
    const { type, config } = item

    switch (type) {
      case 'json':
        // JSONtype：jsonString → jsonContent
        return {
          ...config,
          jsonContent: config.jsonString || config.jsonContent
        }

      case 'http':
        // HTTPtype：Keep original fields
        return config

      case 'script':
        // Scripttype：script → scriptContent
        return {
          ...config,
          scriptContent: config.script || config.scriptContent
        }

      default:
        return config
    }
  }
}

// Port isolatedVisualEditorBridgeInstance management
const bridgeInstances = new Map<string, VisualEditorBridge>()

/**
 * Get portID（Instance isolation for multi-port development environments）
 */
function getPortId(): string {
  if (typeof window !== 'undefined') {
    return window.location.port || 'default'
  }
  return 'default'
}

/**
 * Get the current portVisualEditorBridgeExample
 * Ensure separate bridge instances are used for different ports，Avoid data callback interference
 */
export function getVisualEditorBridge(): VisualEditorBridge {
  const portId = getPortId()

  if (!bridgeInstances.has(portId)) {
    bridgeInstances.set(portId, new VisualEditorBridge())
  }

  return bridgeInstances.get(portId)!
}

/**
 * Visual Editor Bridge singleton instance
 * used to replace the original componentExecutorManager
 * @deprecated use getVisualEditorBridge() substitute，to support port isolation
 */
export const visualEditorBridge = getVisualEditorBridge()
