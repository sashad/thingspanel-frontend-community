<!--
  Original data configuration pop-up window
  Used to configure raw data items
-->
<script setup lang="ts">
/**
 * RawDataConfigModal - Original data configuration pop-up window
 * accomplishJSON/HTTP/Script data entry and preview
 */

import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { DataItemFetcher, type DataItem } from '@/core/data-architecture/executors'
import HttpConfigForm from '@/core/data-architecture/components/modals/HttpConfigForm.vue'
// 🔥 Simple script editor
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// Import sample data icon
import { DocumentTextOutline } from '@vicons/ionicons5'

// Propsinterface
interface Props {
  /** data sourceKey */
  dataSourceKey?: string
  /** Edit data */
  editData?: any
  /** Is it in edit mode? */
  isEditMode?: boolean
  /** Sample data */
  exampleData?: any
  /** 🔥 New：current componentID，for property binding */
  componentId?: string
}

// Emitsinterface
interface Emits {
  (e: 'confirm', data: DataItem): void
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'method-change', method: 'json' | 'http' | 'script'): void // New：Notify the parent component when the input method changes
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

/**
 * Entry options
 */
const inputMethods = [
  { label: 'JSONdata', value: 'json', available: true },
  { label: 'HTTPinterface', value: 'http', available: true },
  { label: 'JavaScriptscript', value: 'script', available: true }
]

/**
 * form status
 */
const formState = reactive({
  selectedMethod: 'http' as 'json' | 'http' | 'script' | 'websocket', // 🔥 Change the default value from json Change to http
  jsonData: '', // Initially empty，Depend onwatchormountedset up
  httpUrl: 'https://api.example.com/data',
  httpMethod: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  httpHeaders: '{\n  "Authorization": "Bearer your-token",\n  "Content-Type": "application/json"\n}',
  httpBody: '{}',
  scriptCode:
    'return {\n  timestamp: new Date().toISOString(),\n  randomValue: Math.random(),\n  message: "Hello from script"\n}'
})

/**
 * HTTPconfiguration status - new versionHttpConfigFormintegrated
 */
const httpConfig = ref({
  url: 'https://api.example.com/data',
  method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  timeout: 10000,
  headers: [] as Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic: boolean
    dataType: string
    variableName: string
    description: string
  }>,
  params: [] as Array<{
    key: string
    value: string
    enabled: boolean
    isDynamic: boolean
    dataType: string
    variableName: string
    description: string
  }>,
  body: '{}',
  preRequestScript: '',
  postResponseScript: ''
})

/**
 * HTTPConfiguration update handling - Add full debugging
 */
const onHttpConfigUpdate = (newConfig: typeof httpConfig.value) => {
  // 🔥 critical fix：Ensure responsive updates
  httpConfig.value = { ...newConfig }

  // Synchronously update to the old versionformState（Compatible with existing code）
  formState.httpUrl = newConfig.url || ''
  formState.httpMethod = newConfig.method || 'GET'
  formState.httpHeaders = JSON.stringify(
    newConfig.headers?.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}) || {}
  )
  formState.httpBody = newConfig.body || '{}'
}

/**
 * Preview data status
 */
const previewData = ref<any>(null)
const previewLoading = ref(false)

/**
 * Handle configuration status
 */
const processingState = reactive({
  jsonPath: '',
  defaultValue: '',
  scriptCode: ''
})

/**
 * script template
 */
const scriptTemplates = [
  {
    name: 'Extract fields',
    code: 'return {\n  value: data.temperature || data.value,\n  unit: "°C",\n  timestamp: new Date().toISOString()\n}'
  },
  {
    name: 'Array conversion',
    code: 'if (Array.isArray(data)) {\n  return data.map(item => ({\n    id: item.id,\n    value: item.value,\n    isOnline: item.status === "online"\n  }))\n}\nreturn data'
  },
  {
    name: 'Statistics',
    code: 'if (Array.isArray(data)) {\n  return {\n    total: data.length,\n    online: data.filter(item => item.status === "online").length,\n    avgValue: data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length\n  }\n}\nreturn { error: "Array data required" }'
  },
  {
    name: 'Conditional filtering',
    code: 'if (Array.isArray(data)) {\n  return data.filter(item => item.status === "online")\n}\nreturn data'
  }
]

/**
 * Handle preview status
 */
const processingPreviewData = ref<any>(null)
const processingPreviewLoading = ref(false)

/**
 * Data getter instance
 */
const fetcher = new DataItemFetcher()

/**
 * Helper function：Will HttpParameter[] Convert to Record<string, string>
 *
 * use：Compatible with older headers Format requirements，will newHttpParameterarray format
 * Convert to oldRecordobject format，Ensure data flow compatibility
 *
 * @param params HttpParameterarray，Includekey、value、enabledproperties
 * @returns Record<string, string> Converted key-value pair object，Returns if there are no enabled parametersundefined
 */
const convertHttpParametersToRecord = (
  params: Array<{
    key: string
    value: string | number | boolean
    enabled: boolean
    dataType: string
  }>
): Record<string, string> | undefined => {
  if (!params || !Array.isArray(params)) return undefined

  const enabledParams = params.filter(p => p.enabled)
  if (enabledParams.length === 0) return undefined

  return enabledParams.reduce(
    (acc, param) => {
      acc[param.key] = String(param.value)
      return acc
    },
    {} as Record<string, string>
  )
}

/**
 * processing closed
 */
const handleClose = () => {
  // Reset form state
  resetFormState()

  // Send cancellation and close events
  emit('cancel')
  emit('close')
}

/**
 * Get the current data item configuration
 */
const getCurrentDataItem = (): DataItem => {
  switch (formState.selectedMethod) {
    case 'json':
      return {
        type: 'json',
        config: { jsonString: formState.jsonData }
      }
    case 'http':
      // repair：use new HttpConfig Format，compatible HttpConfigForm，Contains script fields
      return {
        type: 'http',
        config: {
          url: httpConfig.value.url,
          method: httpConfig.value.method,
          timeout: httpConfig.value.timeout,
          headers: convertHttpParametersToRecord(httpConfig.value.headers),
          body: httpConfig.value.body ? JSON.parse(httpConfig.value.body) : undefined,
          // Expand：Support new params array format
          params: httpConfig.value.params,
          // 🔥 critical fix：Contains path parameter fields
          pathParameter: httpConfig.value.pathParameter,
          // 🔥 critical fix：Contains script fields
          preRequestScript: httpConfig.value.preRequestScript,
          postResponseScript: httpConfig.value.postResponseScript
        }
      }
    case 'script':
      return {
        type: 'script',
        config: { script: formState.scriptCode }
      }
    default:
      throw new Error(`Unsupported entry method: ${formState.selectedMethod}`)
  }
}

/**
 * Perform data preview
 */
const executePreview = async () => {
  if (previewLoading.value) return

  previewLoading.value = true
  try {
    const dataItem = getCurrentDataItem()
    const result = await fetcher.fetchData(dataItem)
    previewData.value = result

    message.success('Data preview successful')
  } catch (error) {
    message.error('Data preview failed: ' + error.message)
    previewData.value = null
  } finally {
    previewLoading.value = false
  }
}

/**
 * Handling confirmation button
 */
const handleConfirm = async () => {
  try {
    const dataItem = getCurrentDataItem()

    // Build full configuration，Includes processing configuration
    const fullConfig = {
      type: formState.selectedMethod,
      ...dataItem.config,
      // Original data configuration
      jsonData: formState.selectedMethod === 'json' ? formState.jsonData : undefined,
      scriptCode: formState.selectedMethod === 'script' ? formState.scriptCode : undefined,
      url: formState.selectedMethod === 'http' ? formState.httpUrl : undefined,
      method: formState.selectedMethod === 'http' ? formState.httpMethod : undefined,
      headers: formState.selectedMethod === 'http' ? formState.httpHeaders : undefined,
      body: formState.selectedMethod === 'http' ? formState.httpBody : undefined,
      // 🔥 critical fix：save new httpConfig complete state，Contains all address type and parameter information
      httpConfigData:
        formState.selectedMethod === 'http'
          ? {
              ...httpConfig.value,
              // Make sure to save key information about the address type
              addressType: httpConfig.value.addressType,
              selectedInternalAddress: httpConfig.value.selectedInternalAddress,
              enableParams: httpConfig.value.enableParams,
              pathParams: httpConfig.value.pathParams,
              pathParameter: httpConfig.value.pathParameter
            }
          : undefined,
      // Handle configuration
      processingConfig: {
        jsonPath: processingState.jsonPath.trim() || undefined,
        defaultValue: processingState.defaultValue.trim() || undefined,
        scriptCode: processingState.scriptCode.trim() || undefined
      }
    }

    emit('confirm', fullConfig)
    message.success('Original data configuration saved')
  } catch (error) {
    message.error('Configuration save failed: ' + error.message)
  }
}

/**
 * simpleJSONPathaccomplish
 */
const executeJsonPath = (data: any, path: string, defaultValue: any = null): any => {
  try {
    if (!path || !path.startsWith('$.')) {
      return data
    }

    const keys = path
      .slice(2)
      .split('.')
      .filter(key => key)
    let result = data

    for (const key of keys) {
      // Handle array index key[0]
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0]
        const indexMatch = key.match(/\[(\d+)\]/)
        if (indexMatch) {
          const index = parseInt(indexMatch[1])
          result = result?.[arrayKey]?.[index]
        }
      } else {
        result = result?.[key]
      }

      if (result === undefined || result === null) {
        return defaultValue
      }
    }

    return result
  } catch (error) {
    return defaultValue
  }
}

/**
 * Perform data processing
 */
const executeDataProcessing = (inputData: any): any => {
  if (!inputData) return null

  let processedData = inputData

  try {
    // first step: JSONPathfilter
    if (processingState.jsonPath.trim()) {
      processedData = executeJsonPath(
        processedData,
        processingState.jsonPath.trim(),
        processingState.defaultValue || null
      )
    }

    // Step 2: Script processing
    if (processingState.scriptCode.trim()) {
      const func = new Function('data', processingState.scriptCode)
      processedData = func(processedData)
    }

    return processedData
  } catch (error) {
    return {
      _error: 'Processing failed: ' + error.message,
      _originalData: inputData
    }
  }
}

/**
 * Process data in real time
 */
const updateProcessedData = () => {
  if (!previewData.value) {
    processingPreviewData.value = null
    return
  }

  const result = executeDataProcessing(previewData.value)
  processingPreviewData.value = result
}

/**
 * Execution processing preview
 */
const executeProcessingPreview = async () => {
  if (!previewData.value || processingPreviewLoading.value) return

  processingPreviewLoading.value = true
  try {
    const result = executeDataProcessing(previewData.value)
    processingPreviewData.value = result
    message.success('Data processing preview successful')
  } catch (error) {
    message.error('Failed to process preview: ' + error.message)
    processingPreviewData.value = null
  } finally {
    processingPreviewLoading.value = false
  }
}

/**
 * Auto preview switch
 */
const autoPreviewEnabled = ref(true)

/**
 * Anti-shake execution preview（for automatic updates）
 */
const debouncePreview = (() => {
  let timer: NodeJS.Timeout | null = null
  return (delay = 300) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (autoPreviewEnabled.value) {
        executePreview()
      }
    }, delay)
  }
})()

/**
 * Monitor changes in input methods，Automatically preview and notify parent components
 */
watch(
  () => formState.selectedMethod,
  (newMethod) => {
    previewData.value = null
    processingPreviewData.value = null
    // Notify the parent component that the input method has changed
    emit('method-change', newMethod)
  },
  { immediate: true }
)

/**
 * 🔥 Intelligent automatic update strategy
 */

// JSONData changes - Automatically update now（No performance loss）
watch(
  () => formState.jsonData,
  () => {
    if (formState.selectedMethod === 'json' && autoPreviewEnabled.value) {
      debouncePreview(300)
    }
  }
)

// ScriptCode changes - Delay automatic updates（lightweight computing）
watch(
  () => formState.scriptCode,
  () => {
    if (formState.selectedMethod === 'script' && autoPreviewEnabled.value) {
      debouncePreview(1000) // Script type delay1Second
    }
  }
)

// HTTPConfiguration change monitoring
watch(
  [() => formState.httpUrl, () => formState.httpMethod, () => formState.httpHeaders, () => formState.httpBody],
  () => {
    if (formState.selectedMethod === 'http') {
    }
  }
)

/**
 * Monitor changes in raw data，real time processing
 */
watch(
  () => previewData.value,
  () => {
    updateProcessedData()
  }
)

/**
 * Monitor and handle configuration changes，real time processing
 */
watch(
  [() => processingState.jsonPath, () => processingState.defaultValue, () => processingState.scriptCode],
  () => {
    updateProcessedData()
  },
  { deep: true }
)

/**
 * 🔥 repair：Reset all form states
 * Called when the pop-up window opens，Ensure it is in a new and clean state every time
 * 🔥 unified standards：Prefer component sample data，Fallback to common data
 */
const resetFormState = () => {
  // Reset form data
  formState.selectedMethod = 'json'
  
  // If there is component sample data, use it，Otherwise use general data
  if (props.exampleData) {
    formState.jsonData = JSON.stringify(props.exampleData, null, 2)
  } else {
    formState.jsonData = JSON.stringify({
      value: 45,
      unit: '%',
      metricsName: 'humidity',
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  formState.httpUrl = 'https://api.example.com/data'
  formState.httpMethod = 'GET'
  formState.httpHeaders = '{\n  "Authorization": "Bearer your-token",\n  "Content-Type": "application/json"\n}'
  formState.httpBody = '{}'
  formState.scriptCode =
    'return {\n  timestamp: new Date().toISOString(),\n  randomValue: Math.random(),\n  message: "Hello from script"\n}'

  // Reset preview status
  previewData.value = null
  previewLoading.value = false
  processingPreviewData.value = null
  processingPreviewLoading.value = false

  // Reset processing configuration
  processingState.jsonPath = ''
  processingState.defaultValue = ''
  processingState.scriptCode = ''
}

/**
 * Use sample data（onlyJSONmodel，for debugging）
 */
const loadExampleData = (showMessage = false) => {
  if (!props.exampleData) {
    if (showMessage) message.warning('The current component does not provide sample data')
    return
  }

  if (formState.selectedMethod === 'json') {
    formState.jsonData = JSON.stringify(props.exampleData, null, 2)
    if (showMessage) message.success('Component sample data loaded')
  } else {
    if (showMessage) message.info('Sample data is only available inJSONAvailable in mode')
  }
}

/**
 * Get the tooltip text of the sample button
 */
const getExampleButtonTitle = () => {
  return formState.selectedMethod === 'json' 
    ? 'Load component sample data（for debugging）' 
    : 'Sample data is only available inJSONAvailable in mode'
}

/**
 * 🔥 repair：Load status based on edit data
 * Receive edit data from parent component and populate the form
 */
const loadEditData = (editData: any) => {
  if (!editData) {
    return
  }

  // Load basic configuration
  formState.selectedMethod = editData.type || 'json'

  // Load corresponding data according to type
  switch (editData.type) {
    case 'json':
      // 🔥 critical fix：Support multipleJSONData field name，Prioritize actual saved fields
      if (editData.jsonData) {
        formState.jsonData = editData.jsonData
      } else if (editData.jsonString) {
        // fromconfig.jsonStringmedium recovery
        formState.jsonData = editData.jsonString
      } else if (editData.config?.jsonString) {
        // from nestedconfig.jsonStringmedium recovery
        formState.jsonData = editData.config.jsonString
      }
      break
    case 'script':
      if (editData.scriptCode) {
        formState.scriptCode = editData.scriptCode
      }
      break
    case 'http':
      // Update old format fields（stay compatible）
      if (editData.url) formState.httpUrl = editData.url
      if (editData.method) formState.httpMethod = editData.method
      if (editData.headers) formState.httpHeaders = editData.headers
      if (editData.body) formState.httpBody = editData.body

      // 🔥 critical fix：Prioritize from httpConfigData Full load，fallback to basic fields
      if (editData.httpConfigData) {
        // completeHTTPConfiguration data exists，Direct loading
        httpConfig.value = {
          ...httpConfig.value,
          ...editData.httpConfigData,
          // Make sure key fields have default values
          url: editData.httpConfigData.url || editData.url || '',
          method: editData.httpConfigData.method || editData.method || 'GET',
          timeout: editData.httpConfigData.timeout || editData.timeout || 10000,
          addressType: editData.httpConfigData.addressType || 'external',
          selectedInternalAddress: editData.httpConfigData.selectedInternalAddress || '',
          enableParams: editData.httpConfigData.enableParams || false,
          pathParameter: editData.httpConfigData.pathParameter,
          // Make sure the array field is not empty
          headers: editData.httpConfigData.headers || [],
          params: editData.httpConfigData.params || [],
          pathParams: editData.httpConfigData.pathParams || []
        }
      } else {
        // No complex configuration data，Recover from basic fields
        httpConfig.value.url = editData.url || ''
        httpConfig.value.method = editData.method || 'GET'
        httpConfig.value.timeout = editData.timeout || 10000
        httpConfig.value.addressType = 'external' // Default external address
        httpConfig.value.selectedInternalAddress = ''
        httpConfig.value.enableParams = false

        // Restoring base configuration from old format
        try {
          if (editData.headers && typeof editData.headers === 'string') {
            const headersObj = JSON.parse(editData.headers)
            httpConfig.value.headers = Object.entries(headersObj).map(([key, value]) => ({
              key,
              value: String(value),
              enabled: true,
              isDynamic: false,
              dataType: 'string',
              variableName: '',
              description: ''
            }))
          }
          if (editData.body) {
            httpConfig.value.body = typeof editData.body === 'string' ? editData.body : JSON.stringify(editData.body)
          }
        } catch (error) {}
      }
      break
  }

  // Load processing configuration
  if (editData.processingConfig) {
    processingState.jsonPath = editData.processingConfig.jsonPath || ''
    processingState.defaultValue = editData.processingConfig.defaultValue || ''
    processingState.scriptCode = editData.processingConfig.scriptCode || ''
  }
}

/**
 * Initialized when component is mounted
 */
onMounted(() => {
  // 🔥 critical fix：Reset state only in non-edit mode，Avoid overwriting user data
  if (props.isEditMode && props.editData) {
    // edit mode：Set the basic status first，Then load the edit data
    formState.selectedMethod = 'json' // base state
    nextTick(() => {
      loadEditData(props.editData)
    })
  } else {
    // non-editing mode：Reset to initial state（Contains sample data）
    resetFormState()
    nextTick(() => {
      resetFormState() // Ensure state consistency
    })
  }
})

/**
 * Expose methods and state to parent components
 */
defineExpose({
  resetFormState,
  loadEditData,
  formState // Expose form state，Make the parent component accessible selectedMethod
})
</script>

<template>
  <!-- 🔥 Drawer mode：Render content area directly -->
  <div class="drawer-content-wrapper">
    <!-- Split layout left and right -->
    <div class="modal-content drawer-mode">
      <!-- left area - Data configuration -->
      <div class="left-panel">
        <!-- upper part - Entry form (2/3high) -->
        <div class="input-form-section">
          <div class="form-content">
            <!-- TagSelector entry method -->
            <div class="method-selector">
              <n-space>
                <n-tag
                  :type="formState.selectedMethod === 'http' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'http'"
                  checkable
                  :checked="formState.selectedMethod === 'http'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'http'"
                >
                  HTTPinterface
                </n-tag>
                <n-tag
                  :type="formState.selectedMethod === 'json' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'json'"
                  checkable
                  :checked="formState.selectedMethod === 'json'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'json'"
                >
                  JSONdata
                </n-tag>

                <n-tag
                  :type="formState.selectedMethod === 'script' ? 'primary' : 'default'"
                  :bordered="formState.selectedMethod !== 'script'"
                  checkable
                  :checked="formState.selectedMethod === 'script'"
                  class="method-tag"
                  @click="formState.selectedMethod = 'script'"
                >
                  JavaScriptscript
                </n-tag>
              </n-space>
            </div>

            <!-- content area -->
            <div class="content-area">
              <!-- Auto preview switch -->
              <n-space align="center" justify="space-between" style="margin-bottom: 8px">
                <n-space align="center" size="small">
                  <n-switch v-model:value="autoPreviewEnabled" size="small" />
                  <n-text style="font-size: 11px">Automatic preview</n-text>
                  <n-popover trigger="hover" placement="top">
                    <template #trigger>
                      <span style="color: var(--text-color-3); cursor: help; font-size: 11px">❓</span>
                    </template>
                    <div style="max-width: 200px; font-size: 12px">
                      <p>JSON/ScriptThe type automatically updates the preview</p>
                      <p>HTTPType needs to be manually clicked（Avoid frequent requests）</p>
                    </div>
                  </n-popover>
                </n-space>

                <!-- button group -->
              <n-space size="small">
                <!-- Use the sample data button -->
                <n-button
                  v-if="props.exampleData"
                  type="info"
                  size="small"
                  :disabled="!props.exampleData"
                  @click="() => loadExampleData(true)"
                  :title="getExampleButtonTitle()"
                >
                  Use sample data
                </n-button>
                
                <!-- preview button -->
                <n-button type="primary" size="small" :loading="previewLoading" @click="executePreview">
                  Preview data
                </n-button>
              </n-space>
              </n-space>

              <!-- JSONdata entry -->
              <div v-if="formState.selectedMethod === 'json'" class="editor-container">
                <n-input
                  v-model:value="formState.jsonData"
                  type="textarea"
                  :rows="12"
                  placeholder="Please enterJSONformat data"
                  show-count
                  :input-props="{ style: 'font-family: Monaco, Consolas, monospace; font-size: 12px;' }"
                />
              </div>

              <!-- HTTPInterface configuration -->
              <div v-if="formState.selectedMethod === 'http'" class="editor-container">
                <HttpConfigForm
                  v-model:model-value="httpConfig"
                  :component-id="componentId"
                  @update:model-value="onHttpConfigUpdate"
                />
              </div>

              <!-- Script entry -->
              <div v-if="formState.selectedMethod === 'script'" class="editor-container">
                <SimpleScriptEditor
                  v-model:model-value="formState.scriptCode"
                  template-category="data-generation"
                  placeholder="Please enter the data generation script，Passable context Parameter access context..."
                  height="320px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- right area - three-stage layout -->
      <div class="right-panel">
        <!-- first paragraph - Raw data preview -->
        <div class="right-section raw-data-section">
          <div class="compact-header">
            <span class="section-icon">📊</span>
            <span>Raw data preview</span>
          </div>
          <div class="section-content">
            <!-- Loading status -->
            <div v-if="previewLoading" class="preview-loading">
              <n-spin size="small" />
              <span>Executing data acquisition...</span>
            </div>
            <!-- Preview results -->
            <div v-else-if="previewData" class="preview-result">
              <n-code :code="JSON.stringify(previewData, null, 2)" language="json" :hljs="false" word-wrap />
            </div>
            <!-- Empty state -->
            <div v-else class="preview-empty">
              <n-empty description="Please complete the configuration on the left and click Preview Data to obtain the original data" size="small">
                <template #icon>
                  <span style="font-size: 18px">📭</span>
                </template>
              </n-empty>
            </div>
          </div>
        </div>

        <!-- Second paragraph - Data processing configuration -->
        <div class="right-section processing-config-section">
          <div class="compact-header">
            <span class="section-icon">⚙️</span>
            <span>Data processing configuration</span>
          </div>
          <div class="section-content">
            <!-- JSONPathfilter -->
            <div class="processing-item">
              <div class="flex">
                <span class="mr-4">JSONPath filter:</span>
                <div class="w-[240px]">
                  <n-input
                    v-model:value="processingState.jsonPath"
                    placeholder="For example: $.temperature or $.sensors[0] (Leave blank to not filter)"
                    size="small"
                  />
                </div>
                <n-popover trigger="hover" placement="top">
                  <template #trigger>
                    <span class="help-icon">❓</span>
                  </template>
                  <div>
                    <p>useJSONPathSyntax for extracting data fragments</p>
                    <p>
                      For example:
                      <code>$.temperature</code>
                      Extraction temperature
                    </p>
                    <p>
                      or:
                      <code>$.sensors[0]</code>
                      Extract the first sensor
                    </p>
                    <p>Leave blank to indicate no filtering，Use raw data</p>
                  </div>
                </n-popover>
              </div>
            </div>

            <!-- Script processing -->
            <div class="processing-item">
              <SimpleScriptEditor
                v-model:model-value="processingState.scriptCode"
                template-category="data-processing"
                placeholder="Please enter the data processing script，Passable data Parameter access to raw data..."
                height="140px"
              />
            </div>
          </div>
        </div>

        <!-- Paragraph 3 - Display of processing results -->
        <div class="right-section processing-result-section">
          <div class="compact-header">
            <span class="section-icon">✨</span>
            <span>Display of processing results</span>
            <span class="realtime-indicator">
              <span class="indicator-dot"></span>
              real time processing
            </span>
          </div>
          <div class="section-content">
            <!-- Processing results -->
            <div v-if="processingPreviewData" class="processing-result">
              <n-code :code="JSON.stringify(processingPreviewData, null, 2)" language="json" :hljs="false" word-wrap />
            </div>
            <!-- Empty state -->
            <div v-else class="processing-empty">
              <n-empty description="Automatically display results after configuring processing rules" size="small">
                <template #icon>
                  <span style="font-size: 18px">⚙️</span>
                </template>
              </n-empty>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer mode bottom operating area -->
    <div class="drawer-footer">
      <n-space justify="end">
        <n-button @click="handleClose">Cancel</n-button>
        <n-button type="primary" :disabled="!previewData" @click="handleConfirm">Sure</n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
/* 🔥 Drawer mode dedicated wrapper */
.drawer-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 75vh;
}

.modal-content {
  display: flex;
  gap: 12px;
  height: 600px;
  padding: 0;
}

/* 🔥 Layout adjustment in drawer mode */
.modal-content.drawer-mode {
  flex: 1;
  height: auto;
  min-height: 0;
}

/* 🔥 Drawer bottom operating area */
.drawer-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--card-color);
  flex-shrink: 0;
}

.left-panel,
.right-panel {
  flex: 4;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}
.right-panel {
  flex: 3;
}
/* Panel title */

/* Left panel internal layout */
.left-panel {
  gap: 0;
}

.input-form-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border-color);
  min-height: 0;
}

.data-preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* subarea title */
.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.form-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.data-preview-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

/* right area */
.processing-area {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Handle area styles */
.processing-description {
  flex-shrink: 0;
}

.processing-section {
  flex-shrink: 0;
}

.help-icon {
  font-size: 12px;
  color: var(--text-color-3);
  cursor: help;
}

.processing-content {
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-prefix {
  font-size: 11px;
  color: var(--text-color-2);
  width: 35px;
  display: inline-block;
}

.default-value-input {
  margin-top: 4px;
}

/* Process preview area */
.processing-preview {
  height: 200px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.processing-result {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  background: var(--code-color);
}

.processing-result :deep(.n-code) {
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  line-height: 1.4;
}

.processing-result :deep(.n-code pre) {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.processing-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-color);
}

/* Script template drop-down box style */
.script-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Real-time processing indicator */
.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--success-color);
}

.indicator-dot {
  width: 6px;
  height: 6px;
  background: var(--success-color);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* TagSelector style */
.method-selector {
  margin-bottom: 16px;
  padding: 8px 0;
}

.method-tag {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.method-tag:not([disabled]):hover {
  transform: translateY(-1px);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.editor-container {
  flex: 1;
}

/* Form related styles */
.code-editor-container {
  width: 100%;
}

.preview-btn {
  flex-shrink: 0;
}

/* Preview area style */
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-color-2);
  font-size: 12px;
}

.preview-result {
  height: 100%;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--code-color);
}

.preview-result :deep(.n-code) {
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  line-height: 1.4;
}

.preview-result :deep(.n-code pre) {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.preview-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Form item style optimization */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
  font-weight: 500;
}

/* Scroll bar style */
.form-content::-webkit-scrollbar,
.data-preview-content::-webkit-scrollbar,
.processing-area::-webkit-scrollbar {
  width: 4px;
}

.form-content::-webkit-scrollbar-track,
.data-preview-content::-webkit-scrollbar-track,
.processing-area::-webkit-scrollbar-track {
  background: transparent;
}

.form-content::-webkit-scrollbar-thumb,
.data-preview-content::-webkit-scrollbar-thumb,
.processing-area::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.form-content::-webkit-scrollbar-thumb:hover,
.data-preview-content::-webkit-scrollbar-thumb:hover,
.processing-area::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 🔥 Three-section layout enhanced style */
/* Sub-processing area style */
.sub-processing-section {
  margin-bottom: 16px;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

/* Hide the data preview on the left in drawer mode，move to right */
.drawer-mode .left-panel .data-preview-section {
  display: none;
}

/* 🔥 Three-section layout style on the right */
.drawer-mode .right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  min-height: 0;
}

/* Height distribution in three areas */
.raw-data-section {
  flex: 1.2;
  min-height: 180px;
}

.processing-config-section {
  flex: 1.8;
  min-height: 280px;
}

.processing-result-section {
  flex: 1;
  min-height: 160px;
}

.section-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-icon {
  font-size: 14px;
  margin-right: 6px;
}

/* Handling configuration item styles */
.processing-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.processing-item:last-child {
  margin-bottom: 0;
}

.processing-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 8px;
}

/* Data preview content area optimization */
.drawer-mode .data-preview-content {
  height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--code-color);
}
</style>
