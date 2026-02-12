<!--
  Four ways to add parameters to demonstrate components
  for demonstration and testingDynamicParameterEditorof4Parameter addition function
-->
<script setup lang="ts">
/**
 * FourParameterTypesDemo - Four ways to add parameters to demonstrate components
 * Demo manual input、Card attribute binding、Equipment selection、Four methods of interface templates
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NSpace, NText, NDivider, NButton } from 'naive-ui'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

const { t } = useI18n()

/**
 * Four types of parameter demonstration data
 */
const headerParams = ref<EnhancedParameter[]>([])
const queryParams = ref<EnhancedParameter[]>([])
const pathParams = ref<EnhancedParameter[]>([])

/**
 * Reset all parameters
 */
const resetAllParams = () => {
  headerParams.value = []
  queryParams.value = []
  pathParams.value = []
}

/**
 * Get parameter summary information
 */
const getParamsSummary = (params: EnhancedParameter[]) => {
  if (params.length === 0) return 'No parameters yet'

  return params
    .map(param => {
      const template = param.selectedTemplate || 'manual'
      const templateNames: Record<string, string> = {
        manual: 'Manual entry',
        'property-binding': 'Property binding',
        'device-dispatch-selector': 'Equipment selection',
        'interface-template': 'interface template'
      }

      return `${param.key}: ${param.value || 'not set'} (${templateNames[template] || template})`
    })
    .join(', ')
}
</script>

<template>
  <div class="four-parameter-types-demo">
    <n-card title="Demonstration of four ways to add parameters" size="small">
      <template #header-extra>
        <n-button size="small" @click="resetAllParams">reset all</n-button>
      </template>

      <n-space vertical :size="24">
        <!-- Request header parameters -->
        <div>
          <n-text strong>1. Request header parameters (Header Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            support：Manual entry、Property binding、interface template、Content type template、Authentication type template
          </n-text>
          <DynamicParameterEditor
            v-model="headerParams"
            parameter-type="header"
            title=""
            add-button-text="Add request header parameters"
            key-placeholder="Headername"
            value-placeholder="Headervalue"
            :max-parameters="3"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            Current parameters：{{ getParamsSummary(headerParams) }}
          </n-text>
        </div>

        <n-divider />

        <!-- query parameters -->
        <div>
          <n-text strong>2. query parameters (Query Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            support：Manual entry、Property binding、interface template、boolean template、Equipment selection
          </n-text>
          <DynamicParameterEditor
            v-model="queryParams"
            parameter-type="query"
            title=""
            add-button-text="Add query parameters"
            key-placeholder="Parameter name"
            value-placeholder="Parameter value"
            :max-parameters="5"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            Current parameters：{{ getParamsSummary(queryParams) }}
          </n-text>
        </div>

        <n-divider />

        <!-- path parameters -->
        <div>
          <n-text strong>3. path parameters (Path Parameters)</n-text>
          <n-text depth="3" style="display: block; margin: 8px 0; font-size: 12px">
            support：Manual entry、Property binding、interface template、Equipment selection（limit1parameters）
          </n-text>
          <DynamicParameterEditor
            v-model="pathParams"
            parameter-type="path"
            title=""
            add-button-text="Add path parameters"
            key-placeholder="path variable name"
            value-placeholder="path variable value"
            :max-parameters="1"
          />
          <n-text depth="3" style="font-size: 11px; margin-top: 8px; display: block">
            Current parameters：{{ getParamsSummary(pathParams) }}
          </n-text>
        </div>
      </n-space>
    </n-card>

    <!-- Instructions for use -->
    <n-card title="Instructions for use" size="small" style="margin-top: 16px">
      <n-space vertical :size="8">
        <div>
          <n-text strong>1. Manual entry：</n-text>
          <n-text depth="3">Directly enter fixed parameter values，Works with immutable static parameters</n-text>
        </div>
        <div>
          <n-text strong>2. Card attribute binding：</n-text>
          <n-text depth="3">Bind to component properties，Dynamically obtain values ​​at runtime，Works with dynamic parameters</n-text>
        </div>
        <div>
          <n-text strong>3. Equipment selection：</n-text>
          <n-text depth="3">Select device and metric from device list，Automatically generate parameter values</n-text>
        </div>
        <div>
          <n-text strong>4. interface template：</n-text>
          <n-text depth="3">Use predefined parameter templates，Such as equipmentID、userIDand other commonly used parameters</n-text>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.four-parameter-types-demo {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>
