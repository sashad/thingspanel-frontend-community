<!--
  HTTPInterface configuration form component
  recovertablayout，remove icon，keep it compact
-->
<script setup lang="ts">
/**
 * HttpConfigForm - HTTPInterface configuration form
 * recovertablayout，Remove icon decoration
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { HttpHeader, HttpParam, HttpPathParam, HttpConfig, PathParameter } from '@/core/data-architecture/types/http-config'
import { extractPathParamsFromUrl } from '@/core/data-architecture/types/http-config'
// Import step-by-step configuration components
import HttpConfigStep1 from '@/core/data-architecture/components/common/HttpConfigStep1.vue'
import HttpConfigStep2 from '@/core/data-architecture/components/common/HttpConfigStep2.vue'
import HttpConfigStep3 from '@/core/data-architecture/components/common/HttpConfigStep3.vue'
import HttpConfigStep4 from '@/core/data-architecture/components/common/HttpConfigStep4.vue'

// Propsinterface - supportv-modelmodel
interface Props {
  /** v-modelboundHTTPConfiguration */
  modelValue?: Partial<HttpConfig>
  /** 🔥 New：current componentID，for property binding */
  componentId?: string
}

// Emitsinterface
interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    url: '',
    method: 'GET',
    timeout: 10000,
    addressType: 'external', // Defaults to external address
    selectedInternalAddress: '',
    headers: [],
    params: [],
    pathParams: [],
    body: '',
    preRequestScript: '',
    postResponseScript: ''
  })
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()

/**
 * currentTab - Use insteadTabToggle alternative step bar
 * 'basic': Basic configuration, 'headers': Request header, 'params': Parameter configuration, 'scripts': request script
 */
const currentTab = ref<'basic' | 'headers' | 'params' | 'scripts'>('basic')

/**
 * Currently selected internal interface information - Used for interface template functions
 */
const currentApiInfo = ref(null)

/**
 * Data conversion helper functions
 */
const convertHttpToEnhanced = (param: any) => ({
  key: param.key || '',
  value: param.value || '',
  enabled: param.enabled !== false,
  // 🔥 Prioritize using saved valueMode，Fallback to based on isDynamic infer
  valueMode: param.valueMode || (param.isDynamic ? 'property' : 'manual'),
  // 🔥 Prioritize using saved selectedTemplate，Fallback to based on isDynamic infer
  selectedTemplate: param.selectedTemplate || (param.isDynamic ? 'property-binding' : 'manual'),
  variableName: param.variableName || '',
  description: param.description || '',
  dataType: param.dataType || 'string'
})

/**
 * local configuration status - Contains address type status
 */
const localConfig = reactive<HttpConfig>({
  url: '',
  method: 'GET',
  timeout: 10000,
  addressType: 'external',
  selectedInternalAddress: '',
  pathParameter: undefined,
  headers: [],
  params: [],
  pathParams: [],
  body: '',
  preRequestScript: ''
})

/**
 * Initialize unified parameter array - Compatible with old data structures
 */
function initializeParameters(config?: HttpConfig): HttpParameter[] {
  const parameters: HttpParameter[] = []

  // If there are newparametersField，Use directly
  if (config?.parameters && Array.isArray(config.parameters)) {
    return [...config.parameters]
  }

  // Compatible with older formats：merge headers、params、pathParams
  if (config?.headers) {
    config.headers.forEach(header => {
      parameters.push({
        ...header,
        paramType: 'header'
      })
    })
  }

  if (config?.params) {
    config.params.forEach(param => {
      parameters.push({
        ...param,
        paramType: 'query'
      })
    })
  }

  if (config?.pathParams) {
    config.pathParams.forEach(pathParam => {
      parameters.push({
        key: pathParam.key,
        value: pathParam.value,
        enabled: pathParam.enabled,
        isDynamic: pathParam.isDynamic,
        dataType: pathParam.dataType,
        variableName: pathParam.variableName,
        description: pathParam.description,
        paramType: 'path'
      })
    })
  }

  return parameters
}

/**
 * URLAutomatically detect path parameters when they change
 */
const onUrlChange = () => {
  // fromURLExtract path parameters from
  const detectedParams = extractPathParamsFromUrl(localConfig.url)

  if (detectedParams.length > 0) {
    // Merge existing path parameters，avoid duplication
    const existingKeys = (localConfig.pathParams || []).map(p => p.key)
    const newParams = detectedParams.filter(p => !existingKeys.includes(p.key))

    if (newParams.length > 0) {
      localConfig.pathParams = localConfig.pathParams || []
      localConfig.pathParams.push(...newParams)
    }
  }

  updateConfig()
}

/**
 * Handle interface information updates（fromStep1pass it on）
 */
const onApiInfoUpdate = (apiInfo: any) => {
  currentApiInfo.value = apiInfo
}

/**
 * Tabswitch function
 */
const switchToTab = (tab: 'basic' | 'headers' | 'params' | 'scripts') => {
  currentTab.value = tab
}

/**
 * Tabverify - Is the basic configuration completed?
 */
const isBasicConfigValid = computed(() => {
  return localConfig.url && localConfig.method
})

/**
 * Simplified configuration update function - fire event immediately，No complex conversions
 */
const updateConfig = () => {
  // 🔥 critical fix：Directly emit the currentlocalConfig，Make responsive systems work

  const config = { ...localConfig }

  // 🔥 Simplify conversion logic：Only perform necessary format conversions
  if (config.headers) {
    config.headers = config.headers.map(header => ({
      ...header,
      isDynamic: header.valueMode === 'property',
      paramType: 'header' as const
    }))
  }

  if (config.params) {
    config.params = config.params.map(param => ({
      ...param,
      isDynamic: param.valueMode === 'property',
      paramType: 'query' as const
    }))
  }

  if (config.pathParams && config.pathParams.length > 0) {
    // ConvertpathParams
    config.pathParams = config.pathParams.map(param => ({
      ...param,
      isDynamic: param.valueMode === 'property',
      paramType: 'path' as const
    }))

    // Stay backwards compatible：set uppathParameter
    const firstParam = config.pathParams[0]
    if (process.env.NODE_ENV === 'development') {
    }

    config.pathParameter = {
      value: firstParam.value,
      isDynamic: firstParam.valueMode === 'component' || firstParam.selectedTemplate === 'component-property-binding',
      dataType: firstParam.dataType,
      variableName: firstParam.variableName || '',
      description: firstParam.description || '',
      // 🔥 critical fix：Save complete fields，make sureDataItemFetcherCan correctly identify
      selectedTemplate: firstParam.selectedTemplate,
      defaultValue: firstParam.defaultValue,
      key: firstParam.key,
      enabled: firstParam.enabled
    }

    if (process.env.NODE_ENV === 'development') {
    }
  } else {
    config.pathParameter = undefined
    config.pathParams = []
  }

  emit('update:modelValue', config)
}

/**
 * Synchronization flag to prevent cyclic updates
 */
let isUpdatingFromProps = false
let isUpdatingToParent = false

/**
 * Secure configuration updates - Prevent cyclic updates
 */
const safeUpdateConfig = () => {
  if (isUpdatingFromProps || isUpdatingToParent) {
    return
  }

  isUpdatingToParent = true

  try {
    updateConfig()
  } finally {
    // delayed reset，Make sure the update is complete
    nextTick(() => {
      isUpdatingToParent = false
    })
  }
}

/**
 * Monitor local configuration changes - Use safeguards
 */
watch(
  () => localConfig,
  () => {
    // 🔥 Force reset flag，Ensure parameter updates are not blocked
    if (isUpdatingFromProps) {
      nextTick(() => {
        isUpdatingFromProps = false
        safeUpdateConfig()
      })
    } else {
      safeUpdateConfig()
    }
  },
  {
    deep: true,
    flush: 'post'
  }
)

/**
 * monitorpropsSynchronize changes to local state - Improve protection mechanism
 */
const syncPropsToLocal = (newValue: any) => {
  if (!newValue) return

  // 🔥 improve：Block sync only when necessary，Allow normal data echo
  if (isUpdatingToParent && !isUpdatingFromProps) {
    return
  }

  isUpdatingFromProps = true

  try {
    // 🔥 critical fix：Prefer existing values，Only override if new value is provided explicitly
    if (newValue.url !== undefined) localConfig.url = newValue.url
    if (newValue.method !== undefined) localConfig.method = newValue.method
    if (newValue.timeout !== undefined) localConfig.timeout = newValue.timeout

    // 🔥 Complete synchronization of address type related fields，Make sure the echo is correct
    if (newValue.addressType !== undefined) localConfig.addressType = newValue.addressType
    if (newValue.selectedInternalAddress !== undefined) {
      localConfig.selectedInternalAddress = newValue.selectedInternalAddress
    }
    if (newValue.enableParams !== undefined) localConfig.enableParams = newValue.enableParams
    if (newValue.pathParameter !== undefined) localConfig.pathParameter = newValue.pathParameter
    if (newValue.body !== undefined) localConfig.body = newValue.body
    if (newValue.preRequestScript !== undefined) {
      localConfig.preRequestScript = newValue.preRequestScript
    }

    // Array data conversion
    localConfig.headers = newValue.headers ? newValue.headers.map(convertHttpToEnhanced) : []
    localConfig.params = newValue.params ? newValue.params.map(convertHttpToEnhanced) : []

    // Path parameter processing
    if (newValue.pathParams) {
      localConfig.pathParams = newValue.pathParams.map(convertHttpToEnhanced)
    } else if (newValue.pathParameter) {
      localConfig.pathParams = [
        convertHttpToEnhanced({
          key: 'pathParam',
          value: newValue.pathParameter.value,
          enabled: true,
          isDynamic: newValue.pathParameter.isDynamic,
          variableName: newValue.pathParameter.variableName,
          description: newValue.pathParameter.description,
          dataType: newValue.pathParameter.dataType
        })
      ]
    } else {
      localConfig.pathParams = []
    }
  } finally {
    // delayed reset，Make sure synchronization is complete
    nextTick(() => {
      isUpdatingFromProps = false
    })
  }
}

watch(() => props.modelValue, syncPropsToLocal, { deep: true, immediate: true })
</script>

<template>
  <div class="http-config-form">
    <!-- Tabnavigation - alternative step bar -->
    <div class="tabs-section">
      <n-tabs v-model:value="currentTab" type="line" size="small" :animated="true" @update:value="switchToTab">
        <n-tab-pane name="basic" tab="Basic configuration">
          <HttpConfigStep1
            :model-value="localConfig"
            :component-id="componentId"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
            @url-change="onUrlChange"
            @api-info-update="onApiInfoUpdate"
          />
        </n-tab-pane>

        <n-tab-pane name="headers" tab="Request header" :disabled="!isBasicConfigValid">
          <HttpConfigStep2
            :model-value="localConfig"
            :component-id="componentId"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>

        <n-tab-pane name="params" tab="Parameter configuration" :disabled="!isBasicConfigValid">
          <HttpConfigStep3
            :model-value="localConfig"
            :component-id="componentId"
            :current-api-info="currentApiInfo"
            @update:model-value="
              value => {
                // 🔧 Force reset of loop protection flag，Make sure parameter updates can pass
                if (isUpdatingFromProps) {
                  isUpdatingFromProps = false
                }

                // 🔥 Force responsive updates - Use direct assignment insteadObject.assign
                localConfig.params = value.params || []

                // 🔥 Force refresh of component state
                nextTick(() => {})
              }
            "
          />
        </n-tab-pane>

        <n-tab-pane name="scripts" tab="request script" :disabled="!isBasicConfigValid">
          <HttpConfigStep4
            :model-value="localConfig"
            :component-id="componentId"
            @update:model-value="
              value => {
                Object.assign(localConfig, value)
              }
            "
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- Configuration status prompt -->
    <div v-if="!isBasicConfigValid" class="config-tip">
      <n-alert type="info" style="margin-top: 16px">📝 Please complete the basic configuration first（URLand request method），You can then configure other options</n-alert>
    </div>
  </div>
</template>

<style scoped>
.http-config-form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tabs-section {
  flex: 1;
  min-height: 500px;
  overflow: visible; /* 🔥 repair：Ensure dropdown menu is not clipped by outer container */
  position: relative;
}

/* TabContent style adjustment */
.tabs-section :deep(.n-tab-pane) {
  min-height: 450px;
  max-height: 600px;
  overflow-y: visible; /* 🔥 repair：Change tovisibleAvoid drop-down menus from being cropped */
  padding: 16px 0;
  position: relative;
  z-index: 1;
}

/* Tablabel style */
.tabs-section :deep(.n-tabs-nav) {
  margin-bottom: 16px;
}

.config-tip {
  padding: 12px;
}
</style>
