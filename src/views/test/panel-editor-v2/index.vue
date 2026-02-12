<script setup lang="ts">
/**
 * PanelEditorV2 test page
 * used to verify based on PanelLayout New editor features for
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NSpace, NButton, NSwitch, NSelect, NInputNumber, NDivider } from 'naive-ui'
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import type { RendererType } from '@/components/visual-editor/types/renderer'
// import Card2.1 Component system to trigger automatic registration
import '@/card2.1/components/index'

const appStore = useAppStore()

onMounted(() => {
  // appStore.setFullContent(true)
})

onUnmounted(() => {
  // appStore.setFullContent(false)
})

const route = useRoute()
const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

// Test configuration status
const testConfig = ref({
  panelId: panel_id,
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: true, // 🔥 The bottom status bar is opened by default
  customLayoutClass: '',
  defaultRenderer: 'gridstack' as RendererType // 🔥 New：Default renderer settings
})

// Layout preset options
const layoutPresets = [
  { label: 'full editor', value: 'full' },
  { label: 'Clean editor', value: 'clean' },
  { label: 'toolbar only', value: 'toolbar-only' },
  { label: 'title bar only', value: 'header-only' },
  { label: 'minimize', value: 'minimal' }
]

// 🔥 Renderer options
const rendererOptions = [
  { label: 'GridStack Renderer', value: 'gridstack' },
  { label: 'Canvas Renderer', value: 'canvas' }
]

// Apply layout presets
const applyPreset = (preset: string) => {
  switch (preset) {
    case 'full':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: true,
        showPageHeader: true,
        enableHeaderArea: true,
        enableToolbarArea: true,
        enableFooterArea: true
      }
      break
    case 'clean':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: false,
        enableFooterArea: false
      }
      break
    case 'toolbar-only':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: true,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: true,
        enableFooterArea: false
      }
      break
    case 'header-only':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: true,
        enableHeaderArea: true,
        enableToolbarArea: false,
        enableFooterArea: false
      }
      break
    case 'minimal':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: false,
        enableFooterArea: true
      }
      break
  }
}

// 🔥 Editor status tracking
const editorState = ref({
  isReady: false,
  selectedNodeId: '',
  totalWidgets: 0,
  isLoading: true,
  lastAction: '',
  hasError: false,
  errorMessage: ''
})

// Editor event handling
const handleStateManagerReady = (stateManager: any) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }
    editorState.value.isReady = true
    editorState.value.isLoading = false
    editorState.value.totalWidgets = stateManager?.nodes?.length || 0
    editorState.value.lastAction = 'Editor is ready'
    editorState.value.hasError = false
    editorState.value.errorMessage = ''
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `State manager initialization failed: ${error}`
    editorState.value.isLoading = false
  }
}

const handleWidgetAdded = (widget: any) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }
    editorState.value.totalWidgets++
    editorState.value.lastAction = `Add component: ${widget.type}`
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `Component addition failed: ${error}`
  }
}

const handleNodeSelect = (nodeId: string) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }
    editorState.value.selectedNodeId = nodeId
    editorState.value.lastAction = nodeId ? `Select component: ${nodeId}` : 'Uncheck'
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `Component selection failed: ${error}`
  }
}

const handleEditorReady = (editor: any) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }
    editorState.value.lastAction = 'Editor core initialized'
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `Editor initialization failed: ${error}`
  }
}
</script>

<template>
  <div class="test-page">
    <!-- Test control panel -->
    <NCard class="control-panel" title="PanelEditorV2 test console" size="small">
      <NSpace vertical>
        <!-- 🔥 Ultra compact control row -->
        <div class="compact-controls">
          <NSpace size="small" align="center">
            <span class="mini-label">Default:</span>
            <NSelect :options="layoutPresets" size="small" style="width: 100px" @update:value="applyPreset" />

            <NDivider vertical />

            <span class="mini-label">Renderer:</span>
            <NSelect
              v-model:value="testConfig.defaultRenderer"
              :options="rendererOptions"
              size="small"
              style="width: 90px"
            />

            <NDivider vertical />

            <span class="mini-label">Toolbar</span>
            <NSwitch v-model:value="testConfig.showToolbar" size="small" />

            <span class="mini-label">title</span>
            <NSwitch v-model:value="testConfig.showPageHeader" size="small" />

            <span class="mini-label">bottom bar</span>
            <NSwitch v-model:value="testConfig.enableFooterArea" size="small" />
          </NSpace>
        </div>

        <div class="status-info">
          <NSpace justify="space-between" align="center">
            <NSpace size="small">
              <span class="status-tag new">V2</span>
              <span class="status-tag">PanelLayout</span>
              <span
                :class="[
                  'status-tag',
                  { ready: editorState.isReady, loading: editorState.isLoading, error: editorState.hasError }
                ]"
              >
                {{
                  editorState.isLoading
                    ? 'loading'
                    : editorState.isReady
                      ? 'ready'
                      : editorState.hasError
                        ? 'mistake'
                        : 'Not ready'
                }}
              </span>
            </NSpace>
            <NSpace v-if="editorState.isReady" size="small">
              <span class="status-mini">components: {{ editorState.totalWidgets }}</span>
              <span v-if="editorState.selectedNodeId" class="status-mini">
                selected: {{ editorState.selectedNodeId.slice(0, 8) }}...
              </span>
            </NSpace>
          </NSpace>
        </div>
      </NSpace>
    </NCard>

    <!-- PanelEditorV2 Test example -->
    <div class="editor-container">
      <PanelEditorV2
        :panel-id="testConfig.panelId"
        :show-toolbar="testConfig.showToolbar"
        :show-page-header="testConfig.showPageHeader"
        :enable-header-area="testConfig.enableHeaderArea"
        :enable-toolbar-area="testConfig.enableToolbarArea"
        :enable-footer-area="testConfig.enableFooterArea"
        :custom-layout-class="testConfig.customLayoutClass"
        :default-renderer="testConfig.defaultRenderer"
        @state-manager-ready="handleStateManagerReady"
        @widget-added="handleWidgetAdded"
        @node-select="handleNodeSelect"
        @editor-ready="handleEditorReady"
      />
    </div>
  </div>
</template>

<style scoped>
.test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--body-color);
}

.control-panel {
  flex-shrink: 0;
  margin: 2px 8px 4px 8px; /* 🔥 Reduce margins further */
  border-radius: 4px;
  box-shadow: var(--box-shadow);
  max-height: 80px; /* 🔥 Maximum compression height */
  overflow: hidden; /* 🔥 No scrolling required */
}

.config-row {
  padding: 4px 0; /* 🔥 reduce padding */
}

.compact-controls {
  padding: 4px 0; /* 🔥 compact control row */
}

.mini-label {
  font-size: 12px;
  color: var(--text-color-2);
  white-space: nowrap;
}

.config-label {
  font-weight: 500;
  min-width: 80px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--modal-color);
  border-radius: 4px;
  font-size: 13px;
}

.status-info {
  padding: 4px 0 2px 0; /* 🔥 minimal padding */
  border-top: 1px solid var(--divider-color);
}

.status-tag {
  padding: 1px 6px; /* 🔥 smaller labels */
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  background: var(--modal-color);
  color: var(--text-color-2);
}

.status-tag.new {
  background: var(--success-color);
  color: white;
}

.status-tag.ready {
  background: var(--success-color);
  color: white;
}

.status-tag.loading {
  background: var(--warning-color);
  color: white;
}

.status-tag.error {
  background: var(--error-color);
  color: white;
}

.status-mini {
  font-size: 10px; /* 🔥 Smaller font */
  color: var(--text-color-2);
  padding: 1px 4px; /* 🔥 Smaller padding */
  background: var(--modal-color);
  border-radius: 3px;
}

.editor-container {
  flex: 1;
  margin: 0 8px 4px 8px; /* 🔥 Reduce bottom margin */
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--box-shadow);
  background: var(--card-color);
  min-height: 0; /* key：make sureflexLayout is normal */
}
</style>
