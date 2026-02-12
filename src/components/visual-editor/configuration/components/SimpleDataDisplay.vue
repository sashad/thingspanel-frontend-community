<template>
  <div class="simple-data-display">
    <n-space vertical size="small">
      <n-text strong style="font-size: 12px; color: var(--text-color-2)">
        {{ $t('visualEditor.dataDisplayTest') }}
      </n-text>

      <!-- Current data source data -->
      <div class="data-section">
        <n-text depth="2" style="font-size: 11px">{{ $t('visualEditor.currentDataSourceData') }}:</n-text>
        <n-code
          :code="objectDataDisplay"
          language="json"
          :show-line-numbers="false"
          style="font-size: 11px; max-height: 100px; overflow-y: auto"
        />
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * Simple data display test component
 * For testing dual data sources in configuration panel：Object types and array types
 */

import { computed } from 'vue'
import { NSpace, NText, NCode } from 'naive-ui'
import { $t } from '@/locales'

interface Props {
  objectData?: any // Object type data source
  arrayData?: any // Array type data source
}

const props = withDefaults(defineProps<Props>(), {
  objectData: null,
  arrayData: null
})

// Format object data display
const objectDataDisplay = computed(() => {
  const data = props.objectData || props.arrayData
  if (!data || data === null || data === undefined) {
    return 'No data yet'
  }

  // Check if it is an empty object
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    return 'No data yet'
  }
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
})

// Format array data display
const arrayDataDisplay = computed(() => {
  // If the incoming data is an array type or there is data, it will be displayed.，No distinction between types
  const data = props.arrayData || props.objectData
  if (!data) return 'No data yet'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
})
</script>

<style scoped>
.simple-data-display {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
}

.data-section {
  margin-bottom: 8px;
}
</style>
