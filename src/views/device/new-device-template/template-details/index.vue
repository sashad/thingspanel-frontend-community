<script setup lang="ts">
/**
 * Main entrance of device template details page
 * Support three modes：New、edit、Preview
 * - New/edit：use Editor components（3step process）
 * - Preview：use Viewer components（Tablayout）
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TemplateEditor from './editor/index.vue'
import TemplateViewer from './viewer/index.vue'

const route = useRoute()
const router = useRouter()

/**
 * Current display mode
 * - 'add': New mode
 * - 'edit': edit mode
 * - 'preview': preview mode
 */
const currentMode = ref<'add' | 'edit' | 'preview'>('add')

/**
 * templateID（Used when editing or previewing）
 */
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

/**
 * Initialize mode based on routing parameters
 */
const initMode = () => {
  const { id, mode } = route.query

  if (mode === 'add') {
    // New mode
    currentMode.value = 'add'
  } else if (mode === 'edit') {
    // edit mode
    currentMode.value = 'edit'
  } else if (id) {
    // have id 但没have指定mode，or mode === 'preview'，Default preview mode
    currentMode.value = 'preview'
  } else {
    // without any parameters，Default new mode
    currentMode.value = 'add'
  }
}

/**
 * Switch to preview mode
 */
const handleSwitchToPreview = () => {
  if (templateId.value) {
    currentMode.value = 'preview'
    router.replace({
      name: 'device_new-device-template_template-details',
      query: { id: templateId.value, mode: 'preview' }
    })
  }
}

/**
 * Switch to edit mode
 */
const handleSwitchToEdit = () => {
  if (templateId.value) {
    currentMode.value = 'edit'
    router.replace({
      name: 'device_new-device-template_template-details',
      query: { id: templateId.value, mode: 'edit' }
    })
  }
}

/**
 * Processing after successful saving
 */
const handleSaved = (data: any) => {
  console.log('Template saved:', data)
  // After successful saving, you can jump to the preview or list
  // router.push({ name: 'device_new-device-template_template-list' })
}

/**
 * Monitor routing changes
 */
watch(
  () => route.query,
  () => {
    initMode()
  },
  { immediate: true }
)
</script>

<template>
  <div class="template-details-container">
    <!-- Add or edit mode - show editor（3step process） -->
    <TemplateEditor
      v-if="currentMode === 'add' || currentMode === 'edit'"
      :template-id="templateId"
      :mode="currentMode"
      @preview="handleSwitchToPreview"
      @saved="handleSaved"
    />

    <!-- preview mode - show viewer（Tablayout） -->
    <TemplateViewer v-else-if="currentMode === 'preview'" :template-id="templateId" @edit="handleSwitchToEdit" />
  </div>
</template>

<style scoped lang="scss">
.template-details-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
}
</style>
