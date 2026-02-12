<!--
  Visual editor main toolbar component
  Unified management of public toolbars and renderer-specific toolbars
-->
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { NModal, useThemeVars, NSpace, NButton, NSelect, NDivider, NPopconfirm, NTooltip, useMessage } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import CommonToolbar from '@/components/visual-editor/components/toolbar/CommonToolbar.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'
import RendererConfigDropdown from '@/components/visual-editor/components/toolbar/RendererConfigDropdown.vue'

interface Props {
  mode: 'edit' | 'preview'
  currentRenderer: string
  availableRenderers: Array<{ value: string; label: string; icon?: string }>
  canvasConfig?: Record<string, any>
  gridstackConfig?: Record<string, any>
  visualizationConfig?: Record<string, any>
  readonly?: boolean
  isSaving?: boolean
  hasChanges?: boolean
  showLeftDrawer?: boolean
  showRightDrawer?: boolean
}

interface Emits {
  // Edit status control
  (e: 'mode-change', mode: 'edit' | 'preview'): void
  (e: 'renderer-change', rendererId: string): void
  // Document operations
  (e: 'save'): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'import-config', config: Record<string, any>): void
  (e: 'export-config'): void
  // Edit operations
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'clear-all'): void
  // View control
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset-zoom'): void
  (e: 'fit-content'): void
  (e: 'center-view'): void
  (e: 'preview-mode'): void
  // Panel configuration
  (e: 'open-config'): void
  (e: 'toggle-left-drawer'): void
  (e: 'toggle-right-drawer'): void
  // Configuration changes
  (e: 'canvas-config-change', config: Record<string, any>): void
  (e: 'gridstack-config-change', config: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  canvasConfig: () => ({}),
  gridstackConfig: () => ({}),
  visualizationConfig: () => ({}),
  isSaving: false,
  hasChanges: false,
  showLeftDrawer: false,
  showRightDrawer: false
})

const emit = defineEmits<Emits>()

// Route management
const router = useRouter()
const route = useRoute()

// Configuration panel display status
const showConfigPanel = ref(false)

// Message prompt
const message = useMessage()

// Full screen status management
const isFullscreen = ref(false)

// Remove custom row height status，Handled by independent components

// Theme support - useNaive UItheme system
const themeVars = useThemeVars()
const toolbarColors = computed(() => ({
  '--toolbar-bg': themeVars.value.bodyColor,
  '--toolbar-border': themeVars.value.dividerColor,
  '--toolbar-shadow': themeVars.value.boxShadow2,
  '--modal-bg': themeVars.value.modalColor,
  '--modal-header-bg': themeVars.value.cardColor,
  '--modal-content-bg': themeVars.value.bodyColor,
  '--modal-border': themeVars.value.borderColor,
  '--modal-header-border': themeVars.value.dividerColor
}))

// Determine the current renderer type
const isCanvasRenderer = computed(() => props.currentRenderer === 'canvas')
const isGridstackRenderer = computed(() => props.currentRenderer === 'gridstack')
const isVisualizationRenderer = computed(() => props.currentRenderer === 'visualization')

// Options configuration has been moved to a separate configuration component

// Calculate current configuration（Provide default value）
const canvasConfig = computed(() => ({
  width: 1200,
  height: 800,
  showGrid: true,
  backgroundColor: '#f5f5f5',
  gridSize: 20,
  ...props.canvasConfig
}))

const gridstackConfig = computed(() => ({
  colNum: 24, // 🔥 repair：The unified default is24List
  rowHeight: 80,
  // 🔥 Spacing configuration is hard-coded inside the renderer，no longer passed from here
  isDraggable: true,
  isResizable: true,
  staticGrid: false,
  ...props.gridstackConfig
}))

const visualizationConfig = computed(() => ({
  theme: 'default',
  animation: true,
  responsive: true,
  ...props.visualizationConfig
}))

// Edit status control
const handleModeChange = (mode: 'edit' | 'preview') => {
  if (mode === 'preview') {
    // Jump to preview page，Open in new tab，Pass current renderer information
    const panelId = route.query.id
    if (panelId) {
      const previewUrl = router.resolve({
        path: '/ultra-kanban/kanban-preview',
        query: {
          id: panelId,
          renderer: props.currentRenderer // Pass the currently selected renderer type
        }
      })
      window.open(previewUrl.href, '_blank')
    } else {
      message.error($t('common.invalidParameter'))
    }
  } else {
    // Edit mode handles normally
    emit('mode-change', mode)
  }
}
const handleRendererChange = (rendererId: string) => emit('renderer-change', rendererId)

// Document operations
const handleSave = () => emit('save')

// Edit operations
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleClearAll = () => emit('clear-all')

// Renderer configuration changes
const handleCanvasConfigChange = (config: Record<string, any>) => {
  emit('canvas-config-change', config)
}

const handleGridstackConfigChange = (config: Record<string, any>) => {
  emit('gridstack-config-change', config)
}

const handleVisualizationConfigChange = (config: Record<string, any>) => {
  emit('visualization-config-change', config)
}

// view control events
const handleZoomIn = () => emit('zoom-in')
const handleZoomOut = () => emit('zoom-out')
const handleResetZoom = () => emit('reset-zoom')
const handleFitContent = () => emit('fit-content')
const handleCenterView = () => emit('center-view')

// Drawer control event
const handleToggleLeftDrawer = () => emit('toggle-left-drawer')
const handleToggleRightDrawer = () => emit('toggle-right-drawer')

/**
 * Full screen switching function
 * Enter/Exit editor area full screen mode（rather than the entire browser page）
 */
const handleToggleFullscreen = async (event?: Event) => {
  // 🔥 Prevent events from bubbling up，Prevent other full-screen events from being triggered
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  // Find editor container element
  const editorWrapper = document.querySelector('.panel-editor-wrapper') as HTMLElement

  if (!editorWrapper) {
    message.warning('Editor container not found')
    return
  }

  // 🔥 repair：Directly check if there is currently a full screen element，without relying on state variables
  const currentFullscreenElement =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement

  console.log('🔍 [Fullscreen Debug] Current full screen element:', currentFullscreenElement)
  console.log('🔍 [Fullscreen Debug] Editor container:', editorWrapper)

  if (!currentFullscreenElement) {
    // Go to full screen - Full screen editor area only
    console.log('🚀 [Fullscreen] Entering full screen...')
    try {
      if (editorWrapper.requestFullscreen) {
        await editorWrapper.requestFullscreen()
      } else if ((editorWrapper as any).webkitRequestFullscreen) {
        // Safari support
        await (editorWrapper as any).webkitRequestFullscreen()
      } else if ((editorWrapper as any).mozRequestFullScreen) {
        // Firefox support
        await (editorWrapper as any).mozRequestFullScreen()
      } else if ((editorWrapper as any).msRequestFullscreen) {
        // IE11 support
        await (editorWrapper as any).msRequestFullscreen()
      }
      console.log('✅ [Fullscreen] Entered full screen')
    } catch (error) {
      console.error('❌ [Fullscreen] Failed to enter full screen:', error)
    }
  } else {
    // Exit full screen
    console.log('🚪 [Fullscreen] Exiting full screen...')
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      console.log('✅ [Fullscreen] Exited full screen')
    } catch (error) {
      console.error('❌ [Fullscreen] Failed to exit full screen:', error)
    }
  }
}

// Monitor full screen status changes
const handleFullscreenChange = () => {
  const currentFullscreenElement =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement

  isFullscreen.value = !!currentFullscreenElement

  console.log('📺 [Fullscreen Change] Full screen status change:', {
    isFullscreen: isFullscreen.value,
    element: currentFullscreenElement,
    elementClass: currentFullscreenElement?.className
  })
}

// Switch configuration panel display status
const handleToggleRendererConfig = () => {
  showConfigPanel.value = !showConfigPanel.value
}

// Click outside to close the configuration panel - Optimized version
const handleClickOutside = (event: Event) => {
  if (showConfigPanel.value) {
    const target = event.target as HTMLElement
    const dropdown = document.querySelector('.config-dropdown')
    const button = document.querySelector('[data-config-button]')

    // Check if the click is within the dropdown menu（Naive UIThe drop-down menu usually hasn-select-menukind）
    const isInDropdownMenu = target.closest(
      '.n-select-menu, .n-color-picker-panel, .n-popover, .v-binder-follower-container'
    )

    // Only close if the click is actually outside
    if (dropdown && button && !dropdown.contains(target) && !button.contains(target) && !isInDropdownMenu) {
      showConfigPanel.value = false
    }
  }
}

// Add global click monitoring
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Monitor full screen status changes
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  // Remove full screen status monitoring
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})

// File import and export processing
const fileInputRef = ref<HTMLInputElement>()

const handleImport = () => {
  // Create a hidden file input element
  if (!fileInputRef.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.style.display = 'none'
    input.addEventListener('change', e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = event => {
          try {
            const config = JSON.parse(event.target?.result as string)
            emit('import-config', config)
          } catch (error) {}
        }
        reader.readAsText(file)
      }
    })
    fileInputRef.value = input
    document.body.appendChild(input)
  }
  fileInputRef.value.click()
}

const handleExport = () => {
  // trigger export event，The current configuration is provided by the parent component
  emit('export-config')
}

// Title retrieval logic has been moved to a separate component
</script>

<template>
  <div class="visual-editor-toolbar h-12 flex items-center relative" :style="toolbarColors">
    <!-- left side：Add component -->
    <div class="toolbar-left flex items-center gap-2">
      <!-- Add component button - Only shown in edit mode -->
      <template v-if="mode === 'edit'">
        <NButton size="small" :type="showLeftDrawer ? 'primary' : 'default'" @click="handleToggleLeftDrawer">
          <template #icon>
            <SvgIcon icon="material-symbols:widgets-outline" />
          </template>
          {{ $t('visualEditor.addComponent') }}
        </NButton>

        <!-- Renderer selection -->
        <NDivider vertical />
        <span class="text-12px text-gray-500">{{ $t('visualEditor.renderer') }}:</span>
        <NSelect
          :value="currentRenderer"
          :options="availableRenderers"
          size="small"
          style="width: 100px"
          @update:value="handleRendererChange"
        />
      </template>
    </div>

    <!-- right side：Action button group -->
    <div class="toolbar-right flex items-center">
      <NSpace align="center" :size="4">
        <!-- Functions in edit mode -->
        <template v-if="mode === 'edit'">
          <!-- Document Action Group -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  :type="hasChanges ? 'primary' : 'default'"
                  :loading="isSaving"
                  :disabled="readonly || isCanvasRenderer"
                  @click="handleSave"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:save-outline" />
                  </template>
                </NButton>
              </template>
              <span v-if="isCanvasRenderer">CanvasFunction under development，Saving is not supported yet</span>
              <span v-else>{{ $t('visualEditor.shortcuts.save') }}</span>
            </NTooltip>

            <NButton size="small" type="tertiary" :disabled="readonly" @click="handleImport">
              <template #icon>
                <SvgIcon icon="material-symbols:download" />
              </template>
            </NButton>

            <NButton size="small" type="tertiary" @click="handleExport">
              <template #icon>
                <SvgIcon icon="material-symbols:upload" />
              </template>
            </NButton>
          </div>

          <!-- Edit action group -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" disabled>
                  <template #icon>
                    <SvgIcon icon="material-symbols:undo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.underDevelopment') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" disabled>
                  <template #icon>
                    <SvgIcon icon="material-symbols:redo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.underDevelopment') }}</span>
            </NTooltip>

            <NPopconfirm
              :positive-text="$t('visualEditor.confirm')"
              :negative-text="$t('visualEditor.cancel')"
              @positive-click="handleClearAll"
            >
              <template #trigger>
                <NButton size="small" type="error" secondary :disabled="readonly">
                  <template #icon>
                    <SvgIcon icon="material-symbols:delete-outline" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.clearCanvasConfirm') }}</span>
            </NPopconfirm>
          </div>

          <!-- Canvasview control group - onlyCanvasMode display -->
          <div v-if="isCanvasRenderer" class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleZoomOut">
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-out" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.zoomOut') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleResetZoom">
                  <template #icon>
                    <SvgIcon icon="material-symbols:refresh" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.reset') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleZoomIn">
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-in" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.zoomIn') }}</span>
            </NTooltip>
          </div>

          <!-- Configure button -->
          <NButton size="small" type="tertiary" data-config-button @click="handleToggleRendererConfig">
            <template #icon>
              <SvgIcon icon="material-symbols:settings-outline" />
            </template>
          </NButton>

          <!-- full screen button -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton size="small" type="tertiary" @click.stop.prevent="handleToggleFullscreen($event)">
                <template #icon>
                  <SvgIcon
                    :icon="isFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'"
                  />
                </template>
              </NButton>
            </template>
            <span>{{ isFullscreen ? $t('visualEditor.exitFullscreen') : $t('visualEditor.fullscreen') }}</span>
          </NTooltip>
        </template>

        <!-- edit/preview button - Preview changes to jump to new page -->
        <NDivider vertical />
        <NButton
          size="small"
          type="primary"
          @click="handleModeChange('preview')"
        >
          <template #icon>
            <SvgIcon icon="material-symbols:visibility-outline" />
          </template>
          {{ $t('visualEditor.preview') }}
        </NButton>
      </NSpace>
    </div>

    <!-- Renderer configuration drop-down panel - Simpler interactions -->
    <RendererConfigDropdown
      :show="showConfigPanel"
      :current-renderer="currentRenderer"
      :canvas-config="canvasConfig"
      :gridstack-config="gridstackConfig"
      :visualization-config="visualizationConfig"
      @canvas-config-change="handleCanvasConfigChange"
      @gridstack-config-change="handleGridstackConfigChange"
      @visualization-config-change="handleVisualizationConfigChange"
    />
  </div>
</template>

<style scoped>
.visual-editor-toolbar {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  box-shadow: 0 1px 3px var(--toolbar-shadow);
  position: relative;
  z-index: 10;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
  padding: 0 16px;
}

.toolbar-left {
  flex-shrink: 0;
  min-width: fit-content;
}

.toolbar-right {
  flex-shrink: 0;
  margin-left: auto;
}

/* Button group style */
.btn-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid transparent;
}

.btn-group:hover {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: var(--toolbar-border);
}

/* Toolbar button hover effect */
.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}

/* Split line optimization */
.n-divider--vertical {
  height: 20px;
  margin: 0 8px;
  opacity: 0.6;
}

/* Remove pop-up related styles，Handled by independent components */

.dialog-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  /* medium screen：Hide part of button text */
  .btn-group .n-button .n-button__content {
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .visual-editor-toolbar {
    padding: 0 8px;
    height: auto;
    min-height: 48px;
  }

  /* small screen：Show only icons */
  .toolbar-left span {
    display: none;
  }

  .btn-group {
    gap: 1px;
    padding: 1px;
  }

  .renderer-config-modal {
    margin: 8px;
    width: calc(100vw - 16px) !important;
  }

  .config-content {
    max-height: 50vh;
  }

  /* If the space is too small，hideCanvasUnique controls */
  .btn-group:has(+ .btn-group) {
    display: none;
  }
}

@media (max-width: 480px) {
  /* super small screen：Simplify further */
  .toolbar-right .n-space {
    gap: 2px !important;
  }

  .btn-group:nth-child(n + 3) {
    display: none;
  }
}
</style>
