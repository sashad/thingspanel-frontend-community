<!--
  HTTPConfiguration section3step - Parameter configuration component
  Configure query parameters and path parameters
  ✨ optimization：Add interface template intelligent recommendation card
-->
<script setup lang="ts">
/**
 * HttpConfigStep3 - HTTPParameter configuration steps（UIOptimized version）
 * Configuration containing query parameters and path parameters
 *
 * 🎯 optimization3：Intelligent recommendation of interface templates
 * - DetectioncurrentApiInfoAre there pre-made query parameters?
 * - Show smart recommendation cards
 * - Highlight after applying template
 */

import { ref, computed, watch } from 'vue'
import { NText } from 'naive-ui'
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
 * 🎯 optimization3：Check if a query parameter template is available
 */
const hasQueryParamTemplate = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return false

  // Exclude path parameters，Show only query parameters
  const pathParamNames = props.currentApiInfo.pathParamNames || []
  const queryParams = props.currentApiInfo.commonParams.filter(
    (param: any) => !pathParamNames.includes(param.name) && param.type !== 'header'
  )

  return queryParams.length > 0
})

/**
 * 🎯 optimization3：Get query parameter template
 */
const queryParamTemplates = computed(() => {
  if (!props.currentApiInfo || !props.currentApiInfo.commonParams) return []

  const pathParamNames = props.currentApiInfo.pathParamNames || []
  return props.currentApiInfo.commonParams.filter(
    (param: any) => !pathParamNames.includes(param.name) && param.type !== 'header'
  )
})

/**
 * 🎯 optimization3：monitorcurrentApiInfochange，Automatically display recommendation cards
 */
watch(
  () => props.currentApiInfo,
  newValue => {
    if (newValue && hasQueryParamTemplate.value && !hasAppliedTemplate.value) {
      showTemplateRecommend.value = true
    }
  },
  { immediate: true }
)

/**
 * 🎯 optimization3：Application interface template
 */
const applyTemplate = () => {
  if (!queryParamTemplates.value || queryParamTemplates.value.length === 0) return

  // Generate template parameters
  const templateParams: EnhancedParameter[] = queryParamTemplates.value.map((param: any) => ({
    key: param.name,
    value: param.example || param.defaultValue || '',
    enabled: true,
    isDynamic: false,
    valueMode: 'manual',
    selectedTemplate: 'manual',
    variableName: '',
    description: param.description || `${param.name}query parameters`,
    dataType: param.type === 'number' ? 'number' : param.type === 'boolean' ? 'boolean' : 'string',
    defaultValue: param.example || param.defaultValue,
    _id: `param_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }))

  // Merge into existing parameters（avoid duplication）
  const existingKeys = new Set((props.modelValue.params || []).map(p => p.key))
  const newParams = templateParams.filter(p => !existingKeys.has(p.key))

  if (newParams.length > 0) {
    const updatedParams = [...(props.modelValue.params || []), ...newParams]
    emit('update:modelValue', { ...props.modelValue, params: updatedParams })

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
</script>

<template>
  <div class="http-config-step3">
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
          <n-text type="success" strong>{{ queryParamTemplates.length }}</n-text> pre-made query parameters
        </n-text>

        <n-space size="small" style="flex-wrap: wrap">
          <n-tag
            v-for="param in queryParamTemplates.slice(0, 4)"
            :key="param.name"
            type="success"
            size="small"
            :bordered="false"
          >
            {{ param.name }}
            <span v-if="param.required" style="color: var(--error-color); margin-left: 2px">*</span>
          </n-tag>
          <n-text v-if="queryParamTemplates.length > 4" depth="3" style="font-size: 12px">
            +{{ queryParamTemplates.length - 4 }} indivual
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

    <!-- Query parameter configuration -->
    <DynamicParameterEditor
      :model-value="modelValue.params || []"
      parameter-type="query"
      title="Query parameter configuration"
      add-button-text="Add query parameters"
      key-placeholder="Parameter name（like：deviceId）"
      value-placeholder="Parameter value（like：DEV001）"
      :current-api-info="currentApiInfo"
      :current-component-id="componentId"
      @update:model-value="
        updatedParams => {
          emit('update:modelValue', { ...modelValue, params: updatedParams })
        }
      "
    />

    <!-- Prompt message -->
    <div style="margin-top: 16px; padding: 12px; background: var(--info-color-suppl); border-radius: 6px">
      <n-text depth="3" style="font-size: 12px">
        💡 hint：After selecting the internal interface，If there are pre-made parameters, recommended cards will be automatically displayed.。Also available in"Add query parameters"Select from the drop-down menu"✨ Application interface template"import
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.http-config-step3 {
  width: 100%;
  padding: 12px;
}

.param-section {
  margin-bottom: 16px;
}
</style>
