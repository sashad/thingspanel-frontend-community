<template>
  <div class="form-field">
    <!-- Text input box -->
    <n-form-item
      v-if="setting.type === 'input'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- text field -->
    <n-form-item
      v-else-if="setting.type === 'textarea'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        type="textarea"
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :rows="4"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- Number input box -->
    <n-form-item
      v-else-if="setting.type === 'input-number'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input-number
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :min="setting.min"
        :max="setting.max"
        :step="setting.step"
        style="width: 100%"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- color picker -->
    <n-form-item
      v-else-if="setting.type === 'color-picker'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-color-picker
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- slider -->
    <n-form-item
      v-else-if="setting.type === 'slider'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-slider
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        :min="setting.min"
        :max="setting.max"
        :step="setting.step"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- switch -->
    <n-form-item
      v-else-if="setting.type === 'switch'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-switch
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- drop down selection -->
    <n-form-item
      v-else-if="setting.type === 'select'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-select
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :options="selectOptions"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- checkbox -->
    <n-form-item
      v-else-if="setting.type === 'checkbox'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-checkbox
        :checked="modelValue"
        :disabled="setting.disabled || readonly"
        @update:checked="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- radio button group -->
    <n-form-item
      v-else-if="setting.type === 'radio-group'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-radio-group
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      >
        <n-space>
          <n-radio
            v-for="option in setting.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- date picker -->
    <n-form-item
      v-else-if="setting.type === 'date-picker'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-date-picker
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        style="width: 100%"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- Dynamic tags -->
    <n-form-item
      v-else-if="setting.type === 'dynamic-tags'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-dynamic-tags
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- Vue component renderer -->
    <n-form-item
      v-else-if="setting.type === 'vue-component'"
      :label="setting.label"
      :required="setting.required"
    >
      <component
        :is="setting.component"
        :model-value="modelValue"
        :readonly="readonly"
        v-bind="setting.componentProps"
        @update:model-value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- Field of unknown type -->
    <n-form-item
      v-else
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
/**
 * FormField - form field component
 * Render the corresponding form control according to the setting item type
 * Supports all standard form control types and Vue Component rendering
 */

import { computed } from 'vue'
import {
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  NSlider,
  NSwitch,
  NSelect,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NDatePicker,
  NDynamicTags,
  NSpace
} from 'naive-ui'
import type { Setting } from '@/card2.1/types/setting-config'

interface Props {
  // Setting item configuration
  setting: Setting
  // current value
  modelValue?: unknown
  // Is it read-only?
  readonly?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: unknown): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// Handling value changes
const handleValueChange = (value: unknown) => {
  emit('update:modelValue', value)
}

// Dropdown selector options
const selectOptions = computed(() => {
  if (!props.setting.options) return []

  return props.setting.options.map(option => ({
    label: option.label,
    value: option.value,
    disabled: option.disabled || false
  }))
})
</script>

<style scoped>
.form-field {
  width: 100%;
}

.field-description {
  color: var(--text-color-3);
  font-size: 12px;
  line-height: 1.4;
}

:deep(.n-form-item-feedback) {
  margin-top: 4px;
}
</style>