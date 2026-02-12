<script setup lang="ts">
/**
 * Data Source Merge Strategy Editor
 * Used to configure the merging method of multiple data items in the data source
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Merge strategy type definition
interface MergeStrategy {
  type: 'object' | 'array' | 'script' | 'condition'
  script?: string
  description?: string
}

// Props Interface definition
interface Props {
  /** data sourceID */
  dataSourceId: string
  /** Current merge strategy */
  modelValue?: MergeStrategy
  /** Number of data items（Used to show expected effects） */
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
const showCustomScript = ref(false)

// Pre-made merge strategy options
const mergeStrategyOptions = [
  {
    value: 'object',
    label: 'Shallow merge of objects',
    description: 'Object.assign({}, item1, item2, ...) - Combine the properties of all data items into one object',
    example: '{ ...item1, ...item2, ...item3 }',
    icon: '🔗'
  },
  {
    value: 'array',
    label: 'form an array',
    description: '[item1, item2, item3] - Group all data items into an array',
    example: '[data1, data2, data3]',
    icon: '📝'
  },
  {
    value: 'condition',
    label: 'Condition selection',
    description: 'Select appropriate data items based on preset conditions',
    example: 'Select the first available / Select the largest data set',
    icon: '⚖️'
  },
  {
    value: 'script',
    label: 'custom script',
    description: 'Use customJavaScriptScript handling merge logic',
    example: 'return items.filter(...).map(...)',
    icon: '⚙️'
  }
]

// Conditional selection strategy options
const conditionStrategyOptions = [
  {
    value: 'first-available',
    label: 'Select the first available',
    script: 'return items.find(item => item !== null && item !== undefined) || {}'
  },
  {
    value: 'largest-dataset',
    label: 'Select the largest data set',
    script: `return items.reduce((largest, current) => {
  const currentSize = Array.isArray(current) ? current.length : Object.keys(current || {}).length
  const largestSize = Array.isArray(largest) ? largest.length : Object.keys(largest || {}).length
  return currentSize > largestSize ? current : largest
}, {})`
  },
  {
    value: 'merge-arrays',
    label: 'Array expansion and merging',
    script: `return items.reduce((result, item) => {
  if (Array.isArray(item)) {
    return [...result, ...item]
  } else if (item) {
    return [...result, item]
  }
  return result
}, [])`
  }
]

// Computed properties
const isScriptStrategy = computed(() => currentStrategy.value.type === 'script' || showCustomScript.value)

const previewText = computed(() => {
  const count = props.dataItemCount
  if (count <= 1) {
    return 'single data item，No need to merge'
  }

  switch (currentStrategy.value.type) {
    case 'object':
      return `merge ${count} attributes of a data item to an object`
    case 'array':
      return `Will ${count} data items form an array`
    case 'condition':
      return `According to the conditions from ${count} Select from data items`
    case 'script':
      return `Use custom script processing ${count} data items`
    default:
      return ''
  }
})

// Listen for changes and notify the parent component
watch(
  currentStrategy,
  newValue => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// Choose a pre-made merge strategy
const selectMergeStrategy = (strategyType: string) => {
  currentStrategy.value.type = strategyType as any

  if (strategyType === 'script') {
    showCustomScript.value = true
    currentStrategy.value.script = currentStrategy.value.script || '// Custom merge logic\nreturn items[0] || {}'
  } else {
    showCustomScript.value = false
    currentStrategy.value.script = undefined
  }
}

// Select condition strategy
const selectConditionStrategy = (option: any) => {
  currentStrategy.value.type = 'script'
  currentStrategy.value.script = option.script
  currentStrategy.value.description = option.label
}

// Preview merge effect
const previewMergeResult = () => {
  // simulated data items
  const mockItems = [
    { name: 'data1', value: 100 },
    { name: 'data2', value: 200 },
    { name: 'data3', value: 300 }
  ]

  try {
    switch (currentStrategy.value.type) {
      case 'object':
        return Object.assign({}, ...mockItems)
      case 'array':
        return mockItems
      case 'script':
        if (currentStrategy.value.script) {
          const func = new Function('items', currentStrategy.value.script)
          return func(mockItems)
        }
        break
    }
  } catch (error) {
    return `Script execution error: ${error.message}`
  }

  return mockItems[0]
}
</script>

<template>
  <div class="data-source-merge-strategy-editor">
    <!-- title and description -->
    <div class="strategy-header">
      <n-space align="center" justify="space-between">
        <div>
          <n-text strong>{{ dataSourceId }} merge strategy</n-text>
          <n-text depth="3" style="margin-left: 8px">
            {{ previewText }}
          </n-text>
        </div>
        <n-tag v-if="dataItemCount > 1" type="info" size="small">{{ dataItemCount }} data items</n-tag>
      </n-space>
    </div>

    <!-- Merge strategy selection -->
    <n-card size="small" style="margin-top: 16px">
      <template #header>
        <n-space align="center">
          <span>⚙️</span>
          <span>Merge strategy selection</span>
        </n-space>
      </template>

      <n-space vertical size="large">
        <!-- Strategy options -->
        <n-radio-group :value="currentStrategy.type" size="large" @update:value="selectMergeStrategy">
          <n-space vertical size="medium">
            <div
              v-for="option in mergeStrategyOptions"
              :key="option.value"
              class="strategy-option"
              :class="{ active: currentStrategy.type === option.value }"
            >
              <n-radio :value="option.value" size="large">
                <n-space align="center">
                  <span class="strategy-icon">{{ option.icon }}</span>
                  <div class="strategy-content">
                    <div class="strategy-title">{{ option.label }}</div>
                    <div class="strategy-description">{{ option.description }}</div>
                    <n-code class="strategy-example">{{ option.example }}</n-code>
                  </div>
                </n-space>
              </n-radio>
            </div>
          </n-space>
        </n-radio-group>

        <!-- Detailed configuration of conditional selection strategy -->
        <div v-if="currentStrategy.type === 'condition'" class="condition-strategies">
          <n-divider>Condition selection detailed configuration</n-divider>
          <n-space vertical>
            <div v-for="option in conditionStrategyOptions" :key="option.value" class="condition-option">
              <n-button
                secondary
                type="primary"
                style="width: 100%; text-align: left"
                @click="selectConditionStrategy(option)"
              >
                <n-space justify="space-between" style="width: 100%">
                  <span>{{ option.label }}</span>
                  <span>→</span>
                </n-space>
              </n-button>
            </div>
          </n-space>
        </div>

        <!-- Custom script editing -->
        <div v-if="isScriptStrategy" class="custom-script-section">
          <n-divider>Custom script editing</n-divider>

          <n-space vertical>
            <n-alert type="info" :show-icon="false">
              <template #icon><span>💡</span></template>
              <div>
                <strong>Script description</strong>
                <ul style="margin: 8px 0; padding-left: 20px">
                  <li>
                    <code>items</code>
                    : array of data items，Contains all processed data items
                  </li>
                  <li>
                    <code>return</code>
                    : Return the final merged data
                  </li>
                  <li>Support allJavaScriptSyntax and common methods</li>
                </ul>
              </div>
            </n-alert>

            <n-input
              v-model:value="currentStrategy.script"
              type="textarea"
              placeholder="// Custom merge logic&#10;// items Parameters contain all data items&#10;return items[0] || {}"
              :rows="8"
              style="font-family: 'Consolas', 'Monaco', monospace"
            />

            <!-- Script preview -->
            <n-card size="small" title="🔍 Preview effect">
              <n-code
                :code="JSON.stringify(previewMergeResult(), null, 2)"
                language="json"
                style="max-height: 200px; overflow-y: auto"
              />
            </n-card>
          </n-space>
        </div>
      </n-space>
    </n-card>

    <!-- Action button -->
    <n-space justify="end" style="margin-top: 16px">
      <n-button @click="previewMergeResult">🔍 Preview effect</n-button>
      <n-button type="primary" @click="$emit('update:modelValue', currentStrategy)">✅ Confirm strategy</n-button>
    </n-space>
  </div>
</template>

<style scoped>
.data-source-merge-strategy-editor {
  padding: 16px;
}

.strategy-header {
  padding: 12px 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.strategy-option {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  cursor: pointer;
}

.strategy-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-hover);
}

.strategy-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color-pressed);
}

.strategy-icon {
  font-size: 24px;
  margin-right: 12px;
}

.strategy-content {
  flex: 1;
}

.strategy-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-color);
}

.strategy-description {
  font-size: 13px;
  color: var(--text-color-2);
  margin-bottom: 8px;
  line-height: 1.4;
}

.strategy-example {
  font-size: 12px;
  background: var(--code-color);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.condition-strategies {
  background: var(--body-color);
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.condition-option {
  margin-bottom: 8px;
}

.custom-script-section {
  background: var(--body-color);
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}
</style>
