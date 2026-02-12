<!--
  HTTPConfiguration section2step - Request header configuration component
  useDynamicParameterEditorConfigurationHTTPRequest header
-->
<script setup lang="ts">
/**
 * HttpConfigStep2 - HTTPRequest header configuration steps
 * Configure request headers using the universal dynamic parameter editor
 */

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
    <!-- Default request header prompt box -->
    <n-alert
      v-if="showDefaultHeadersAlert && isInternalApi"
      type="info"
      closable
      style="margin-bottom: 16px"
      @close="dismissAlert"
    >
      <template #header>
        <n-space align="center">
          <span>✨ It is recommended to add a default request header</span>
        </n-space>
      </template>

      <n-space vertical size="small">
        <n-text depth="3">
          Internal interfaces typically require the following request headers：
          <n-text type="info" strong>Accept: application/json</n-text>
        </n-text>

        <n-space>
          <n-button type="primary" size="small" @click="applyDefaultHeaders">
            Add default request header
          </n-button>
          <n-button size="small" @click="dismissAlert">
            Manual configuration
          </n-button>
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
