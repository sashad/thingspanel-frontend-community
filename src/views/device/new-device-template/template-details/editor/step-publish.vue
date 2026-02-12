<script setup lang="ts">
/**
 * step5：Release completed
 * Show full templateJSONdata，Support copying
 */

import { ref, onMounted } from 'vue'
import { $t } from '@/locales'
import { getTemplat } from '@/service/api/system-data'

const props = defineProps({
  stepCurrent: { type: Number, required: true },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: { type: String, required: true }
})

const emit = defineEmits(['update:modalVisible', 'update:stepCurrent'])

// JSONcode
const code = ref<string>('')

/**
 * Load complete template data
 */
const getTemplate = async () => {
  const { data, error } = await getTemplat(props.deviceTemplateId)
  if (!error && data) {
    // parseJSONField
    try {
      data.app_chart_config = JSON.parse(data.app_chart_config)
    } catch (e) {
      // If parsing fails，stay as is
    }
    try {
      data.web_chart_config = JSON.parse(data.web_chart_config)
    } catch (e) {
      // If parsing fails，stay as is
    }
    code.value = JSON.stringify(data, null, 2)
  }
}

/**
 * Previous step
 */
const back: () => void = async () => {
  emit('update:stepCurrent', 4)
}

/**
 * copyJSONto clipboard
 */
const copyText = (): void => {
  const textElement = document.getElementById('text-to-copy')
  if (textElement) {
    const text: string | null = textElement.textContent
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard
        .writeText(typeof text === 'string' ? text : '')
        .then(() => {
          window.$message?.info($t('common.copiedClipboard'))
        })
        .catch(err => {
          window.$message?.error(`${$t('common.copyingFailed')}: ${err}`)
        })
    } else {
      const range = document.createRange()
      range.selectNodeContents(textElement!)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand('Copy')
      window.$message?.success($t('theme.configOperation.copySuccess'))
    }
  }
}

onMounted(getTemplate)
</script>

<template>
  <div>
    <n-card class="mt-4">
      <n-scrollbar class="h-400px">
        <n-code id="text-to-copy" :code="code" language="json" />
      </n-scrollbar>
      <template #footer>
        <div class="flex justify-between border-t pt-3">
          <div>
            <n-button type="primary" class="mr-4" @click="copyText">{{ $t('generate.copy-json') }}</n-button>
          </div>
          <div>
            <n-button class="mr-4" @click="back">{{ $t('generate.previous-step') }}</n-button>
            <n-button type="primary" @click="emit('update:modalVisible', false)">
              {{ $t('common.complete') }}
            </n-button>
          </div>
        </div>
      </template>
    </n-card>
  </div>
</template>

<style scoped></style>
