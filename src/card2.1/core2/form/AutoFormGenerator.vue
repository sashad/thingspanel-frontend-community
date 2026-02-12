<template>
  <div class="auto-form-generator">
    <!-- based on TS Configured form generation -->
    <div v-if="mode === 'ts-only' && tsConfig" class="ts-config-form">
      <n-space vertical>
        <!-- Group display -->
        <div v-for="group in groupedFields" :key="group.name" class="form-group">
          <n-card v-if="group.label" size="small" class="group-card">
            <template #header>
              <span class="group-title">{{ group.label }}</span>
            </template>
            <n-space vertical :size="16">
              <div v-for="field in group.fields" :key="field.field" class="form-field">
                <FormField
                  :setting="field"
                  :model-value="getFieldValue(field.field)"
                  :readonly="readonly"
                  @update:model-value="updateFieldValue(field.field, $event)"
                />
              </div>
            </n-space>
          </n-card>
          <!-- Ungrouped fields -->
          <n-space v-else vertical :size="16">
            <div v-for="field in group.fields" :key="field.field" class="form-field">
              <FormField
                :setting="field"
                :model-value="getFieldValue(field.field)"
                :readonly="readonly"
                @update:model-value="updateFieldValue(field.field, $event)"
              />
            </div>
          </n-space>
        </div>
      </n-space>
    </div>

    <!-- based on Vue Component form rendering -->
    <div v-else-if="mode === 'vue-only' && vueConfig" class="vue-config-form">
      <component
        :is="vueConfig"
        v-model="formData"
        :readonly="readonly"
        @change="handleFormChange"
      />
    </div>

    <!-- blend mode -->
    <div v-else-if="mode === 'hybrid'" class="hybrid-config-form">
      <n-space vertical>
        <!-- Vue Components section -->
        <n-card v-if="vueConfig" title="Advanced configuration" size="small">
          <component
            :is="vueConfig"
            v-model="formData"
            :readonly="readonly"
            @change="handleFormChange"
          />
        </n-card>

        <!-- TS Configuration section -->
        <n-card v-if="tsConfig" title="Basic configuration" size="small">
          <n-space vertical :size="16">
            <div v-for="field in tsConfig.fields" :key="field.field" class="form-field">
              <FormField
                :setting="field"
                :model-value="getFieldValue(field.field)"
                :readonly="readonly"
                @update:model-value="updateFieldValue(field.field, $event)"
              />
            </div>
          </n-space>
        </n-card>
      </n-space>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <n-empty description="No configuration items yet" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AutoFormGenerator - Automatic form builder
 * according to TS configure or Vue Component configuration automatically generates configuration forms
 * Support multiple modes：ts-only, vue-only, hybrid
 */

import { ref, computed, watch, onMounted } from 'vue'
import { NSpace, NCard, NEmpty } from 'naive-ui'
import type { Component } from 'vue'
import FormField from './FormField.vue'
import type { TSConfig, ConfigMode, ConfigValues, Setting, SettingGroup } from '@/card2.1/types/setting-config'

interface Props {
  // TS Configuration
  tsConfig?: TSConfig
  // Vue Component configuration
  vueConfig?: Component
  // configuration mode
  mode?: ConfigMode
  // current value
  modelValue?: ConfigValues
  // Is it read-only?
  readonly?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: ConfigValues): void
  (event: 'change', value: ConfigValues): void
  (event: 'validate', result: { valid: boolean; errors: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'ts-only',
  modelValue: () => ({}),
  readonly: false
})

const emit = defineEmits<Emits>()

// form data
const formData = ref<ConfigValues>({})

// grouping field
const groupedFields = computed(() => {
  if (!props.tsConfig?.fields) return []

  const groups = props.tsConfig.groups || []
  const fields = props.tsConfig.fields

  // If no grouping is defined，Create default group
  if (groups.length === 0) {
    return [{
      name: 'default',
      label: '',
      fields: fields
    }]
  }

  // Organize fields according to groups
  const result: Array<{ name: string; label: string; fields: Setting[] }> = []

  // Add defined grouping
  groups.forEach(group => {
    const groupFields = fields.filter(field =>
      group.fields.includes(field.field)
    )
    if (groupFields.length > 0) {
      result.push({
        name: group.name,
        label: group.label,
        fields: groupFields
      })
    }
  })

  // Add ungrouped fields
  const groupedFieldNames = groups.flatMap(g => g.fields)
  const ungroupedFields = fields.filter(field =>
    !groupedFieldNames.includes(field.field)
  )

  if (ungroupedFields.length > 0) {
    result.push({
      name: 'ungrouped',
      label: 'Other settings',
      fields: ungroupedFields
    })
  }

  return result
})

// Get field value
const getFieldValue = (fieldPath: string) => {
  return getNestedValue(formData.value, fieldPath)
}

// Update field value
const updateFieldValue = (fieldPath: string, value: unknown) => {
  setNestedValue(formData.value, fieldPath, value)
  emit('update:modelValue', { ...formData.value })
  emit('change', { ...formData.value })
}

// Handle form changes
const handleFormChange = (newData: ConfigValues) => {
  formData.value = { ...formData.value, ...newData }
  emit('update:modelValue', formData.value)
  emit('change', formData.value)
}

// Get nested attribute values
const getNestedValue = (obj: any, path: string): unknown => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// Set nested property values
const setNestedValue = (obj: any, path: string, value: unknown) => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

// form validation
const validateForm = () => {
  const errors: string[] = []
  let valid = true

  if (props.tsConfig?.fields) {
    props.tsConfig.fields.forEach(field => {
      const value = getFieldValue(field.field)

      // Required verification
      if (field.required && (value === undefined || value === null || value === '')) {
        valid = false
        errors.push(`${field.label}is required`)
      }

      // Minimum value verification
      if (field.min !== undefined && typeof value === 'number' && value < field.min) {
        valid = false
        errors.push(`${field.label}cannot be less than${field.min}`)
      }

      // Maximum value verification
      if (field.max !== undefined && typeof value === 'number' && value > field.max) {
        valid = false
        errors.push(`${field.label}cannot be greater than${field.max}`)
      }
    })
  }

  const result = { valid, errors }
  emit('validate', result)
  return result
}

// Monitor external value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formData.value = { ...newValue }
    }
  },
  { immediate: true, deep: true }
)

// Initialized when component is mounted
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...props.modelValue }
  }
})

// Exposed verification method
defineExpose({
  validate: validateForm
})
</script>

<style scoped>
.auto-form-generator {
  width: 100%;
}

.form-group {
  margin-bottom: 16px;
}

.group-card {
  margin-bottom: 16px;
}

.group-title {
  font-weight: 500;
  color: var(--text-color-1);
}

.form-field {
  width: 100%;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.ts-config-form,
.vue-config-form,
.hybrid-config-form {
  width: 100%;
}
</style>