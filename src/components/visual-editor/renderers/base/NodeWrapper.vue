<template>
  <div
    ref="nodeElement"
    class="node-wrapper"
    :class="wrapperClasses"
    :style="wrapperStyles"
    @mousedown="onMouseDown"
    @click="onClick"
    @contextmenu="onContextMenu"
  >
    <!-- content wrapper - Control visibility but remain event responsive -->
    <div v-show="baseConfig?.visible !== false" class="node-content-wrapper">
      <!-- title bar -->
      <div v-if="shouldShowTitle" class="node-title-bar" :style="titleBarStyles" @dblclick="startTitleEdit">
        <!-- edit mode -->
        <n-input
          v-if="isEditingTitle"
          ref="titleInputRef"
          v-model:value="editingTitleValue"
          size="small"
          :bordered="false"
          class="title-input"
          @blur="finishTitleEdit"
          @keyup.enter="finishTitleEdit"
          @keyup.escape="cancelTitleEdit"
        />
        <!-- display mode -->
        <span v-else class="title-text">{{ displayTitle }}</span>
      </div>

      <!-- content area -->
      <div class="node-content" :style="contentStyles">
        <Card2Wrapper
          v-if="node.metadata?.isCard2Component"
          :component-type="node.type"
          :config="nodeComponentConfig || node.properties"
          :data="node.metadata?.card2Data"
          :metadata="node.metadata"
          :data-source="node.dataSource"
          :data-sources="multiDataSourceData"
          :data-sources-config="multiDataSourceConfig"
          :node-id="nodeId"
          :interaction-configs="nodeInteractionConfigs"
          :allow-external-control="nodeInteractionPermissions?.allowExternalControl"
          :interaction-permissions="nodeInteractionPermissions"
          :preview-mode="readonly"
          @error="$emit('component-error', $event)"
        />
        <component :is="getWidgetComponent?.(node.type)" v-else v-bind="node.properties" />
      </div>
    </div>

    <!-- resize control handle - Always respond to events，Easy to edit hidden components -->
    <div v-if="showResizeHandles" class="resize-handles">
      <div
        v-for="handle in resizeHandles"
        :key="handle.position"
        :class="`resize-handle resize-handle-${handle.position}`"
        @mousedown.stop="$emit('resize-start', nodeId, handle.position, $event)"
      />
    </div>

    <!-- Check status indicator - always responsive，Easy to edit hidden components -->
    <div v-if="isSelected && !readonly" class="selection-indicator" />
  </div>
</template>

<script setup lang="ts">
/**
 * Unified node frame component
 * forCanvasandGridLayoutPlusRenderer provides consistent node wrapping
 * Responsible for title display/edit、Basic configuration application、Selected status, etc.
 */

import { ref, computed, nextTick, watch, watchEffect, onMounted, onUnmounted, h } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { NInput, NModal, NSpace, NButton, NDropdown, NIcon } from 'naive-ui'
import { SettingsOutline, CopyOutline, TrashOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { configurationManager } from '@/components/visual-editor/configuration'
import { useEditor } from '@/components/visual-editor/hooks/useEditor'
import Card2Wrapper from '@/components/visual-editor/renderers/base/Card2Wrapper.vue'
import type { BaseConfiguration, WidgetConfiguration } from '@/components/visual-editor/configuration/types'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

interface Props {
  /** Node data */
  node: VisualEditorWidget
  /** nodeID */
  nodeId: string
  /** Whether to read-only mode */
  readonly?: boolean
  /** Whether to show resize handles */
  showResizeHandles?: boolean
  /** Check or not */
  isSelected?: boolean
  /** Force display of title（Ignore configuration） */
  forceShowTitle?: boolean
  /** How to get the component（Used for nonCard2components） */
  getWidgetComponent?: (type: string) => any
  /** Multiple data sources */
  multiDataSourceData?: Record<string, any>
  /** Multiple data source configuration */
  multiDataSourceConfig?: any
  /**
   * event propagation control switch（default true）：
   * - true：Prevent event bubbling when calling internal interactions（Applicable to Canvas Renderer interaction）
   * - false：Allow events to bubble up to the parent（GridStack Need to be received in the entire card area mousedown to trigger drag）
   */
  eventStopPropagation?: boolean
}

interface Emits {
  (e: 'node-click', nodeId: string, event: MouseEvent): void
  (e: 'node-mousedown', nodeId: string, event: MouseEvent): void
  (e: 'node-contextmenu', nodeId: string, event: MouseEvent): void
  (e: 'resize-start', nodeId: string, direction: string, event: MouseEvent): void
  (e: 'title-update', nodeId: string, newTitle: string): void
  (e: 'component-error', error: Error): void
}

const props = defineProps<Props>()

// Computed properties，frompropsExtract data and configuration from multiple data sources，Provided to components
const multiDataSourceData = computed(() => props.multiDataSourceData || {})
const multiDataSourceConfig = computed(() => props.multiDataSourceConfig || {})
const emit = defineEmits<Emits>()

/**
 * 🔥 Optimized event handling function：make sureGridStackDrag and drop fluidity
 * - exist GridStack In the integration scenario，The entire card area is allowed mousedown bubble to .grid-stack-item，Trigger drag
 * - exist Canvas In the integration scenario，Bubbling is blocked by default to prevent being captured by the background layer
 * - Avoid unnecessary event handling during dragging and dropping
 */
const onMouseDown = (event: MouseEvent): void => {
  // 🔥 critical fix：existGridStackenvironment，Prioritize drag and drop smoothness
  if (props.eventStopPropagation === false) {
    // GridStackmodel：Does not prevent bubbling，letGridStackHandling drag and drop
    emit('node-mousedown', props.nodeId, event)
    return
  }
  
  // Canvasmodel：Stop bubbling，Handle it yourself
  event.stopPropagation()
  emit('node-mousedown', props.nodeId, event)
}

const onClick = (event: MouseEvent): void => {
  // 🔥 critical fix：Click event optimization，Avoid interfering with dragging
  if (props.eventStopPropagation === false) {
    // GridStackmodel：Delay processing of clicks，Avoid interfering with dragging
    setTimeout(() => {
      emit('node-click', props.nodeId, event)
    }, 0)
    return
  }
  
  // Canvasmodel：Process immediately
  event.stopPropagation()
  emit('node-click', props.nodeId, event)
}

const onContextMenu = (event: MouseEvent): void => {
  // Always block default right-click menu，to customize menu display
  event.preventDefault()
  if (props.eventStopPropagation !== false) {
    event.stopPropagation()
  }
  emit('node-contextmenu', props.nodeId, event)
}

const { updateNode } = useEditor()
const { t } = useI18n()

// debug：monitornode.metadatachange
watch(
  () => props.node.metadata,
  newMetadata => {
    if (props.node.type === 'datasource-test') {
    }
  },
  { deep: true, immediate: true }
)

// debug：Monitor data changes from multiple data sources
watch(
  () => props.multiDataSourceData,
  newMultiDataSourceData => {
    if (newMultiDataSourceData) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
  },
  { deep: true, immediate: true }
)

// template reference
const nodeElement = ref<HTMLElement>()
const titleInputRef = ref<InstanceType<typeof NInput>>()

// Title editing status
const isEditingTitle = ref(false)
const editingTitleValue = ref('')
const originalTitleValue = ref('')

// resize handle definition
const resizeHandles = [
  { position: 'nw' },
  { position: 'n' },
  { position: 'ne' },
  { position: 'w' },
  { position: 'e' },
  { position: 'sw' },
  { position: 's' },
  { position: 'se' }
]

// 🔥 repair：Get basic configuration，Use static defaults to avoid duplicate object creation
const defaultBaseConfig: BaseConfiguration = {
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
}

// 🔥 Fix recursive updates：useref + watchEffectsubstitutecomputed，Avoid triggering configuration system in computed properties
const baseConfigRef = ref<BaseConfiguration>(defaultBaseConfig)

// 🔥 Fix recursive updates：Move config fetch logic towatchEffectmiddle，and add anti-shake
const updateBaseConfig = useDebounceFn(() => {
  try {
    // 🔥 Unified use of configuration manager to obtain configuration，whether it isCard2components
    const widgetConfig = configurationManager.getConfiguration(props.nodeId)

    if (!widgetConfig?.base) {
      baseConfigRef.value = defaultBaseConfig
      return
    }

    baseConfigRef.value = {
      ...defaultBaseConfig,
      ...widgetConfig.base
    }
  } catch (error) {
    console.error(`[NodeWrapper] Get node ${props.nodeId} Basic configuration failed:`, error)
    baseConfigRef.value = defaultBaseConfig
  }
}, 50) // 50msAnti-shake，Avoid frequent updates

// 🔥 simplifiedCard2Configuration acquisition，Use Configuration Manager to avoidDOMoperate
const getBaseConfigFromCard2 = (): BaseConfiguration | null => {
  try {
    // 🔥 Prefer using the configuration manager to obtain configuration
    const config = configurationManager.getConfiguration(props.nodeId)
    if (config?.base) {
      return config.base
    }

    // 🔥 rollback：Send custom event request configuration
    const configRequestEvent = new CustomEvent('card2-config-request', {
      detail: { componentId: props.nodeId, layer: 'base' }
    })

    let receivedConfig: BaseConfiguration | null = null
    const handleConfigResponse = (event: CustomEvent) => {
      if (event.detail.componentId === props.nodeId && event.detail.layer === 'base') {
        receivedConfig = event.detail.config
      }
    }

    window.addEventListener('card2-config-response', handleConfigResponse as EventListener)
    window.dispatchEvent(configRequestEvent)
    window.removeEventListener('card2-config-response', handleConfigResponse as EventListener)

    return receivedConfig
  } catch (error) {
    console.error(`[NodeWrapper] GetCard2Configuration failed ${props.nodeId}:`, error)
    return null
  }
}

// 🔥 Fix recursive updates：Using computed property referencesref，avoid directlycomputedCall the configuration system in
const baseConfig = computed(() => baseConfigRef.value)

// 🔥 Fix recursive updates：userefavoid incomputedCall the configuration system in
const nodeComponentConfigRef = ref<any>(undefined)
const nodeInteractionConfigsRef = ref<any[]>([])
const nodeInteractionPermissionsRef = ref<any>({
  allowExternalControl: true,
  allowedEvents: ['click', 'hover', 'focus', 'blur']
})

// 🔥 Fix recursive updates：Unified configuration update function，Anti-shake processing
const updateAllConfigs = useDebounceFn(() => {
  try {
    const widgetConfig = configurationManager.getConfiguration(props.nodeId)
    
    // Update component configuration
    nodeComponentConfigRef.value = widgetConfig?.component?.properties || undefined
    
    // Update interaction configuration
    nodeInteractionConfigsRef.value = widgetConfig?.interaction?.configs || []
    
    // Update interaction permissions
    nodeInteractionPermissionsRef.value = widgetConfig?.interaction?.permissions || {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  } catch (error) {
    console.error(`[NodeWrapper] Get node ${props.nodeId} Configuration failed:`, error)
    nodeComponentConfigRef.value = undefined
    nodeInteractionConfigsRef.value = []
    nodeInteractionPermissionsRef.value = {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  }
}, 50)

// 🔥 Fix recursive updates：Using computed property referencesref
const nodeComponentConfig = computed(() => nodeComponentConfigRef.value)
const nodeInteractionConfigs = computed(() => nodeInteractionConfigsRef.value)
const nodeInteractionPermissions = computed(() => nodeInteractionPermissionsRef.value)

// Maintain backward-compatible function versions
const getNodeComponentConfig = (nodeId: string): any => {
  if (nodeId === props.nodeId) {
    return nodeComponentConfig.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return widgetConfig?.component?.properties
  } catch (error) {
    console.error(`[NodeWrapper] Get node ${nodeId} Component configuration failed:`, error)
    return undefined
  }
}

const getNodeInteractionConfigs = (nodeId: string): any[] => {
  if (nodeId === props.nodeId) {
    return nodeInteractionConfigs.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return widgetConfig?.interaction?.configs || []
  } catch (error) {
    console.error(`[NodeWrapper] Get node ${nodeId} Interactive configuration failed:`, error)
    return []
  }
}

const getNodeInteractionPermissions = (nodeId: string): any => {
  if (nodeId === props.nodeId) {
    return nodeInteractionPermissions.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return (
      widgetConfig?.interaction?.permissions || {
        allowExternalControl: true,
        allowedEvents: ['click', 'hover', 'focus', 'blur']
      }
    )
  } catch (error) {
    console.error(`[NodeWrapper] Get node ${nodeId} Interaction permission failed:`, error)
    return {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  }
}

// 🔥 Fix recursive updates：usewatchEffectto respond to configuration changes，rather than incomputedcall in
watchEffect(() => {
  // monitorprops.nodeIdchange，Trigger configuration update
  if (props.nodeId) {
    updateBaseConfig()
    updateAllConfigs()
  }
})

// Title display logic
const shouldShowTitle = computed(() => {
  return props.forceShowTitle || baseConfig.value.showTitle
})

const displayTitle = computed(() => {
  return baseConfig.value.title || props.node.label || props.node.type || t('config.base.untitledComponent')
})

// style calculation
const wrapperStyles = computed(() => {
  const config = baseConfig.value
  const styles: Record<string, string> = {}

  // 🔧 transparency
  if (config.opacity !== undefined && config.opacity !== 1) {
    styles.opacity = config.opacity.toString()
  }

  // 🔧 background color - Overrides default value if configured
  if (config.backgroundColor) {
    styles.backgroundColor = config.backgroundColor
  }

  // 🔧 border style - Complete bezel configuration
  if (config.borderWidth !== undefined) {
    styles.borderWidth = `${config.borderWidth}px`
    styles.borderStyle = config.borderStyle || 'solid'
    styles.borderColor = config.borderColor || 'var(--border-color)'
  }

  // 🔧 rounded corners - Overrides default value if configured
  if (config.borderRadius !== undefined) {
    styles.borderRadius = `${config.borderRadius}px`
  }

  // 🔧 shadow - Overrides default value if configured
  if (config.boxShadow) {
    styles.boxShadow = config.boxShadow
  }

  // 🔧 Margin configuration
  if (config.margin) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = config.margin
    styles.margin = `${top}px ${right}px ${bottom}px ${left}px`
  }

  return styles
})

const wrapperClasses = computed(() => {
  const classes: string[] = []

  if (props.isSelected && !props.readonly) {
    classes.push('selected')
  }

  if (props.readonly) {
    classes.push('readonly')
  }

  // Add hidden state class，for style adjustment（but does not affect the event）
  if (baseConfig.value.visible === false) {
    classes.push('content-hidden')
  }

  return classes
})

const titleBarStyles = computed(() => ({
  padding: '6px 8px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-color)',
  backgroundColor: 'var(--body-color)',
  borderBottom: '1px solid var(--border-color)',
  userSelect: 'none' as const,
  cursor: props.readonly ? 'default' : 'pointer'
}))

const contentStyles = computed(() => {
  const config = baseConfig.value
  const styles: Record<string, string> = {
    flex: '1',
    position: 'relative' as const,
    overflow: 'hidden' as const
  }

  // padding - Apply to content area
  if (config.padding) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = config.padding
    styles.padding = `${top}px ${right}px ${bottom}px ${left}px`
  }

  return styles
})

// Title editing method
const startTitleEdit = () => {
  if (props.readonly) return

  isEditingTitle.value = true
  editingTitleValue.value = baseConfig.value.title || props.node.label || ''
  originalTitleValue.value = editingTitleValue.value

  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

const finishTitleEdit = () => {
  if (!isEditingTitle.value) return

  const newTitle = editingTitleValue.value.trim()
  isEditingTitle.value = false

  if (newTitle !== originalTitleValue.value) {
    // Update to configuration manager
    try {
      const currentConfig = configurationManager.getConfiguration(props.nodeId) || {
        base: {},
        component: { properties: {} },
        dataSource: null,
        interaction: {}
      }

      configurationManager.updateConfiguration(props.nodeId, 'base', {
        ...currentConfig.base,
        title: newTitle,
        showTitle: true
      })

      // Update nodes at the same timelabelproperties to maintain compatibility
      updateNode(props.nodeId, { label: newTitle })

      emit('title-update', props.nodeId, newTitle)
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[NodeWrapper] Failed to update title:`, error)
    }
  }
}

const cancelTitleEdit = () => {
  isEditingTitle.value = false
  editingTitleValue.value = originalTitleValue.value
}

// Configuration change listener cancellation function
let removeConfigListener: (() => void) | null = null

// 🔥 Fix recursive updates：optimizationCard2Configuration change event handling，Avoid triggering new calculation loops
const handleCard2ConfigChange = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId && layer === 'base') {
    // 🔥 direct updateref，Avoid re-invoking the configuration system
    if (config) {
      baseConfigRef.value = {
        ...defaultBaseConfig,
        ...config
      }
    }
  }
}

// Listen for configuration changes in the configuration manager
onMounted(() => {
  try {
    // 🔥 forCard2Component listens for configuration change events
    if (props.node.metadata?.isCard2Component) {
      window.addEventListener('card2-config-update', handleCard2ConfigChange as EventListener)
    }

    // Check if the node is configured，If not, create a default configuration（Only for non-Card2components）
    if (!props.node.metadata?.isCard2Component) {
      const existingConfig = configurationManager.getConfiguration(props.nodeId)
      if (!existingConfig) {
        const defaultConfig: WidgetConfiguration = {
          base: {
            showTitle: false,
            title: props.node.label || props.node.type || t('config.base.untitledComponent'),
            opacity: 1,
            visible: true,
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
          },
          component: { properties: props.node.properties || {} },
          dataSource: null,
          interaction: {},
          metadata: {
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
        configurationManager.setConfiguration(props.nodeId, defaultConfig)
      }
    }
  } catch (error) {
    console.error(`[NodeWrapper] Failed to add configuration listener:`, error)
  }
})

onUnmounted(() => {
  // 🔥 clean upCard2Configure change event listener
  if (props.node.metadata?.isCard2Component) {
    window.removeEventListener('card2-config-update', handleCard2ConfigChange as EventListener)
  }

  // Clean up old configuration listeners（if exists）
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {
      console.error(`[NodeWrapper] Failed to remove configuration listener:`, error)
    }
  }
})

// Monitor node changes，Sync title
watch(
  () => props.node.label,
  newLabel => {
    if (!isEditingTitle.value && newLabel && !baseConfig.value.title) {
      // If there is no header in the configuration but the node doeslabel，Try to sync
      try {
        const currentConfig = configurationManager.getConfiguration(props.nodeId)
        if (currentConfig && !currentConfig.base?.title) {
          configurationManager.updateConfiguration(props.nodeId, 'base', {
            ...currentConfig.base,
            title: newLabel
          })
        }
      } catch (error) {
        // Ignore sync errors
      }
    }
  }
)
</script>

<style scoped>
.node-wrapper {
  /* 🔧 Basic layout style，do not interferebaseConfiguration */
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;

  /* Preserve necessary interaction styles */
  transition:
    opacity 0.3s ease,
    border-color 0.2s ease;
  overflow: hidden;

  /* 🔧 minimal default style，Ensure visibility */
  border: 1px solid transparent; /* minimum border，for selected state */

  /* 🔧 Make sure togrid-item-bodyThere is a basic visible style after transparency */
  background-color: var(--card-color);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 🔧 Content wrapper style */
.node-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 🔧 Visual feedback when hiding content（edit mode） */
.node-wrapper.content-hidden:not(.readonly) {
  /* Provides visual cues for hidden components in edit mode */
  background-color: rgba(128, 128, 128, 0.1);
  border: 2px dashed rgba(128, 128, 128, 0.3);
}

.node-wrapper.content-hidden:not(.readonly)::before {
  content: 'hide';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
  pointer-events: none;
}

.node-wrapper:hover:not(.readonly) {
  /* 🔧 simplifyhoverEffect，Not coveredbaseConfiguration */
  border-color: rgba(24, 160, 88, 0.3);
}

.node-wrapper.selected {
  /* 🔧 Simplify selection effect，Not coveredbaseConfiguration */
  border-color: var(--primary-color) !important; /* !importantGuaranteed selection effect */
  z-index: 1;
}

.node-wrapper.readonly {
  cursor: default;
}

.node-wrapper.readonly:hover {
  border-color: transparent;
}

.node-title-bar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  position: relative;
}

.title-text {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-input {
  --n-border: none !important;
  --n-border-hover: none !important;
  --n-border-focus: none !important;
  --n-box-shadow-focus: none !important;
}

.title-input :deep(.n-input__input-el) {
  padding: 0 !important;
  font-size: 12px;
  font-weight: 500;
}

.node-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: all;
  z-index: 10;
}

.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-n {
  top: 0;
  left: 50%;
  cursor: n-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: translate(50%, -50%);
}
.resize-handle-w {
  top: 50%;
  left: 0;
  cursor: w-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-e {
  top: 50%;
  right: 0;
  cursor: e-resize;
  transform: translate(50%, -50%);
}
.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: translate(-50%, 50%);
}
.resize-handle-s {
  bottom: 0;
  left: 50%;
  cursor: s-resize;
  transform: translate(-50%, 50%);
}
.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
  transform: translate(50%, 50%);
}

.selection-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px solid var(--primary-color);
  border-radius: inherit;
  box-shadow: 0 0 0 1px rgba(24, 160, 88, 0.1);
}

/* Theme adaptation */
[data-theme='dark'] .node-wrapper {
  background-color: var(--card-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .node-wrapper:hover:not(.readonly) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .node-title-bar {
  background-color: var(--body-color);
  color: var(--text-color);
  border-bottom-color: var(--border-color);
}

/* Custom class support */
.node-wrapper.minimal {
  border: none;
  box-shadow: none;
  background: transparent;
}

.node-wrapper.dashboard-widget {
  background: var(--card-color);
  border-radius: 8px;
  box-shadow: var(--box-shadow);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .node-title-bar {
    padding: 4px 6px;
    font-size: 11px;
  }

  .resize-handle {
    width: 10px;
    height: 10px;
  }
}
</style>
