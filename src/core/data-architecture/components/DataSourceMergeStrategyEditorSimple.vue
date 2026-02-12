<script setup lang="ts">
/**
 * Data Source Merge Strategy Editor - Simplified version
 * Used to configure the merging method of multiple data items in the data source
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

// Merge strategy type definition
interface MergeStrategy {
  type: 'select' | 'array' | 'object' | 'script'
  script?: string
  selectedIndex?: number // whentypefor'select'hour，User-selected data item index
}

// Props Interface definition
interface Props {
  /** data sourceID */
  dataSourceId: string
  /** Current merge strategy */
  modelValue?: MergeStrategy
  /** Number of data items */
  dataItemCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ type: 'object' }),
  dataItemCount: 1
})

const emit = defineEmits<{
  'update:modelValue': [value: MergeStrategy]
}>()

// internationalization
const { t } = useI18n()

// Responsive data
const currentStrategy = ref<MergeStrategy>({ ...props.modelValue })
// 🔥 Brand new solution：Deduplication mechanism based on content hashing
const lastEmittedHash = ref('')
const isUpdatingFromProps = ref(false)

// Pre-made merge strategy options
const mergeStrategyOptions = [
  {
    value: 'select',
    label: 'Choose one',
    description: 'User selects specific data item',
    icon: '🎯'
  },
  {
    value: 'object',
    label: 'Object merge',
    description: 'Object.assign({}, item1, item2, ...)',
    icon: '🔗'
  },
  {
    value: 'array',
    label: 'Array composition',
    description: '[item1, item2, item3]',
    icon: '📋'
  },
  {
    value: 'script',
    label: 'custom script',
    description: 'Fully customizable merge logic',
    icon: '⚙️'
  }
]

// Computed properties
const previewText = computed(() => {
  const count = props.dataItemCount

  switch (currentStrategy.value.type) {
    case 'select':
      if (count <= 1) {
        return 'Return unique data items'
      } else {
        const selectedIndex = currentStrategy.value.selectedIndex ?? 0
        return `Select the${selectedIndex + 1}item(common${count}item)`
      }
    case 'object':
      return count <= 1 ? 'Single object output' : `Object merge(${count}item)`
    case 'array':
      return count <= 1 ? 'Single item array output' : `Array composition(${count}item)`
    case 'script':
      return count <= 1 ? 'Script processing单item' : `Script processing(${count}item)`
    default:
      return ''
  }
})

// 🔥 Brand new solution：Intelligent deduplication based on content hashing
watch(
  currentStrategy,
  newValue => {
    if (!isUpdatingFromProps.value) {
      // Compute content hash，Avoid duplication of the same contentemit
      const contentHash = JSON.stringify(newValue)
      if (contentHash !== lastEmittedHash.value) {
        lastEmittedHash.value = contentHash
        emit('update:modelValue', { ...newValue })
      } else {
      }
    }
  },
  { deep: true }
)

// 🔥 Brand new solution：intelligentpropssynchronous，Judgment based on content hash
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      const newContentHash = JSON.stringify(newValue)
      const currentContentHash = JSON.stringify(currentStrategy.value)

      if (newContentHash !== currentContentHash) {
        isUpdatingFromProps.value = true
        currentStrategy.value = { ...newValue }
        lastEmittedHash.value = newContentHash // Update hash，Prevent loops

        // in the nexttickclear flag
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      } else {
        if (process.env.NODE_ENV === 'development') {
        }
      }
    }
  },
  { deep: true }
)

// Choose a merge strategy
const selectMergeStrategy = (strategyType: string) => {
  currentStrategy.value.type = strategyType as any

  if (strategyType === 'script') {
    currentStrategy.value.script =
      currentStrategy.value.script || '// items is an array of data items，Return the merged data\nreturn items[0] || {}'
  }

  if (strategyType === 'select') {
    // The default selection is1item（index0）
    currentStrategy.value.selectedIndex = currentStrategy.value.selectedIndex ?? 0
  }
}
</script>

<template>
  <div class="data-source-merge-strategy-editor-simple">
    <!-- compact title line -->
    <div class="strategy-header">
      <n-space align="center" justify="space-between" size="small">
        <n-text strong style="font-size: 13px">{{ dataSourceId }} - merge strategy</n-text>
        <n-space align="center" size="small">
          <n-tag type="info" size="tiny">{{ dataItemCount }}item</n-tag>
          <n-text depth="3" style="font-size: 11px">{{ previewText }}</n-text>
        </n-space>
      </n-space>
    </div>

    <!-- Merge strategy selection -->
    <n-space align="center" justify="space-between" style="margin-top: 8px">
      <n-select
        :value="currentStrategy.type"
        size="small"
        style="flex: 1; max-width: 150px"
        :options="
          mergeStrategyOptions.map(opt => ({
            label: `${opt.icon} ${opt.label}`,
            value: opt.value
          }))
        "
        @update:value="selectMergeStrategy"
      />

      <!-- Select data item(When the strategy isselectand when there are multiple) -->
      <n-select
        v-if="currentStrategy.type === 'select' && dataItemCount > 1"
        :value="currentStrategy.selectedIndex ?? 0"
        size="small"
        style="width: 100px"
        :options="
          Array.from({ length: dataItemCount }, (_, i) => ({
            label: `No.${i + 1}item`,
            value: i
          }))
        "
        @update:value="
          val => {
            currentStrategy.selectedIndex = val
          }
        "
      />
    </n-space>

    <!-- Script editing area -->
    <div v-if="currentStrategy.type === 'script'" style="margin-top: 8px">
      <n-input
        v-model:value="currentStrategy.script"
        type="textarea"
        placeholder="// itemsarray，Return merged results&#10;return items[0] || {}"
        :rows="4"
        size="small"
        style="font-family: 'Consolas', monospace; font-size: 11px"
      />
    </div>
  </div>
</template>

<style scoped>
.data-source-merge-strategy-editor-simple {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px;
  background: var(--card-color);
}

.strategy-header {
  padding: 6px 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
</style>
