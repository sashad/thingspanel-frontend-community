<template>
  <div class="data-field-mapping-input">
    <!-- Field mapping configuration area -->
    <div class="field-mappings-section">
      <n-space vertical size="12">
        <!-- List of fields required by the component -->
        <div v-if="validRequiredFields && validRequiredFields.length > 0" class="required-fields-section">
          <n-text strong style="font-size: 12px; color: var(--text-color-2)">Fields required by the component</n-text>
          <n-divider style="margin: 8px 0" />

          <n-form label-placement="left" label-width="120px" size="small">
            <n-form-item v-for="field in validRequiredFields" :key="field.targetField" :label="field.targetField">
              <template #label>
                <n-space align="center" size="4">
                  <span>{{ field.targetField }}</span>
                  <n-tag v-if="field.required" type="error" size="tiny">required</n-tag>
                  <n-tag :type="getFieldTypeColor(field.type)" size="tiny">{{ field.type }}</n-tag>
                </n-space>
              </template>

              <n-space align="center" size="8" class="field-mapping-row">
                <!-- Source data path input -->
                <n-input
                  :value="getFieldSourcePath(field.targetField)"
                  placeholder="Enter source data path (like: $.data.name, items[0].value)"
                  style="flex: 1"
                  @update:value="value => updateFieldSourcePath(field.targetField, value)"
                />

                <!-- Preview value -->
                <n-tag :type="getFieldPreviewType(field.targetField)" size="small" style="min-width: 80px">
                  {{ getFieldPreview(field.targetField) }}
                </n-tag>
              </n-space>

              <!-- Field description -->
              <template v-if="field.description" #feedback>
                <n-text depth="3" style="font-size: 11px">{{ field.description }}</n-text>
              </template>
            </n-form-item>
          </n-form>
        </div>

        <!-- Custom mapping rules（Optional） -->
        <div v-if="hasCustomMappings" class="custom-mappings-section">
          <n-text strong style="font-size: 12px; color: var(--text-color-2)">Custom field mapping</n-text>
          <n-divider style="margin: 8px 0" />

          <n-form label-placement="left" label-width="100px" size="small">
            <n-form-item
              v-for="(mapping, index) in customMappings"
              :key="index"
              :label="mapping.targetField || `Customize ${index + 1}`"
            >
              <n-space align="center" size="8" class="mapping-row">
                <!-- Target field name -->
                <n-input
                  v-model:value="mapping.targetField"
                  placeholder="Custom field name"
                  style="width: 140px"
                  @input="handleMappingChange"
                />

                <!-- mapping arrow -->
                <n-icon size="16" color="var(--text-color-3)">
                  <ArrowForwardOutline />
                </n-icon>

                <!-- Source field path -->
                <n-input
                  v-model:value="mapping.sourcePath"
                  placeholder="Source data path"
                  style="flex: 1"
                  @input="handleMappingChange"
                />

                <!-- Preview value -->
                <n-tag :type="getMappingPreviewType(mapping.sourcePath)" size="small" style="min-width: 60px">
                  {{ getMappingPreview(mapping.sourcePath) }}
                </n-tag>

                <!-- delete button -->
                <n-button size="small" type="error" ghost circle @click="removeCustomMapping(index)">
                  <template #icon>
                    <n-icon>
                      <TrashOutline />
                    </n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <!-- Add custom map button -->
        <n-button type="primary" dashed size="small" block @click="addCustomMapping">
          <template #icon>
            <n-icon>
              <AddOutline />
            </n-icon>
          </template>
          Add custom field mapping
        </n-button>

        <!-- Mapping preview -->
        <div v-if="hasValidPreviewData && showPreview" class="mapping-preview">
          <n-text strong style="font-size: 12px">Mapping result preview</n-text>
          <n-divider style="margin: 6px 0" />

          <div class="preview-result">
            <n-space align="center" size="8">
              <n-tag :type="isValidMapping ? 'success' : 'warning'" size="small">
                {{ isValidMapping ? 'Mapping is valid' : 'There is a problem' }}
              </n-tag>

              <n-text depth="3" style="font-size: 12px">
                {{ Array.isArray(mappedResult) ? `array (${mappedResult.length}item)` : 'object' }}
              </n-text>
            </n-space>

            <n-code
              :code="JSON.stringify(mappedResult, null, 2)"
              language="json"
              :show-line-numbers="false"
              style="margin-top: 8px; max-height: 150px; overflow-y: auto; font-size: 11px"
            />
          </div>
        </div>

        <!-- Status prompt -->
        <div v-if="statusMessage" class="status-message">
          <n-alert :type="statusType" size="small" :show-icon="false">
            {{ statusMessage }}
          </n-alert>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Data field mapping configuration component
 * refer to SimpleDataMappingForm design ideas，Simplify implementation
 * Core functions：Map raw data fields to fields required by the component
 */

import { ref, computed, watch } from 'vue'
import { NSpace, NForm, NFormItem, NInput, NButton, NIcon, NDivider, NTag, NCode, NText, NAlert } from 'naive-ui'
import { ArrowForwardOutline, TrashOutline, AddOutline } from '@vicons/ionicons5'

// Field mapping rule interface
interface FieldMappingRule {
  targetField: string // Target field name (Fields required by the component)
  sourcePath: string // Source data path (Field path in raw data)
}

// components Props
interface Props {
  modelValue?: FieldMappingRule[] // Array of field mapping rules
  previewData?: any // Preview data，Used to display mapping results
  showPreview?: boolean // Whether to show preview
  requiredFields?: Array<{
    targetField: string // Field names required by the component
    type: 'value' | 'object' | 'array'
    required: boolean
    description?: string
  }> // List of required fields for the component definition
}

// components Emits
interface Emits {
  (e: 'update:modelValue', value: FieldMappingRule[]): void
  (e: 'mapping-change', mappedData: any): void // Mapping result change event
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  showPreview: true,
  requiredFields: () => []
})

const emit = defineEmits<Emits>()

// Responsive state
const statusMessage = ref<string>('')
const statusType = ref<'success' | 'warning' | 'error'>('success')

// Make sure the mapping rule is an array
const currentMappings = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

// Validate and filter required fields
const validRequiredFields = computed(() => {
  if (!props.requiredFields || !Array.isArray(props.requiredFields)) return []

  return props.requiredFields.filter(
    field => field && typeof field === 'object' && field.targetField && typeof field.targetField === 'string'
  )
})

// Mapping of required fields（from component definition）
const requiredFieldMappings = computed(() => {
  if (!validRequiredFields.value) return []

  return validRequiredFields.value.map(field => {
    const existingMapping = currentMappings.value.find(m => m.targetField === field.targetField)
    return {
      targetField: field.targetField,
      sourcePath: existingMapping?.sourcePath || '',
      required: field.required,
      type: field.type,
      description: field.description
    }
  })
})

// Custom mapping（Additional added by user）
const customMappings = computed(() => {
  const requiredFieldNames = new Set(props.requiredFields?.map(f => f.targetField) || [])
  return currentMappings.value.filter(mapping => !requiredFieldNames.has(mapping.targetField))
})

// Is there a custom mapping?
const hasCustomMappings = computed(() => {
  return customMappings.value.length > 0
})

// Check if there is valid preview data
const hasValidPreviewData = computed(() => {
  return props.previewData && typeof props.previewData === 'object' && Object.keys(props.previewData).length > 0
})

/**
 * simplifiedJSONPathparser (Implementation based on reference documents)
 * support：$.name, user.name, [0].name, user.profile.name wait
 */
const evaluateJsonPath = (data: any, path: string): any => {
  if (!path || path === '$') return data

  try {
    // Handle simple paths，like $.name, [0].name, user.name wait
    let cleanPath = path.replace(/^\$\.?/, '').replace(/\[(\d+)\]/g, '.$1')
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const keys = cleanPath.split('.')
    let current = data

    for (const key of keys) {
      if (key === '') continue
      if (current === null || current === undefined) return null

      if (/^\d+$/.test(key)) {
        const index = parseInt(key)
        current = Array.isArray(current) ? current[index] : current[key]
      } else {
        current = current[key]
      }

      if (current === undefined) return null
    }

    return current
  } catch {
    return null
  }
}

/**
 * Apply field mapping rules (Implement according to the guiding ideology)
 * core logic：Traverse mapping rules，Extract corresponding field values ​​from original data
 */
const applyFieldMapping = (data: any, mappingRules: FieldMappingRule[]): any => {
  if (!data || !mappingRules || mappingRules.length === 0) {
    return data
  }

  // Processing array data：Apply the same mapping rules to each object in the array
  if (Array.isArray(data)) {
    return data.map(item => applyFieldMapping(item, mappingRules))
  }

  // Process object data：Generate new objects according to mapping rules
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {}

    mappingRules.forEach(rule => {
      if (rule.targetField && rule.sourcePath) {
        const value = evaluateJsonPath(data, rule.sourcePath)
        if (value !== null && value !== undefined) {
          result[rule.targetField] = value
        }
      }
    })

    return result
  }

  return data
}

// Get the preview value of a single mapping path
const getMappingPreview = (sourcePath: string): string => {
  if (!hasValidPreviewData.value) return 'No data'
  if (!sourcePath) return 'Not configured'

  try {
    const value = evaluateJsonPath(props.previewData, sourcePath)

    if (value === null || value === undefined) return 'Invalid path'

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  } catch {
    return 'Parse error'
  }
}

// Get the type color of the preview value
const getMappingPreviewType = (sourcePath: string): string => {
  const preview = getMappingPreview(sourcePath)
  if (preview === 'No data' || preview === 'Not configured') return 'default'
  if (preview === 'Invalid path' || preview === 'Parse error') return 'error'
  return 'success'
}

// Calculate the final mapping result
const mappedResult = computed(() => {
  if (!hasValidPreviewData.value || currentMappings.value.length === 0) {
    return null
  }

  try {
    return applyFieldMapping(props.previewData, currentMappings.value)
  } catch (error) {
    return { error: 'Mapping processing failed' }
  }
})

// Check mapping validity
const isValidMapping = computed(() => {
  if (currentMappings.value.length === 0) {
    return true // It is considered valid when there is no mapping rule.
  }

  // Check if there is an empty field configuration
  const hasEmptyFields = currentMappings.value.some(rule => !rule.targetField?.trim() || !rule.sourcePath?.trim())

  // Check if there are duplicate target fields
  const targetFields = currentMappings.value
    .filter(rule => rule.targetField?.trim())
    .map(rule => rule.targetField.trim())
  const hasDuplicateTargets = new Set(targetFields).size !== targetFields.length

  return !hasEmptyFields && !hasDuplicateTargets
})

// Get the source path of the field
const getFieldSourcePath = (targetField: string): string => {
  const mapping = currentMappings.value.find(m => m.targetField === targetField)
  return mapping?.sourcePath || ''
}

// Update the source path of the field
const updateFieldSourcePath = (targetField: string, sourcePath: string) => {
  const updatedMappings = [...currentMappings.value]
  const existingIndex = updatedMappings.findIndex(m => m.targetField === targetField)

  if (existingIndex >= 0) {
    // Update existing mapping
    updatedMappings[existingIndex] = { targetField, sourcePath }
  } else {
    // Add new mapping
    updatedMappings.push({ targetField, sourcePath })
  }

  emit('update:modelValue', updatedMappings)
  handleMappingChange()
}

// Get field preview value
const getFieldPreview = (targetField: string): string => {
  const sourcePath = getFieldSourcePath(targetField)
  if (!sourcePath) return 'Not configured'
  return getMappingPreview(sourcePath)
}

// Get field preview type
const getFieldPreviewType = (targetField: string): string => {
  const sourcePath = getFieldSourcePath(targetField)
  if (!sourcePath) return 'default'
  return getMappingPreviewType(sourcePath)
}

// Get field type color
const getFieldTypeColor = (type: string): string => {
  switch (type) {
    case 'value':
      return 'info'
    case 'object':
      return 'warning'
    case 'array':
      return 'success'
    default:
      return 'default'
  }
}

// Add custom mapping rules
const addCustomMapping = () => {
  const newRule: FieldMappingRule = {
    targetField: '',
    sourcePath: ''
  }

  const updatedMappings = [...currentMappings.value, newRule]
  emit('update:modelValue', updatedMappings)

  statusMessage.value = 'Custom mapping rules added'
  statusType.value = 'success'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// Delete custom mapping rules
const removeCustomMapping = (index: number) => {
  const customMappingsArray = customMappings.value
  const mappingToRemove = customMappingsArray[index]

  if (mappingToRemove) {
    const updatedMappings = currentMappings.value.filter(
      m => !(m.targetField === mappingToRemove.targetField && m.sourcePath === mappingToRemove.sourcePath)
    )
    emit('update:modelValue', updatedMappings)

    statusMessage.value = 'Custom mapping rule deleted'
    statusType.value = 'success'
    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)
  }
}

// Delete mapping rule
const removeMappingRule = (index: number) => {
  const updatedMappings = currentMappings.value.filter((_, i) => i !== index)
  emit('update:modelValue', updatedMappings)

  statusMessage.value = 'Mapping rule deleted'
  statusType.value = 'success'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// Handle mapping changes
const handleMappingChange = () => {
  // Delay update，Make sure the input is complete
  setTimeout(() => {
    if (mappedResult.value !== null) {
      emit('mapping-change', mappedResult.value)
    }
  }, 100)
}

// Monitor mapping rule changes
watch(
  currentMappings,
  () => {
    handleMappingChange()
  },
  { deep: true }
)

// Monitor preview data changes
watch(
  () => props.previewData,
  () => {
    handleMappingChange()
  },
  { deep: true }
)
</script>

<style scoped>
.data-field-mapping-input {
  width: 100%;
}

.mapping-list {
  width: 100%;
}

.mapping-item {
  width: 100%;
}

.mapping-item :deep(.n-card) {
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.field-input {
  flex: 1;
  min-width: 0;
}

.field-input :deep(.n-form-item) {
  margin-bottom: 0;
}

.field-input :deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-3);
  padding-bottom: 4px;
}

.arrow-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  margin-top: 18px; /* Align to input box position */
}

.add-mapping {
  margin-top: 8px;
}

.empty-state {
  padding: 20px 0;
}

.preview-section {
  margin-top: 16px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-section {
  width: 100%;
}

.section-title {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-message {
  margin-top: 8px;
}

/* Responsive design */
@media (max-width: 768px) {
  .mapping-item :deep(.n-space) {
    flex-direction: column;
    align-items: stretch;
  }

  .arrow-icon {
    margin: 8px 0;
    transform: rotate(90deg);
  }

  .field-input {
    width: 100%;
  }
}
</style>
