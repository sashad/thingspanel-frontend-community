<!--
  HTTPConfiguration section1step - Basic configuration components
  ConfigurationURL、Request method、Timeout and request body
-->
<script setup lang="ts">
/**
 * HttpConfigStep1 - HTTPBasic configuration steps
 * IncludeURL、Request method、timeout、Request body configuration
 */

import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'
import { internalAddressOptions, getApiByValue } from '@/core/data-architecture/data/internal-address-data'
import type { InternalApiItem } from '@/core/data-architecture/types/internal-api'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

interface Props {
  /** HTTPConfiguration data */
  modelValue: Partial<HttpConfig>
  /** 🔥 New：current componentID，for property binding */
  componentId?: string
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'urlChange'): void
  (e: 'apiInfoUpdate', apiInfo: any): void // New：Interface information update event
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 🔥 New：Tags that prevent cyclic updates
const isUpdatingFromChild = ref(false)

/**
 * Address type selection：directly frommodelValueGet and set
 */
const addressType = computed({
  get: () => (props.modelValue.addressType !== undefined ? props.modelValue.addressType : 'external'),
  set: (value: 'internal' | 'external') => {
    updateConfig('addressType', value)
  }
})

/**
 * Get selectedAPIinformation
 */
const selectedApiInfo = computed(() => {
  if (!selectedInternalAddress.value) return null
  return getApiByValue(selectedInternalAddress.value)
})

/**
 * selected internal address：directly frommodelValueGet and set
 */
const selectedInternalAddress = computed({
  get: () => (props.modelValue.selectedInternalAddress !== undefined ? props.modelValue.selectedInternalAddress : ''),
  set: (value: string) => {
    updateConfig('selectedInternalAddress', value)
  }
})

/**
 * Whether to enable parameter passing
 */
const enableParams = ref(false)

/**
 * Parameter configuration
 */
const urlParams = ref<EnhancedParameter[]>([])

/**
 * HTTPMethod options
 */
const httpMethods = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

/**
 * Whether to display the request body configuration
 */
const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(props.modelValue.method || '')
})

/**
 * Update configuration data
 */
const updateConfig = (field: keyof HttpConfig, value: any) => {
  const newConfig = {
    ...props.modelValue,
    [field]: value
  }

  // 🔥 debug：Listen for all configuration updates
  if (process.env.NODE_ENV === 'development') {
  }
  if (field === 'pathParameter') {
  }

  emit('update:modelValue', newConfig)
}

/**
 * Address type change processing
 */
const onAddressTypeChange = (type: 'internal' | 'external') => {
  addressType.value = type

  if (type === 'external') {
    // When switching to an external address，Clear internal address related configurations
    selectedInternalAddress.value = ''
    enableParams.value = false
    urlParams.value = []
  } else {
    // When switching to internal address，ClearURLand all related status
    selectedInternalAddress.value = ''
    enableParams.value = false
    urlParams.value = []
    updateConfig('url', '')
  }
}

/**
 * Internal address selection processing
 */
const onInternalAddressSelect = (value: string, option: any) => {
  selectedInternalAddress.value = value

  // GetAPIDetailed information
  const apiInfo = getApiByValue(value)
  if (apiInfo) {
    // Also set the request method
    updateConfig('method', apiInfo.method)

    // 🔥 critical fix：Save the selected internal address to the parent component
    updateConfig('selectedInternalAddress', value)

    // Set initial nowURL（Version without parameter substitution）
    updateConfig('url', apiInfo.url)

    // 🔥 Emit interface information update event，Let the parent component know the currently selected interface
    emit('apiInfoUpdate', apiInfo)

    // 🔥 repair：Parameters are not automatically filled in when selecting an internal address，Only record whether there are parameters
    if (apiInfo.hasPathParams && apiInfo.pathParamNames) {
      // Only clear existing parameters，Do not automatically generate new
      urlParams.value = []
      enableParams.value = false
      updateConfig('pathParams', [])
      updateConfig('enableParams', false)
    } else {
      // When there is no path parameter，Clear parameter configuration
      urlParams.value = []
      enableParams.value = false
      updateConfig('pathParams', [])
      updateConfig('enableParams', false)
    }
  } else {
    // if not foundAPIinformation，Use the selected value directly
    updateConfig('url', value)
  }
}

/**
 * Pass parameter enable status change
 */
const onEnableParamsChange = (enabled: boolean) => {
  enableParams.value = enabled

  // 🔥 critical fix：Synchronize enabled status to parent component
  updateConfig('enableParams', enabled)

  if (!enabled) {
    // When parameter passing is disabled，Clear parameter configuration
    urlParams.value = []
    updateConfig('pathParams', [])
    updateConfig('pathParameter', undefined)
  }
  if (!enabled) {
    urlParams.value = []
    // When disabling parameters，Revert to originalURL（No parameter substitution）
    const apiInfo = selectedApiInfo.value
    if (apiInfo) {
      updateConfig('url', apiInfo.url)
    }
  }
}

/**
 * 🔥 repair：Parameter configuration update - Batch updates avoid frequent re-rendering
 */
const onUrlParamsUpdate = (params: EnhancedParameter[]) => {

  // 🔥 set mark，avoidwatchListener triggers initialization again
  isUpdatingFromChild.value = true

  urlParams.value = params

  // 🔥 critical fix：Batch update configuration，avoid multipleemitResulting in re-rendering
  const batchUpdates: Partial<HttpConfig> = {
    pathParams: params
  }

  // If there are still old formatspathParameter，Also update（compatibility）
  if (params.length > 0) {
    const firstParam = params[0]
    batchUpdates.pathParameter = {
      value: firstParam.value,
      isDynamic: firstParam.selectedTemplate === 'component-property-binding',
      variableName: firstParam.variableName || '',
      description: firstParam.description || '',
      dataType: firstParam.dataType || 'string',
      defaultValue: firstParam.defaultValue,
      selectedTemplate: firstParam.selectedTemplate,
      key: firstParam.key,
      enabled: firstParam.enabled
    }
  }

  // if there isAPIinformation，make sureURLKeep original template format
  const apiInfo = selectedApiInfo.value
  if (apiInfo) {
    batchUpdates.url = apiInfo.url // Keep the original template as /device/detail/{id}
  }

  // 🔥 One-time batch update，avoid multipleemit
  const newConfig = {
    ...props.modelValue,
    ...batchUpdates
  }

  if (process.env.NODE_ENV === 'development') {
  }
  emit('update:modelValue', newConfig)

  // 🔥 reset mark，Delay execution to avoid immediate triggeringwatch
  nextTick(() => {
    isUpdatingFromChild.value = false
  })
}

/**
 * URLTrigger event on change
 */
const onUrlChange = (value: string) => {
  updateConfig('url', value)
  emit('urlChange')
}

/**
 * Format address display text
 */
const formatAddressDisplayText = (apiInfo: InternalApiItem) => {
  return `${apiInfo.label} (${apiInfo.method} ${apiInfo.url})`
}

/**
 * Display text of current address（Contains path parameter substitution）
 */
const currentAddressDisplay = computed(() => {
  if (addressType.value === 'external') {
    return props.modelValue.url || ''
  }

  const apiInfo = selectedApiInfo.value
  if (apiInfo) {
    let url = apiInfo.url

    // If parameter configuration is enabled，Replace with actual parameter valueURLplaceholder in - Correctly resolve property bindings and default values
    if (enableParams.value && urlParams.value.length > 0) {
      urlParams.value.forEach(param => {
        if (param.enabled && param.key) {
          let resolvedValue = param.value

          // If it is property binding，Show default values ​​for preview（The attribute value will be parsed during the actual request）
          if (param.selectedTemplate === 'component-property-binding' && typeof param.value === 'string') {
            // URLWhen previewing：If it is property binding，Show default value first，Otherwise show the binding path
            resolvedValue = param.defaultValue || `[${param.value}]`
          }

          // Check if the value is"null"
          const isEmpty =
            resolvedValue === null ||
            resolvedValue === undefined ||
            resolvedValue === '' ||
            (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

          if (!isEmpty) {
            url = url.replace(`{${param.key}}`, resolvedValue)
          } else if (param.defaultValue) {
            // Use default value
            url = url.replace(`{${param.key}}`, param.defaultValue)
          }
        }
      })
    }

    return `${apiInfo.label} (${apiInfo.method} ${url})`
  }

  return props.modelValue.url || ''
})

/**
 * Get the final result of processed path parametersURL
 */
const getFinalUrl = computed(() => {
  if (addressType.value === 'external') {
    return props.modelValue.url || ''
  }

  const apiInfo = selectedApiInfo.value
  if (apiInfo) {
    let url = apiInfo.url

    // Replace path parameters - Correctly resolve property bindings and default values
    if (enableParams.value && urlParams.value.length > 0) {
      urlParams.value.forEach(param => {
        if (param.enabled && param.key) {
          let resolvedValue = param.value

          // If it is property binding，Show default values ​​for preview（The attribute value will be parsed during the actual request）
          if (param.selectedTemplate === 'component-property-binding' && typeof param.value === 'string') {
            // URLWhen previewing：If it is property binding，Show default value first，Otherwise show the binding path
            resolvedValue = param.defaultValue || `[${param.value}]`
          }

          // Check if the value is"null"
          const isEmpty =
            resolvedValue === null ||
            resolvedValue === undefined ||
            resolvedValue === '' ||
            (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

          if (!isEmpty) {
            url = url.replace(`{${param.key}}`, resolvedValue)
          } else if (param.defaultValue) {
            // Use default value
            url = url.replace(`{${param.key}}`, param.defaultValue)
          }
        }
      })
    }

    return url
  }

  return props.modelValue.url || ''
})

/**
 * initializationURLParameter status - frompropsrestore configuration
 */
const initializeUrlParamsState = () => {
  // If the current mode is internal address mode and there is an internal address selected
  if (addressType.value === 'internal' && selectedInternalAddress.value) {
    const apiInfo = getApiByValue(selectedInternalAddress.value)

    if (apiInfo && apiInfo.hasPathParams) {
      // Check if there is a saved path parameter configuration
      if (props.modelValue.pathParams && props.modelValue.pathParams.length > 0) {
        // Restore state from saved path parameters
        urlParams.value = props.modelValue.pathParams.map(param => ({
          key: param.key || 'pathParam',
          value: param.value || '',
          enabled: param.enabled !== false,
          valueMode: param.valueMode || (param.isDynamic ? 'property' : 'manual'),
          selectedTemplate: param.selectedTemplate || (param.isDynamic ? 'property-binding' : 'manual'),
          variableName: param.variableName || '',
          description: param.description || '',
          dataType: param.dataType || 'string',
          defaultValue: param.defaultValue,
          _id: `param_${Date.now()}_${Math.random()}`
        }))
        enableParams.value = true
      } else if (props.modelValue.pathParameter) {
        // Compatible with old format path parameters
        urlParams.value = [
          {
            key: 'pathParam',
            value: props.modelValue.pathParameter.value || '',
            enabled: true,
            valueMode: props.modelValue.pathParameter.isDynamic ? 'property' : 'manual',
            selectedTemplate: props.modelValue.pathParameter.isDynamic ? 'property-binding' : 'manual',
            variableName: props.modelValue.pathParameter.variableName || '',
            description: props.modelValue.pathParameter.description || '',
            dataType: props.modelValue.pathParameter.dataType || 'string',
            defaultValue: props.modelValue.pathParameter.defaultValue,
            _id: `param_${Date.now()}`
          }
        ]
        enableParams.value = true
      }
    }
  }
}

/**
 * 🔥 repair：monitor props change，synchronousURLParameter status - Avoid cyclic updates
 */
watch(
  () => [
    props.modelValue.addressType || 'external',
    props.modelValue.selectedInternalAddress || '',
    props.modelValue.pathParams || [],
    props.modelValue.pathParameter || null,
    props.modelValue.enableParams || false
  ],
  () => {
    // 🔥 If you are updating from a child component，Skip this sync，avoid loops
    if (isUpdatingFromChild.value) {
      if (process.env.NODE_ENV === 'development') {
      }
      return
    }

    // 🔥 Lazy initialization，Make sure all data is fully loaded before synchronizing status
    nextTick(() => {
      initializeUrlParamsState()
    })
  },
  { deep: true, immediate: true }
)

/**
 * 🔥 repair：Monitor key field changes，force reinitialization - Avoid cyclic updates
 */
watch(
  () => props.modelValue,
  newValue => {
    // 🔥 If you are updating from a child component，Skip this sync
    if (isUpdatingFromChild.value) {
      return
    }

    // whenmodelValuecompletely changed（For example, loading from edit data），Reinitialize
    if (newValue && (newValue.addressType === 'internal' || newValue.selectedInternalAddress)) {
      nextTick(() => {
        // If it is an internal address and there is an address selected，Make sure status is synchronized correctly
        if (newValue.addressType === 'internal' && newValue.selectedInternalAddress) {
          const apiInfo = getApiByValue(newValue.selectedInternalAddress)
          if (apiInfo) {
            // 🔥 Forced emission of interface information update events
            emit('apiInfoUpdate', apiInfo)
          }
        }
        initializeUrlParamsState()
      })
    }
  },
  { deep: true }
)

/**
 * Initialization state when component is mounted
 */
onMounted(() => {
  initializeUrlParamsState()
})
</script>

<template>
  <div class="http-config-step1">
    <n-form size="small" :show-feedback="false">
      <!-- Address type selection -->
      <n-form-item label="Address type" required>
        <n-radio-group :value="addressType" @update:value="onAddressTypeChange">
          <n-radio value="external">external address</n-radio>
          <n-radio value="internal">internal address</n-radio>
        </n-radio-group>
      </n-form-item>

      <!-- External address input -->
      <n-form-item v-if="addressType === 'external'" label="askURL" required>
        <n-input :value="modelValue.url" placeholder="https://api.example.com/data" @update:value="onUrlChange" />
      </n-form-item>

      <!-- Internal address selection -->
      <n-form-item v-if="addressType === 'internal'" label="Select internal interface" required>
        <n-select
          :value="selectedInternalAddress"
          :options="internalAddressOptions"
          placeholder="Please select an internal interface"
          @update:value="onInternalAddressSelect"
        />
      </n-form-item>

      <!-- Address display -->
      <n-form-item v-if="modelValue.url" label="current address">
        <n-input :value="currentAddressDisplay" readonly placeholder="The selected address will be displayed">
          <template #prefix>
            <span class="address-type-indicator">
              {{ addressType === 'internal' ? '💻' : '🌐' }}
            </span>
          </template>
          <template #suffix>
            <n-button text size="small" @click="() => navigator.clipboard?.writeText(getFinalUrl)">copy</n-button>
          </template>
        </n-input>
      </n-form-item>

      <!-- Whether to enable parameter passing -->
      <n-form-item v-if="addressType === 'internal' && selectedApiInfo?.hasPathParams" label="URLPassing on parameters">
        <n-space align="center">
          <n-switch :value="enableParams" @update:value="onEnableParamsChange" />
          <n-text depth="3" style="font-size: 12px">
            ConfigurationURLpath parameter value
            <n-text v-if="selectedApiInfo?.pathParamNames" type="info" style="margin-left: 8px">
              (Requires configuration: {{ selectedApiInfo.pathParamNames.join(', ') }})
            </n-text>
          </n-text>
        </n-space>
      </n-form-item>

      <!-- Parameter configuration -->
      <n-form-item v-if="addressType === 'internal' && enableParams && selectedApiInfo?.hasPathParams" label="Parameter configuration">
        <DynamicParameterEditor
          :model-value="urlParams"
          parameter-type="path"
          title=""
          add-button-text="Add toURLparameter"
          key-placeholder="Parameter name（like：id）"
          value-placeholder="Parameter value"
          :max-parameters="1"
          :current-api-info="selectedApiInfo"
          :current-component-id="componentId"
          @update:model-value="onUrlParamsUpdate"
        />
        <n-text v-if="urlParams.length === 0" depth="3" style="font-size: 12px; margin-top: 8px">
          💡 hint：After configuring the parameter value, it will be automatically replaced in the placeholder of the address above.
        </n-text>
        <n-text v-else-if="urlParams.length > 0" depth="3" style="font-size: 12px; margin-top: 8px">
          ✅ Parameters configured，in address {{ '{' + urlParams[0].key + '}' }} will be replaced by "{{ urlParams[0].value }}"
        </n-text>
      </n-form-item>

      <n-form-item label="Request method" required>
        <n-select
          :value="modelValue.method"
          :options="httpMethods"
          @update:value="value => updateConfig('method', value)"
        />
      </n-form-item>

      <n-form-item label="timeout (ms)">
        <n-input-number
          :value="modelValue.timeout"
          :min="1000"
          :max="60000"
          :step="1000"
          @update:value="value => updateConfig('timeout', value)"
        />
      </n-form-item>

      <n-form-item v-if="showBody" label="Request body">
        <n-input
          :value="modelValue.body"
          type="textarea"
          :rows="4"
          placeholder='{"key": "value"}'
          :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
          @update:value="value => updateConfig('body', value)"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.http-config-step1 {
  width: 100%;
  padding: 12px;
}

/* Address display area style */
.http-config-step1 :deep(.n-input--readonly) {
  background-color: var(--code-color);
  border: 1px solid var(--border-color);
}

.http-config-step1 :deep(.n-input--readonly .n-input__input) {
  color: var(--text-color);
  font-family: monospace;
  font-size: 13px;
  font-weight: 500;
}

.address-type-indicator {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  margin-right: 4px;
}
</style>
