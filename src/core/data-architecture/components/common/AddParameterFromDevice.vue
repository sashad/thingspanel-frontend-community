<script setup lang="ts">
/**
 * Simplified version of device parameter adding component
 * Use the simplest form instead of complex device selectors
 */
import { ref } from 'vue'
import { NButton, NSpace, NInput, NFormItem, NForm, NText } from 'naive-ui'
import { $t } from '@/locales'

// Emits interface
interface Emits {
  (e: 'add', params: any[]): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// Simplified form data
const formData = ref({
  paramKey: '',
  paramValue: '',
  deviceName: ''
})

// Add button handler function
const handleAdd = () => {
  // Simple verification
  if (!formData.value.paramKey.trim()) {
    window.$message?.warning('Please enter parameter name')
    return
  }

  // Create a simple parameter object
  const newParam = {
    key: formData.value.paramKey.trim(),
    value: formData.value.paramValue.trim() || `{${formData.value.paramKey.trim()}}`,
    type: 'device',
    source: {
      deviceName: formData.value.deviceName.trim() || 'equipment',
      paramKey: formData.value.paramKey.trim()
    }
  }

  emit('add', [newParam])
}

// Cancel button handler function
const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="add-parameter-from-device">
    <div class="p-4">
      <n-text depth="3" style="margin-bottom: 16px; display: block">Simplified version of device parameter addition - Directly enter parameter information</n-text>

      <n-form size="small" label-placement="left" label-width="80">
        <n-form-item label="Parameter name" required>
          <n-input v-model:value="formData.paramKey" placeholder="like: deviceId, temperature wait" clearable />
        </n-form-item>

        <n-form-item label="Parameter value">
          <n-input v-model:value="formData.paramValue" placeholder="Leave blank to automatically generate {Parameter name} Format" clearable />
        </n-form-item>

        <n-form-item label="Device name">
          <n-input v-model:value="formData.deviceName" placeholder="Optional，used to describe" clearable />
        </n-form-item>
      </n-form>
    </div>

    <n-space justify="end" class="p-4 border-t">
      <n-button @click="handleCancel">{{ $t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleAdd">{{ $t('common.add') }}</n-button>
    </n-space>
  </div>
</template>

<style scoped>
.add-parameter-from-device {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.p-4 {
  padding: 16px;
}
.border-t {
  border-top: 1px solid #e5e7eb;
}
</style>
