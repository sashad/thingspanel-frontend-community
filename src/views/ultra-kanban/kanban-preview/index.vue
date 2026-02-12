<script setup lang="ts">
/**
 * UltraKanban preview page
 * based onVisual EditorofPanelEditorComponent implements Kanban preview function，Use global preview mode
 */

import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NSpace, useMessage, NSpin, NBackTop } from 'naive-ui'
import { $t } from '@/locales'
import { getBoard } from '@/service/api'

// Official editor：based on PanelEditorV2（preview mode）
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
// Import global preview mode management
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'

// Routing and message management
const route = useRoute()
const message = useMessage()

// Page status management
const loading = ref(true)
const panelData = ref<Panel.Board>()
const error = ref<string>('')
const isUnmounted = ref(false)

// 🔥 Editor configuration status
const editorConfig = ref<{ widgets: any[]; config: any } | undefined>()

/**
 * Get KanbanIDand renderer type
 */
const panelId = computed(() => {
  return (route.query.id as string) || ''
})

/**
 * Get renderer type，Default isgridstack（Kanban）
 */
const rendererType = computed(() => {
  return (route.query.renderer as string) || 'gridstack'
})

/**
 * 🔥 Get Kanban data and parse configuration
 */
const fetchBoardData = async () => {
  if (!panelId.value) {
    error.value = $t('common.invalidParameter')
    loading.value = false
    return
  }

  try {
    loading.value = true
    const { data } = await getBoard(panelId.value)

    if (data) {
      panelData.value = data

      // 🔥 Parse Kanban configuration into editor format
      if (data.config) {
        try {
          const parsedConfig = JSON.parse(data.config)

          if (parsedConfig.widgets !== undefined || parsedConfig.config !== undefined) {
            // standard format：{widgets: [...], config: {...}}
            editorConfig.value = parsedConfig
          } else if (Array.isArray(parsedConfig)) {
            // Legacy array format
            editorConfig.value = {
              widgets: parsedConfig,
              config: { gridConfig: {}, canvasConfig: {} }
            }
          } else {
            // Empty or unknown format，Use default empty configuration
            editorConfig.value = {
              widgets: [],
              config: { gridConfig: {}, canvasConfig: {} }
            }
          }
        } catch (e) {
          console.error('❌ Failed to parse Kanban configuration:', e)
          // Parsing failed，Use empty configuration
          editorConfig.value = {
            widgets: [],
            config: { gridConfig: {}, canvasConfig: {} }
          }
        }
      } else {
        // No configuration，Use empty configuration
        editorConfig.value = {
          widgets: [],
          config: { gridConfig: {}, canvasConfig: {} }
        }
      }
    } else {
      error.value = $t('common.dataNotFound')
    }
  } catch (err) {
    console.error('❌ Failed to load Kanban data:', err)
    error.value = $t('common.loadError')
    message.error($t('common.loadError'))
  } finally {
    loading.value = false
  }
}

/**
 * Page initialization
 */
onMounted(async () => {
  // Set to preview mode - this is the key！
  globalPreviewMode.setPreviewMode(true)

  await fetchBoardData()
})

/**
 * Cleanup work when the page is destroyed
 */
onUnmounted(() => {
  isUnmounted.value = true
  // Optional：Reset preview mode when leaving the page
  // globalPreviewMode.setPreviewMode(false)
})

/**
 * Retry on error
 */
const retryLoad = async () => {
  error.value = ''
  await fetchBoardData()
}
</script>

<template>
  <div class="ultra-kanban-preview">
    <!-- Loading status -->
    <div v-if="loading" class="loading-container">
      <NSpin size="large">
        <template #description>
          {{ $t('common.loading') }}
        </template>
      </NSpin>
    </div>

    <!-- error status -->
    <div v-else-if="error" class="error-container">
      <NCard class="error-card">
        <NSpace vertical align="center">
          <icon-material-symbols:error-outline class="text-48px text-red" />
          <div class="text-16px font-medium">{{ error }}</div>
          <n-button type="primary" @click="retryLoad">
            {{ $t('common.retry') }}
          </n-button>
        </NSpace>
      </NCard>
    </div>

    <!-- main content area - integratedVisual Editor（preview mode） -->
    <div v-else-if="panelData && editorConfig && !isUnmounted" class="main-content">
      <!-- Preview mode editor（V2）integrated - Using global preview mode controls -->
      <div class="visual-editor-container">
        <PanelEditorV2
          :key="`ultra-panel-preview-${panelId}-${rendererType}`"
          :panel-id="panelId"
          :initial-config="editorConfig"
          :show-toolbar="false"
          :show-page-header="false"
          :enable-header-area="false"
          :enable-toolbar-area="false"
          :enable-footer-area="true"
          :default-renderer="rendererType"
        />
      </div>
    </div>

    <!-- back to top button -->
    <NBackTop :right="40" />
  </div>
</template>

<style scoped>
/* Main container style */
.ultra-kanban-preview {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--body-color);
  overflow: hidden;
}

/* Load state container */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: var(--body-color);
}

/* error status container */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  padding: 20px;
  background-color: var(--body-color);
}

.error-card {
  min-width: 300px;
  text-align: center;
}

/* main content area */
.main-content {
  width: 100%;
  height: 100vh;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* Visual Editorcontainer - Preview mode specific styles */
.visual-editor-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  background-color: var(--card-color);
  position: relative;
}

/* Respond to theme changes */
[data-theme='dark'] .ultra-kanban-preview {
  background-color: var(--body-color);
}

[data-theme='dark'] .visual-editor-container {
  background-color: var(--card-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .error-card {
    min-width: 280px;
    margin: 0 10px;
  }
}
</style>