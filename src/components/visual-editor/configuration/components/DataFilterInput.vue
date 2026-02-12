<template>
  <div class="data-filter-input">
    <n-form-item>
      <template #label>
        <n-space size="small" align="center">
          <span>Data filtering path</span>
          <n-tooltip>
            <template #trigger>
              <n-icon size="14" style="color: var(--text-color-3); cursor: help">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                  <path
                    d="m9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="m12,17.02v.01"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </n-icon>
            </template>
            <div style="max-width: 250px; font-size: 12px">
              <div><strong>Filter path syntax：</strong></div>
              <div style="margin-top: 4px">
                •
                <code>$</code>
                or blank：Use complete data
                <br />
                •
                <code>$.data</code>
                ：extract data Field
                <br />
                •
                <code>$.data.list</code>
                ：extract data.list array
                <br />
                •
                <code>$.users[0]</code>
                ：extract users first item in array
                <br />
                •
                <code>$.result.items</code>
                ：Extract nested objects
              </div>
            </div>
          </n-tooltip>
        </n-space>
      </template>
      <n-input
        :value="filterPath"
        placeholder="$ (Use complete data) or $.data.list (filter path)"
        clearable
        @update:value="handlePathChange"
      >
        <template #prefix>
          <n-icon size="16" style="color: var(--text-color-3)">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 6h18l-2 13H5L3 6z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16 10a4 4 0 0 1-8 0"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </n-icon>
        </template>
      </n-input>
    </n-form-item>

    <!-- Simplified status prompts -->
    <div v-if="filterPath && !filterError" class="filter-status">
      <n-tag size="tiny" type="success">✓ Path is valid</n-tag>
    </div>

    <!-- Error message -->
    <div v-if="filterError" class="filter-error">
      <n-alert type="warning" size="small" :show-icon="false">
        <template #header>
          <span style="font-size: 12px">⚠️ Path error</span>
        </template>
        <div style="font-size: 11px">{{ filterError }}</div>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Generic data filter component
 * support JSONPath Grammarly filtering complex data structures
 */

import { ref, watch, computed } from 'vue'
import { NFormItem, NInput, NIcon, NTooltip, NSpace, NTag, NAlert } from 'naive-ui'

interface Props {
  /** raw data，Used to preview filter results */
  sourceData?: any
  /** Current filter path */
  modelValue?: string
  /** Whether to disable */
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'filter-change', filteredData: any, isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  sourceData: null,
  modelValue: '',
  disabled: false
})

const emit = defineEmits<Emits>()

// Responsive state
const filterPath = ref(props.modelValue || '')
const filterError = ref('')

// Listen for external changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== filterPath.value) {
      filterPath.value = newValue || ''
    }
  }
)

/**
 * Apply data filter
 * @param data raw data
 * @param path filter path
 */
const applyDataFilter = (data: any, path: string): { result: any; error: string } => {
  // If the path is empty or is $，Return complete data
  if (!path || path === '$') {
    return { result: data, error: '' }
  }

  // if the data is empty，return null
  if (data === null || data === undefined) {
    return { result: null, error: '' }
  }

  try {
    // simple JSONPath accomplish
    let current = data

    // Remove the beginning of $ symbol
    const cleanPath = path.startsWith('$') ? path.substring(1) : path

    if (cleanPath === '') {
      return { result: current, error: '' }
    }

    // Split path by points，But to deal with array indexing
    const parts = parseJsonPath(cleanPath)

    for (const part of parts) {
      if (current === null || current === undefined) {
        return { result: null, error: `path "${part}" The data is empty` }
      }

      // Handle array index
      if (part.includes('[') && part.includes(']')) {
        const [field, indexPart] = part.split('[')
        const index = parseInt(indexPart.replace(']', ''), 10)

        if (field) {
          current = current[field]
          if (current === undefined) {
            return { result: null, error: `Field "${field}" does not exist` }
          }
        }

        if (!Array.isArray(current)) {
          return { result: null, error: `${field || 'data'} Not an array type` }
        }

        if (index < 0 || index >= current.length) {
          return { result: null, error: `array index ${index} out of range (0-${current.length - 1})` }
        }

        current = current[index]
      } else {
        // Normal field access
        if (typeof current !== 'object' || current === null) {
          return { result: null, error: `Cannot access field on non-object type "${part}"` }
        }

        if (!(part in current)) {
          return { result: null, error: `Field "${part}" does not exist` }
        }

        current = current[part]
      }
    }

    return { result: current, error: '' }
  } catch (error) {
    return { result: null, error: `Path parsing error: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * parse JSONPath，Handle nested structures
 */
const parseJsonPath = (path: string): string[] => {
  const parts: string[] = []
  let current = ''
  let inBracket = false

  for (let i = 0; i < path.length; i++) {
    const char = path[i]

    if (char === '[') {
      inBracket = true
      current += char
    } else if (char === ']') {
      inBracket = false
      current += char
    } else if (char === '.' && !inBracket) {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) {
    parts.push(current)
  }

  return parts.filter(part => part !== '')
}

/**
 * Handling path changes
 */
const handlePathChange = (value: string) => {
  filterPath.value = value
  emit('update:modelValue', value)

  // Apply filters and update results
  updateFilter()
}

/**
 * Update filter results
 */
const updateFilter = () => {
  if (props.sourceData === null || props.sourceData === undefined) {
    filterError.value = ''
    emit('filter-change', null, true)
    return
  }

  const { result, error } = applyDataFilter(props.sourceData, filterPath.value)

  filterError.value = error

  const isValid = error === ''
  emit('filter-change', result, isValid)
}

// Monitor changes in raw data，Automatically update filter results
watch(() => props.sourceData, updateFilter, { immediate: true, deep: true })
watch(() => filterPath.value, updateFilter)
</script>

<style scoped>
.data-filter-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-status {
  margin-top: 4px;
}

.filter-error {
  margin-top: 8px;
}
</style>
