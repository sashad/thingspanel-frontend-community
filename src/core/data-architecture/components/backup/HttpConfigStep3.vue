<!--
  HTTPConfiguration section3step - Parameter configuration component
  Configure query parameters and path parameters
-->
<script setup lang="ts">
/**
 * HttpConfigStep3 - HTTPParameter configuration steps
 * Configuration containing query parameters and path parameters
 */

import { NText } from 'naive-ui'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import DynamicParameterEditor from '@/core/data-architecture/components/common/DynamicParameterEditor.vue'

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
</script>

<template>
  <div class="http-config-step3">
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
        💡 hint：After selecting the internal interface，available above"Add query parameters"Click on the drop-down menu"✨ Application interface template"Automatically import prefabricated parameters
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
