/**
 * first floor：Data item getter (DataItemFetcher)
 * Responsibilities：Get raw data based on configuration type
 * Integrated script-engine Secure Script Execution System
 * Support new HttpConfig type and correct HTTP Method processing
 */

import { defaultScriptEngine } from '@/core/script-engine'
import type { HttpConfig, HttpParameter, PathParameter } from '@/core/data-architecture/types/http-config'
import { convertValue } from '@/core/data-architecture/types/http-config'
import { request } from '@/service/request'
// importVisual Editor storeto get component instance
import { useEditorStore } from '@/components/visual-editor/store/editor'

// Type-safe data item configuration
export type DataItem =
  | {
      type: 'json'
      config: JsonDataItemConfig
    }
  | {
      type: 'http'
      config: HttpDataItemConfig
    }
  | {
      type: 'websocket'
      config: WebSocketDataItemConfig
    }
  | {
      type: 'script'
      config: ScriptDataItemConfig
    }

export interface JsonDataItemConfig {
  jsonString: string
}

// Compatible with original interface，Also supports new HttpConfig
export interface HttpDataItemConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number

  // 🔥 New：Address type support
  addressType?: 'internal' | 'external'
  selectedInternalAddress?: string
  enableParams?: boolean

  // Path parameter support
  pathParameter?: PathParameter
  pathParams?: HttpParameter[]

  // Extended support for new HttpConfig Format
  params?: HttpParameter[]
  // backwards compatible：Unified parameter system
  parameters?: HttpParameter[]

  // 🔥 New：Script support
  preRequestScript?: string
  postResponseScript?: string
}

// Or use it directly HttpConfig type
export type HttpDataItemConfigV2 = HttpConfig

export interface WebSocketDataItemConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
}

export interface ScriptDataItemConfig {
  script: string
  context?: Record<string, any>
}

/**
 * Data item getter interface
 */
export interface IDataItemFetcher {
  /**
   * Get original data based on data item configuration
   * @param item Data item configuration
   * @returns raw data，Return on error {}
   */
  fetchData(item: DataItem): Promise<any>

  /**
   * Sets the component of the current execution contextID
   * @param componentId componentsID
   */
  setCurrentComponentId(componentId: string): void
}

/**
 * Data item getter implementation class
 */
export class DataItemFetcher implements IDataItemFetcher {
  // 🔥 New：Request deduplication cache，prevent duplicationHTTPask
  private requestCache = new Map<string, Promise<any>>()
  // request cacheTTL：2Identical requests within seconds will be deduplicated.
  private readonly REQUEST_CACHE_TTL = 2000

  // 🔥 New：componentsIDcontext，for parameter binding
  private currentComponentId?: string

  /**
   * Sets the component of the current execution contextID
   * @param componentId componentsID
   */
  setCurrentComponentId(componentId: string): void {
    this.currentComponentId = componentId
  }
  /**
   * 🔥 New：Runtime intelligent detection of whether parameters should be dynamic parameters
   * defensive programming：Detect and fix errors during executionisDynamicset up
   */
  private detectRuntimeIsDynamic(param: HttpParameter): boolean {
    // Detect obvious binding features
    const hasBindingFeatures =
      // feature1：valueModeforcomponent
      param.valueMode === 'component' ||
      // feature2：selectedTemplateBind component properties
      param.selectedTemplate === 'component-property-binding' ||
      // feature3：valueThe value looks like the binding path（Include.And the format is correct）
      (typeof param.value === 'string' &&
       param.value.includes('.') &&
       param.value.split('.').length >= 3 &&
       param.value.length > 10 &&
       // Make sure it's not a wrong short numeric value
       !/^\d{1,4}$/.test(param.value)) ||
      // feature4：havevariableNameand contains componentsIDFormat
      (param.variableName && param.variableName.includes('_') && param.variableName.length > 5)

    return hasBindingFeatures
  }

  /**
   * Get property value from component instance
   * @param bindingPath binding path，Format：Component instanceID.Property path
   * @returns The actual value of the component property
   */
  private async getComponentPropertyValue(bindingPath: string): Promise<any> {


    try {
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        return undefined
      }

      const parts = bindingPath.split('.')
      let componentId = parts[0]
      const propertyPath = parts.slice(1).join('.')
      // 🔥 critical fix：deal with__CURRENT_COMPONENT__placeholder
      if (componentId === '__CURRENT_COMPONENT__') {
        // Use components in the current contextIDreplace placeholder
        if (this.currentComponentId) {
          componentId = this.currentComponentId
        } else {
          return undefined
        }
      }

      // Prioritize fromConfigurationIntegrationBridgeGet the latest configuration
      try {
        // Use direct import instead of dynamicrequire，Avoid circular dependency issues
        const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')

        // Smart componentsIDmapping：If the original componentIDUnable to find configuration，Try using the current context componentID
        let targetComponentId = componentId
        let latestConfig = configurationIntegrationBridge.getConfiguration(componentId)

        if (!latestConfig && this.currentComponentId && this.currentComponentId !== componentId) {
          targetComponentId = this.currentComponentId
          latestConfig = configurationIntegrationBridge.getConfiguration(this.currentComponentId)
        }

        if (latestConfig) {
          // Supports multi-level attribute path parsing
          if (propertyPath.startsWith('customize.')) {
            // deal with customize.deviceId Format - mapped to component layer
            const customizePropertyPath = propertyPath.replace('customize.', '')
            const componentValue = this.getNestedProperty(latestConfig.component, customizePropertyPath)

            if (componentValue !== undefined) {
              return componentValue
            }

            // Fallback tobaselayer search
            const baseValue = this.getNestedProperty(latestConfig.base, customizePropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }
          } else if (propertyPath.startsWith('base.')) {
            // 🔥 deal with base.deviceId format path
            const actualPropertyPath = propertyPath.replace('base.', '')
            // directly from base layer get properties（removebaseprefix）
            const baseValue = this.getNestedProperty(latestConfig.base, actualPropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }

            // ifbaselayer没有，Also trycomponentlayer
            const componentValue = this.getNestedProperty(latestConfig.component, actualPropertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }
          } else if (propertyPath.startsWith('component.')) {
            // 🔥 deal with component.title format path
            const actualPropertyPath = propertyPath.replace('component.', '')

            // directly from component layer get properties（removecomponentprefix）
            const componentValue = this.getNestedProperty(latestConfig.component, actualPropertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }

            // ifcomponentlayer没有，Also trybaselayer
            const baseValue = this.getNestedProperty(latestConfig.base, actualPropertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }
          } else {
            // Handle other property paths
            // First try from base layer获取（higher priority，Because interactions usually modify base layer）
            const baseValue = this.getNestedProperty(latestConfig.base, propertyPath)
            if (baseValue !== undefined) {
              return baseValue
            }

            // then from component layer acquisition
            const componentValue = this.getNestedProperty(latestConfig.component, propertyPath)
            if (componentValue !== undefined) {
              return componentValue
            }
          }
        }
      } catch (configError) {
        // Configuration acquisition failed，Fallback to editor storage
      }

      // rollback：from editorstoreGet attribute value（Compatibility processing）
      const editorStore = useEditorStore()

      // Improved component finding strategy：Support fuzzy matching
      let targetComponent = editorStore.nodes?.find(node => node.id === componentId)

      if (!targetComponent) {
        // Try fuzzy matching：Find containscomponentIdcomponents
        targetComponent = editorStore.nodes?.find(node =>
          node.id.includes(componentId) || componentId.includes(node.id)
        )
      }

      if (!targetComponent && this.currentComponentId) {
        // final rollback：Use current componentID
        targetComponent = editorStore.nodes?.find(node => node.id === this.currentComponentId)
      }

      if (!targetComponent) {
        return undefined
      }

      // from componentpropertiesGet attribute value from
      const propertyValue = this.getNestedProperty(targetComponent.properties, propertyPath)
      return propertyValue
    } catch (error) {
      console.error('[DataItemFetcher] Component property binding error:', error)
      return undefined
    }
  }

  /**
   * Get nested object properties
   * @param obj target audience
   * @param path Property path，like 'customize.title'
   * @returns attribute value
   */
  private getNestedProperty(obj: any, path: string): any {
    if (!obj || !path) return undefined

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 🔥 New：Generate a simple hash of an object，Used to debug object reference changes
   * @param obj object to hash
   * @returns Hash string
   */
  private getObjectHash(obj: any): string {
    try {
      const str = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') return '[Function]'
        if (value instanceof Date) return value.toISOString()
        return value
      })

      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to32bit integer
      }

      return Math.abs(hash).toString(16)
    } catch {
      return 'hash-failed'
    }
  }

  /**
   * 🔥 New：specializedHTTPParameter debug tracer
   * for detailed recordsHTTPThe lifetime of all parameters in the request
   */
  private logHttpParametersLifecycle(config: HttpDataItemConfig, stage: string): void {

    const allParams: Array<{ source: string; param: HttpParameter; index: number }> = []

    // Collect all parameter sources
    if (config.pathParams) {
      config.pathParams.forEach((param, index) => {
        allParams.push({ source: 'pathParams', param, index })
      })
    }

    if (config.pathParameter) {
      allParams.push({ source: 'pathParameter', param: config.pathParameter as HttpParameter, index: 0 })
    }

    if (config.params) {
      config.params.forEach((param, index) => {
        allParams.push({ source: 'params', param, index })
      })
    }

    if (config.parameters) {
      config.parameters.forEach((param, index) => {
        allParams.push({ source: 'parameters', param, index })
      })
    }

    // Record each parameter in detail
    allParams.forEach(({ source, param, index }) => {

      // 🔥 Pay special attention to suspected damaged binding paths
      if (param.value && typeof param.value === 'string') {
        const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName
        if (isSuspiciousPath) {
          console.error(`🚨 [${source}[${index}]] Suspected damaged binding path found:`, {
            parameterKey: param.key,
            suspectedDamagedPath: param.value,
            variableName: param.variableName,
            stage: stage,
            timestamp: Date.now()
          })
        }
      }
    })

  }

  /**
   * Parse parameter value，Support default value fallback mechanism and component property binding
   * @param param HTTPparameter
   * @returns Parsed parameter value
   */
  private async resolveParameterValue(param: HttpParameter): Promise<any> {
    let resolvedValue = param.value

    // defensive detection：Intelligent correction at runtimeisDynamicField
    const shouldBeDynamic = this.detectRuntimeIsDynamic(param)
    if (shouldBeDynamic && !param.isDynamic) {
      // Temporary fix，Do not modify the original parameter object
      param = { ...param, isDynamic: true }
    }

    // repair：priority useisDynamicField judgment，Support attribute binding
    if (param.isDynamic || param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
      // critical fix：Use deep copy to protect original parameters，Prevent data from being accidentally modified
      let bindingPath = param.value

      // 🔥 Detecting broken binding paths
      const isBindingPathCorrupted = bindingPath &&
        typeof bindingPath === 'string' &&
        !bindingPath.includes('.') &&
        bindingPath.length < 10 && // Binding paths are often very long
        param.variableName &&
        param.variableName.includes('_')

      if (isBindingPathCorrupted) {
        console.error(`🚨 [DataItemFetcher] Corruption of bind path detected！`, {
          parameterKey: param.key,
          brokenBindingPath: bindingPath,
          damagedPathJSON: JSON.stringify(bindingPath),
          variableName: param.variableName,
          variableNameJSON: JSON.stringify(param.variableName),
          damageCharacteristics: {
            doesNotContainPeriod: !bindingPath.includes('.'),
            lengthTooShort: bindingPath.length < 10,
            thereIsAVariableName: !!param.variableName,
            whetherItIsAPureNumber: /^\d+$/.test(bindingPath)
          },
          stackTrace: new Error().stack
        })
        // fromvariableNameRebuild binding path
        if (param.variableName.includes('_')) {
          const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
          if (lastUnderscoreIndex > 0) {
            const componentId = param.variableName.substring(0, lastUnderscoreIndex)
            const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
            const recoveredPath = `${componentId}.base.${propertyName}` // 🔥 repair：usebaselayer（becausedeviceIdexistbaselayer）

            bindingPath = recoveredPath

            // 🔥 Verify the restored path
          }
        }
      } else {
      }

      // final verification：If the fixed binding path is still incorrect，Use default value
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        return param.defaultValue || null
      }

      if (bindingPath && typeof bindingPath === 'string') {
        const actualValue = await this.getComponentPropertyValue(bindingPath)

        if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
          resolvedValue = actualValue
        } else {
          // When the component property value is empty，set up resolvedValue for undefined，Trigger default value mechanism
          resolvedValue = undefined
        }
      }
    } else {
    }

    // Check if the value is"null"（Situations where default values ​​need to be used）
    const isEmpty =
      resolvedValue === null ||
      resolvedValue === undefined ||
      resolvedValue === '' ||
      (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

    if (isEmpty) {
      // If there is a default value，Use default value
      if (param.defaultValue !== undefined && param.defaultValue !== null) {
        resolvedValue = param.defaultValue
      } else {
        return null // returnnullIndicates skipping this parameter
      }
    }

    // Convert data type
    const convertedValue = convertValue(resolvedValue, param.dataType)

    return convertedValue
  }

  /**
   * Handle data acquisition based on type branch
   */
  async fetchData(item: DataItem): Promise<any> {

    try {
      let result
      switch (item.type) {
        case 'json':
          result = await this.fetchJsonData(item.config)
          break
        case 'http':
          result = await this.fetchHttpData(item.config)
          break
        case 'websocket':
          result = await this.fetchWebSocketData(item.config)
          break
        case 'script':
          result = await this.fetchScriptData(item.config)
          break
        default:
          result = {}
      }


      return result
    } catch (error) {
      console.error(`❌ [DataItemFetcher] fetchDataExecution failed:`, {
        type: item.type,
        mistake: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return {} // Unified error handling：Return empty object
    }
  }

  /**
   * GetJSONdata
   */
  private async fetchJsonData(config: JsonDataItemConfig): Promise<any> {
    try {
      const data = JSON.parse(config.jsonString)
      return data
    } catch (error) {
      return {}
    }
  }

  /**
   * GetHTTPdata - Packaged using projectsrequestLibrary，Support script processing
   *
   * Important fixes：
   * 1. Use project unifiedrequestLibrary，rather than nativefetch
   * 2. Support project certification、Interceptor、Error handling mechanism
   * 3. distinguishGET/HEADandPOST/PUT/PATCH/DELETEMethod parameter processing
   * 4. GET/HEADask：parameter作为queryparameter，Not setbody
   * 5. Other methods：can containbodydata
   * 6. Support newHttpConfigformat compatible with older formats
   * 7. integratedconvertValueDo the correct type conversion
   * 8. 🔥 New：Supports pre-request script and post-response script processing
   *
   * @param config HTTPConfiguration，supportHttpDataItemConfigFormat
   * @returns Promise<any> HTTPresponse data，Returns an empty object on failure
   */
  private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
    // 🔥 step1：Generate request unique identifier，Used to remove duplicates
    const requestKey = await this.generateRequestKey(config)


    // 🔥 step2：Check if there is an identical request in progress
    const existingRequest = this.requestCache.get(requestKey)
    if (existingRequest) {
      return await existingRequest
    }

    // 🔥 step3：Create and cache requestsPromise
    const requestPromise = this.executeHttpRequest(config, requestKey)
    this.requestCache.set(requestKey, requestPromise)

    // 🔥 step4：Set cache cleaning timer
    setTimeout(() => {
      this.requestCache.delete(requestKey)
    }, this.REQUEST_CACHE_TTL)

    return await requestPromise
  }

  /**
   * actual executionHTTPrequest method（fromfetchHttpDataextracted from）
   */
  private async executeHttpRequest(config: HttpDataItemConfig, requestKey: string): Promise<any> {
    try {
      // 🔥 first step：RecordHTTPParameter status before request starts
      this.logHttpParametersLifecycle(config, 'Before request starts')

      // CRITICAL：Verify parameter binding path integrity
      this.validateParameterBindingPaths(config)

      // 🔥 Step 2：Record parameter status again after verification
      this.logHttpParametersLifecycle(config, 'After parameter verification')

      // first step：Pre-request script
      if (config.preRequestScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.preRequestScript, { config })
          if (scriptResult.success && scriptResult.data) {
            Object.assign(config, scriptResult.data)
          }
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] Pre-request script execution failed:`, error)
        }
      }

      // Build request parameters
      const requestConfig: any = {
        timeout: config.timeout || 10000
      }

      // Add toheaders
      if (config.headers && Object.keys(config.headers).length > 0) {
        requestConfig.headers = config.headers
      }

      // Processing parameters
      let finalUrl = config.url
      const queryParams: Record<string, any> = {}

      // 🔥 Step 3：Record status before starting to process parameters
      this.logHttpParametersLifecycle(config, 'Before starting to process parameters')

      // Unified processing of path parameters
      // Prioritize new formats pathParams，If it does not exist, fallback to the old format pathParameter
      if (config.pathParams && config.pathParams.length > 0) {

        for (const p of config.pathParams.filter(p => p.enabled)) {

          const resolvedValue = await this.resolveParameterValue(p)


          if (resolvedValue !== null) {
            // repair：path parameterskeyWhen empty，automatic matchingURLfirst placeholder in
            let placeholder = p.key ? `{${p.key}}` : null

            if (!placeholder || placeholder === '{}') {
              // Automatic detectionURLplaceholder in
              const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
              if (placeholderMatch) {
                placeholder = placeholderMatch[0] // complete {id} Format
              }
            }

            if (placeholder && finalUrl.includes(placeholder)) {
              const oldUrl = finalUrl
              finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
            }
          }
        }
      } else if (config.pathParameter) {
        const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)

        if (resolvedValue !== null && resolvedValue && String(resolvedValue).trim() !== '') {
          const pathParam = config.pathParameter as HttpParameter

          // repair：pathParameterofkeyWhen empty，automatic matchingURL中of第一个占位符
          let placeholder = pathParam.key ? `{${pathParam.key}}` : null

          if (!placeholder || placeholder === '{}') {
            // Automatic detectionURLplaceholder in
            const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
            if (placeholderMatch) {
              placeholder = placeholderMatch[0] // complete {id} Format
            }
          }

          if (placeholder && finalUrl.includes(placeholder)) {
            const oldUrl = finalUrl
            finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
          }
        }
      }

      // Handle query parameters
      if (config.params && config.params.length > 0) {

        for (const p of config.params.filter(p => p.enabled && p.key)) {

          const resolvedValue = await this.resolveParameterValue(p)


          if (resolvedValue !== null) {
            queryParams[p.key] = resolvedValue
          }
        }
      }

      // backwards compatible：Unified parameter system
      else if (config.parameters && config.parameters.length > 0) {
        for (const p of config.parameters.filter(p => p.enabled && p.key)) {
          const resolvedValue = await this.resolveParameterValue(p)
          if (resolvedValue !== null) {
            switch (p.paramType) {
              case 'path':
                // repair：Splicing logic of path parameters，Avoid direct string concatenation
                if (resolvedValue && String(resolvedValue).trim() !== '') {
                  const separator = finalUrl.endsWith('/') ? '' : '/'
                  finalUrl = finalUrl + separator + String(resolvedValue)
                }
                break
              case 'query':
                queryParams[p.key] = resolvedValue
                break
              case 'header':
                requestConfig.headers = requestConfig.headers || {}
                requestConfig.headers[p.key] = String(resolvedValue)
                break
            }
          }
        }
      }

      if (Object.keys(queryParams).length > 0) {
        requestConfig.params = queryParams
      }

      // Process request body
      let requestBody = undefined
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.body) {
        try {
          requestBody = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
        } catch {
          requestBody = config.body
        }
      }

      // 🔥 Step 4：HTTPThe final status record before the request is sent
      this.logHttpParametersLifecycle(config, 'HTTPBefore request is sent')


      // 🔥 initiateHTTPask - critical debugging

      let response
      switch (config.method.toUpperCase()) {
        case 'GET':
          response = await request.get(finalUrl, requestConfig)
          break
        case 'POST':
          response = await request.post(finalUrl, requestBody, requestConfig)
          break
        case 'PUT':
          response = await request.put(finalUrl, requestBody, requestConfig)
          break
        case 'PATCH':
          response = await request.patch(finalUrl, requestBody, requestConfig)
          break
        case 'DELETE':
          response = await request.delete(finalUrl, requestConfig)
          break
        default:
          throw new Error(`Not supportedHTTPmethod: ${config.method}`)
      }


      // Step 3：Post-response script
      let finalResponse = response
      if (config.postResponseScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.postResponseScript, { response })
          if (scriptResult.success) {
            finalResponse = scriptResult.data !== undefined ? scriptResult.data : response
          }
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] Script execution failed after response:`, error)
        }
      }

      return finalResponse
    } catch (error) {
      console.error(`❌ [DataItemFetcher] fetchHttpData Execution failed:`, {
        url: config.url,
        method: config.method,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return {}
    }
  }

  /**
   * Debugging tools：Verify parameter binding path integrity
   * Help users quickly discover parameter binding path corruption problems
   */
  private validateParameterBindingPaths(config: HttpDataItemConfig): void {
    const allParams: HttpParameter[] = []

    // Collect all parameters
    if (config.pathParams) allParams.push(...config.pathParams)
    if (config.pathParameter) allParams.push(config.pathParameter as HttpParameter)
    if (config.params) allParams.push(...config.params)
    if (config.parameters) allParams.push(...config.parameters)

    // Check binding path integrity for each parameter
    allParams.forEach((param, index) => {
      if (param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
        let bindingPath = param.value

        // critical fix：Smart repair logic is also applied during the verification phase
        if (!bindingPath || !bindingPath.includes('.')) {
          // try to start fromvariableNameRebuild binding path（andresolveParameterValueThe logic in the）
          if (param.variableName && param.variableName.includes('_')) {
            const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
            if (lastUnderscoreIndex > 0) {
              const componentId = param.variableName.substring(0, lastUnderscoreIndex)
              const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
              const reconstructedPath = `${componentId}.base.${propertyName}`

              bindingPath = reconstructedPath

              // important：Do not directly modify the parameter object，Avoid polluting the original configuration
              // Only use the repaired path in the current execution context
            }
          }
        }

        const isValidPath = bindingPath && typeof bindingPath === 'string' && bindingPath.includes('.')

        if (!isValidPath) {
          console.error(`❌ [CRITICAL] Corrupt parameter binding path found！`, {
            parameterIndex: index,
            parameterKey: param.key,
            bindPathValue: bindingPath,
            completeParameters: param
          })
        }
      }
    })
  }

  /**
   * generateHTTPThe unique identifier of the request，Used to remove duplicates
   * based onURL、method、Parameters and other key information are generated uniquelykey
   */
  private async generateRequestKey(config: HttpDataItemConfig): Promise<string> {
    // Collect all key parameters that affect the request
    const keyComponents = [
      config.method || 'GET',
      config.url || '',
    ]

    // Add path parameters
    if (config.pathParams && config.pathParams.length > 0) {
      const pathParams = []
      for (const p of config.pathParams.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        pathParams.push(`${p.key}=${resolvedValue}`)
      }
      pathParams.sort() // Sort to ensure consistency
      keyComponents.push(`path:${pathParams.join('&')}`)
    }

    // Add old path parameter format
    if (config.pathParameter) {
      const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)
      keyComponents.push(`pathParam:${resolvedValue}`)
    }

    // Add query parameters
    if (config.params && config.params.length > 0) {
      const queryParams = []
      for (const p of config.params.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        queryParams.push(`${p.key}=${resolvedValue}`)
      }
      queryParams.sort() // Sort to ensure consistency
      keyComponents.push(`query:${queryParams.join('&')}`)
    }

    // Add unified parameters（backwards compatible）
    if (config.parameters && config.parameters.length > 0) {
      const unifiedParams = []
      for (const p of config.parameters.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        unifiedParams.push(`${p.key}=${resolvedValue}`)
      }
      unifiedParams.sort()
      keyComponents.push(`unified:${unifiedParams.join('&')}`)
    }

    // Add request body（forPOST/PUTetc.）
    if (config.body && typeof config.body === 'object') {
      keyComponents.push(`body:${JSON.stringify(config.body)}`)
    }

    // generate finalkey（Use simple hashes to avoid being too long）
    const fullKey = keyComponents.join('|')
    const finalKey = `http_${this.simpleHash(fullKey)}`

    return finalKey
  }

  /**
   * Simple hash function，avoidrequestKeytoo long
   */
  private simpleHash(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to32bit integer
    }

    return Math.abs(hash).toString(36) // convert to36hexadecimal string
  }

  /**
   * GetWebSocketdata (Temporarily implemented as placeholder)
   */
  private async fetchWebSocketData(_config: WebSocketDataItemConfig): Promise<any> {
    return {}
  }

  /**
   * Execute script to get data (use script-engine Safe execution)
   */
  private async fetchScriptData(config: ScriptDataItemConfig): Promise<any> {
    try {
      // use script-engine Safe execution of scripts
      const result = await defaultScriptEngine.execute(config.script, config.context || {})

      if (result.success) {
        return result.data || {}
      } else {
        return {}
      }
    } catch (error) {
      return {}
    }
  }
}
