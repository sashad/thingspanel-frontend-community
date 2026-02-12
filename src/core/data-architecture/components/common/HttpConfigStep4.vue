<!--
  HTTPConfiguration section4step - Pre-request script configuration component
  useSimpleScriptEditorConfigure pre-request processing script
-->
<script setup lang="ts">
/**
 * HttpConfigStep4 - HTTPPre-request script configuration steps
 * Used to modify dynamically before sending the requestURL、Request headers and parameters
 */

import { useI18n } from 'vue-i18n'
import type { HttpConfig } from '@/core/data-architecture/types/http-config'
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'

interface Props {
  /** HTTPConfiguration data */
  modelValue: Partial<HttpConfig>
  /** current componentID，for property binding（reserved） */
  componentId?: string
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

/**
 * Update pre-request script
 */
const updatePreRequestScript = (script: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    preRequestScript: script
  })
}
</script>

<template>
  <div class="http-config-step4">
    <div class="script-editor-section">
      <SimpleScriptEditor
        :model-value="modelValue.preRequestScript || ''"
        template-category="http-pre-request"
        placeholder="Pre-request processing script"
        height="300px"
        @update:model-value="updatePreRequestScript"
      />
    </div>
  </div>
</template>

<style scoped>
.http-config-step4 {
  width: 100%;
  padding: 12px;
}

.script-editor-section {
  min-height: 280px;
}
</style>
