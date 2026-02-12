<template>
  <div class="alert-status-setting">
    <n-form :model="config" label-placement="left" label-width="80" size="small">
      <!-- Basic configuration -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">Basic configuration</span>
      </n-divider>
      
      <n-form-item label="title">
        <n-input v-model:value="config.title" placeholder="Please enter a title" />
      </n-form-item>
      
      <n-form-item label="Amount">
        <n-input-number 
          v-model:value="config.amount" 
          placeholder="Please enter the amount"
        />
      </n-form-item>
      
      <n-form-item label="Introduction">
        <n-input 
          v-model:value="config.description" 
          type="textarea" 
          placeholder="Please enter profile information"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * Alarm status component configuration form - Simplified version
 */

import { ref, watch, nextTick } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NInputNumber, 
  NDivider
} from 'naive-ui'
import type { AlertStatusCustomize } from './settingConfig'

// Props - The configuration form receives a flat custom configuration object
interface Props {
  modelValue?: AlertStatusCustomize
  widget?: any
  config?: AlertStatusCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    title: 'Alarm status',
    amount: 0,
    description: 'The system is running normally'
  }),
  readonly: false
})

// Emits - Emit flat configuration objects
interface Emits {
  (e: 'update:modelValue', value: AlertStatusCustomize): void
  (e: 'change', value: AlertStatusCustomize): void
}

const emit = defineEmits<Emits>()

// Configuration data
const config = ref<AlertStatusCustomize>({ ...props.modelValue })

// Tags that prevent cyclic updates
const isUpdatingFromProps = ref(false)

// Listen for configuration changes and pass them up
watch(
  config,
  (newConfig) => {
    if (!props.readonly && !isUpdatingFromProps.value) {
      emit('update:modelValue', { ...newConfig })
      emit('change', { ...newConfig })
    }
  },
  { deep: true }
)

// Monitor external configuration changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isUpdatingFromProps.value) {
      isUpdatingFromProps.value = true
      try {
        config.value = { ...newValue }
      } finally {
        // use nextTick Make sure the update is complete before resetting the flag
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.alert-status-setting {
  padding: 16px;
}
</style>