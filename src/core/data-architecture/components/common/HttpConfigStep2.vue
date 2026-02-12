<!--
  HTTPConfiguration section2step - Request header configuration component
  useDynamicParameterEditorConfigurationHTTPRequest header
  ✨ optimization：Add interface template intelligent recommendation card
-->
<script setup lang="ts">
/**
 * HttpConfigStep2 - HTTPRequest header configuration steps（UIOptimized version）
 * Configure request headers using the universal dynamic parameter editor
 *
 * 🎯 optimization3：Intelligent recommendation of interface templates
 * - DetectioncurrentApiInfoAre there any prefabricated parameters?
 * - Show smart recommendation cards
 * - Highlight after applying template
 */

import { ref, computed, watch } from 'vue'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'
// import icon
import { Sparkles as SparkleIcon } from '@vicons/ionicons5'

interface Props {
  /** HTTPConfiguration data */
  modelValue: Partial<HttpConfig>
  /** Currently selected internal interface information */
  currentApiInfo?: any
  /** 🔥 New：current componentID，for property binding */
  componentId?: string
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 🎯 optimization3：Smart recommendation card display status
 */
const showTemplateRecommend = ref(false)
const hasAppliedTemplate = ref(false)

/**
 * 🎯 optimization3：Check if there is an available request header template
 */
const hasHeaderTemplate = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return false

  // Check whether there are parameters of request header type
  const headerParams = props.currentApiInfo.commonParams.filter(
    (param: any) => param.type === 'header' || param.paramType === 'header'
  )

  return headerParams.length > 0
})

/**
 * 🎯 optimization3：Get request header template parameters
 */
const headerTemplateParams = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return []

  return props.currentApiInfo.commonParams.filter(
    (param: any) => param.type === 'header' || param.paramType === 'header'
  )
})

/**
 * 🎯 optimization3：monitorcurrentApiInfochange，Automatically display recommendation cards
 */
watch(
  () => props.currentApiInfo,
  newValue => {
    if (newValue && hasHeaderTemplate.value && !hasAppliedTemplate.value) {
      showTemplateRecommend.value = true
    }
  },
  { immediate: true }
)

/**
 * 🎯 optimization3：Application interface template
 */
const applyTemplate = () => {
  if (!headerTemplateParams.value || headerTemplateParams.value.length === 0) return

  // Generate template parameters
  const templateHeaders: EnhancedParameter[] = headerTemplateParams.value.map((param: any) => ({
    key: param.name,
    value: param.example || param.defaultValue || '',
    enabled: true,
    isDynamic: false,
    valueMode: 'manual',
    selectedTemplate: 'manual',
    variableName: '',
    description: param.description || `${param.name}Request header`,
    dataType: 'string',
    _id: `header_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }))

  // Merge into existing request headers（avoid duplication）
  const existingKeys = new Set((props.modelValue.headers || []).map(h => h.key))
  const newHeaders = templateHeaders.filter(h => !existingKeys.has(h.key))

  if (newHeaders.length > 0) {
    const updatedHeaders = [...(props.modelValue.headers || []), ...newHeaders]
    updateHeaders(updatedHeaders)

    // Mark template applied
    hasAppliedTemplate.value = true
    showTemplateRecommend.value = false
  }
}

/**
 * 🎯 optimization3：Close recommendation card
 */
const dismissRecommend = () => {
  showTemplateRecommend.value = false
}

/**
 * Update request header configuration
 */
const updateHeaders = (headers: EnhancedParameter[]) => {
  const updatedValue = {
    ...props.modelValue,
    headers
  }

  emit('update:modelValue', updatedValue)
}
</script>

<template>
  <div class="http-config-step2">
    <!-- 🎯 optimization3：Interface template intelligent recommendation card -->
    <n-alert v-if="showTemplateRecommend" type="success" closable style="margin-bottom: 16px" @close="dismissRecommend">
      <template #header>
        <n-space align="center">
          <n-icon size="18"><sparkle-icon /></n-icon>
          <span>Internal interface template available detected</span>
        </n-space>
      </template>

      <n-space vertical size="small">
        <n-text depth="3">
          interface "<n-text type="success" strong>{{ currentApiInfo?.label }}</n-text>" Include
          <n-text type="success" strong>{{ headerTemplateParams.length }}</n-text> prefabricated request header parameters
        </n-text>

        <n-space size="small">
          <n-tag
            v-for="param in headerTemplateParams.slice(0, 3)"
            :key="param.name"
            type="success"
            size="small"
            :bordered="false"
          >
            {{ param.name }}
          </n-tag>
          <n-text v-if="headerTemplateParams.length > 3" depth="3" style="font-size: 12px">
            +{{ headerTemplateParams.length - 3 }} indivual
          </n-text>
        </n-space>

        <n-space style="margin-top: 8px">
          <n-button type="success" size="small" @click="applyTemplate">
            <template #icon>
              <n-icon><sparkle-icon /></n-icon>
            </template>
            Apply template
          </n-button>
          <n-button size="small" @click="dismissRecommend">Configure manually later</n-button>
        </n-space>
      </n-space>
    </n-alert>

    <!-- Request header configuration -->
    <DynamicParameterEditor
      :model-value="modelValue.headers || []"
      parameter-type="header"
      title="Request header configuration"
      add-button-text="Add request header"
      key-placeholder="Header name（like：Content-Type）"
      value-placeholder="header value（like：application/json）"
      :current-api-info="currentApiInfo"
      :current-component-id="componentId"
      @update:model-value="updateHeaders"
    />
  </div>
</template>

<style scoped>
.http-config-step2 {
  width: 100%;
  padding: 12px;
}
</style>
