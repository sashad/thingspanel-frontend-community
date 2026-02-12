<template>
  <div ref="gridWrapperEl" class="grid-layout-plus-wrapper-editor">
    <!--
      change the original GridLayoutPlus Replace with GridV2
      - GridV2 keep with GridLayoutPlus completely consistent Props interface
      - Supports default slots and outgoing { item }，Existing templates can be seamlessly reused
      - used for props/idKey Link debugging，Does not trigger original grid events
    -->
    <GridV2
      v-model:layout="layout"
      :config="gridConfig"
      :readonly="isReadOnly"
      :show-title="props.showWidgetTitles"
      :id-key="props.idKey"
      @layout-change="onLayoutChange"
      @item-resized="onResizeStop"
      @item-moved="onDragStop"
    >
      <template #default="{ item }">
        <!-- key：Allow events to bubble up to GridStack（whole card mousedown Trigger drag） -->
        <NodeWrapper
          :node="item.raw"
          :node-id="item.raw.id"
          :readonly="isReadOnly"
          :is-selected="false"
          :show-resize-handles="false"
          :get-widget-component="() => null"
          :multi-data-source-data="props.multiDataSourceStore?.[item.raw.id]"
          :multi-data-source-config="props.multiDataSourceConfigStore?.[item.raw.id]"
          class="grid-node-wrapper"
          :event-stop-propagation="false"

          @node-click="() => handleNodeSelect(item.i)"
          @node-contextmenu="(nodeId, event) => handleContextMenu(event, nodeId)"
          @title-update="handleTitleUpdate"
        />
      </template>
    </GridV2>

    <ContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :selected-widgets="contextMenu.selectedWidgets"
      @select="handleContextMenuSelect"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
// replace import：from common/gridv2 introduce GridV2；The type is still from common/grid Reuse
import { GridV2 } from '@/components/common/gridv2'
import type { GridLayoutPlusItem, GridLayoutPlusConfig } from '@/components/common/grid'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
import { ContextMenu } from '@/components/visual-editor/renderers/base'
import type { VisualEditorWidget, GraphData } from '@/components/visual-editor/types'
import { smartDeepClone } from '@/utils/deep-clone'

const props = withDefaults(defineProps<{
  graphData: any
  readonly?: boolean
  staticGrid?: boolean
  // Will any Change to Partial<GridLayoutPlusConfig>，avoid unnecessary any
  gridConfig?: Partial<GridLayoutPlusConfig>
  // New：Control whether the title is displayed
  showWidgetTitles?: boolean
  // New：Configurable primary key field name，default 'i'
  idKey?: string
}>(), {
  readonly: false,
  staticGrid: false,
  gridConfig: () => ({}),
  showWidgetTitles: false,
  idKey: 'i'
})
const emit = defineEmits(['node-select', 'request-settings'])

const router = useRouter()

// Use original store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// Adapt old interface methods
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

const isCard2Component = (nodeId: string) => {
  // simpleCard2Component detection
  const node = editorStore.nodes.find(n => n.id === nodeId)
  return node?.type.includes('card2') || node?.type.includes('Card2') || false
}

const getNodeById = (nodeId: string) => {
  return editorStore.nodes.find(n => n.id === nodeId)
}

const updateNode = async (nodeId: string, updates: any) => {
  editorStore.updateNode(nodeId, updates)
}

const addNode = async (node: any) => {
  editorStore.addNode(node)
}

const removeNode = async (nodeId: string) => {
  editorStore.removeNode(nodeId)
}

const gridWrapperEl = ref<HTMLElement | null>(null)
const layout = shallowRef<ExtendedGridLayoutPlusItem[]>([])
const isReadOnly = computed(() => props.readonly)

const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  selectedWidgets: VisualEditorWidget[]
}>({ show: false, x: 0, y: 0, selectedWidgets: [] })

const gridConfig = computed<GridLayoutPlusConfig>(() => {
  const config = {
    colNum: 24, // 🔥 repair：The unified default is24List
    rowHeight: 80,
    // 🔥 The hard-coded spacing is configured as8px，No longer configured externally
    horizontalGap: 8,
    verticalGap: 8,
    margin: [8, 8] as [number, number],
    isDraggable: !isReadOnly.value && !props.staticGrid,
    isResizable: !isReadOnly.value && !props.staticGrid,
    responsive: false,
    preventCollision: true, // 🔥 Prevent components from overlapping（Key configuration）
    verticalCompact: false, // 🔥 Disable vertical compression，Keep the layout that the user dragged and dropped unchanged
    isMirrored: false,
    autoSize: false, // 🔥 Disable automatic resizing，Let the parent container handle scrolling
    useCssTransforms: true,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }, // 🔥 repair：Adjust breakpoint column number to match24column basis
    useStyleCursor: true,
    restoreOnDrag: false,
    // 🔥 Merge external configuration，But exclude spacing related configurations
    ...(props.gridConfig ? {
      colNum: props.gridConfig.colNum,
      rowHeight: props.gridConfig.rowHeight,
      isDraggable: props.gridConfig.isDraggable,
      isResizable: props.gridConfig.isResizable,
      staticGrid: props.gridConfig.staticGrid
    } : {})
  }

  // Ensure switch configuration is applied correctly
  if (props.gridConfig) {
    if (props.gridConfig.isDraggable !== undefined) {
      config.isDraggable = !isReadOnly.value && !props.staticGrid && props.gridConfig.isDraggable
    }
    if (props.gridConfig.isResizable !== undefined) {
      config.isResizable = !isReadOnly.value && !props.staticGrid && props.gridConfig.isResizable
    }
    if (props.gridConfig.staticGrid !== undefined) {
      config.isDraggable = !isReadOnly.value && !props.gridConfig.staticGrid && config.isDraggable
      config.isResizable = !isReadOnly.value && !props.gridConfig.staticGrid && config.isResizable
    }
  }

  // debug log
  return config
})

interface ExtendedGridLayoutPlusItem extends GridLayoutPlusItem {
  raw: VisualEditorWidget
}

const nodesToLayout = (nodes: VisualEditorWidget[]): ExtendedGridLayoutPlusItem[] => {
  const key = props.idKey || 'i'
  return nodes.map(node => {
    // 🔥 repair：in edit mode，Prioritize ensuring that components are interactive
    // Only if explicitly disabled（The value is false）Interaction is disabled only when，undefined Allowed by default
    const effectiveStatic = props.staticGrid || (props.gridConfig?.staticGrid ?? false)

    // ✅ Check if node is locked
    const isLocked = (node as any)._isLocked === true

    // ✅ If the node is locked，Disable dragging and resizing
    const allowDrag = !isReadOnly.value && !effectiveStatic && !isLocked && (props.gridConfig?.isDraggable !== false)
    const allowResize = !isReadOnly.value && !effectiveStatic && !isLocked && (props.gridConfig?.isResizable !== false)

    const item = {
      i: node.id,
      x: node.layout?.gridstack?.x ?? 0,
      y: node.layout?.gridstack?.y ?? 0,
      w: node.layout?.gridstack?.w ?? 4,
      h: node.layout?.gridstack?.h ?? 2,
      static: effectiveStatic || isLocked, // ✅ Locked components are set to static
      isDraggable: allowDrag,
      isResizable: allowResize,
      locked: isLocked, // ✅ Add to locked property
      type: node.type,
      raw: node
    } as ExtendedGridLayoutPlusItem
    // Write back custom primary key，Ensure double fields are consistent
    if (key !== 'i') {
      ;(item as any)[key] = item.i
    }
    return item
  })
}

watch(
  () => props.graphData.nodes,
  newNodes => {
    if (newNodes) {
      newNodes.forEach(node => {})
    }
    layout.value = nodesToLayout(newNodes || [])
  },
  { immediate: true, deep: true }
)

// 🔥 Monitoring interaction related configuration，Keep layout item behavior synchronized
watch(
  () => [props.staticGrid, props.gridConfig?.staticGrid, props.gridConfig?.isDraggable, props.gridConfig?.isResizable],
  ([staticGridOverride, configStatic, configDraggable, configResizable]) => {
    // 🔥 repair：Use with nodesToLayout same logic
    // Only if explicitly disabled（The value is false）Interaction is disabled only when，undefined Allowed by default
    const effectiveStatic = Boolean(staticGridOverride || configStatic)
    const allowDrag = !props.readonly && !effectiveStatic && (configDraggable !== false)
    const allowResize = !props.readonly && !effectiveStatic && (configResizable !== false)

    layout.value = layout.value.map(item => ({
      ...item,
      static: effectiveStatic,
      isDraggable: allowDrag,
      isResizable: allowResize
    }))
  },
  { immediate: true }
)

const onLayoutChange = (newLayout: ExtendedGridLayoutPlusItem[]) => {
  // 🔥 Layout information is not updated in preview mode，Avoid unexpected location changes
  if (props.readonly || props.staticGrid) {
    return
  }

  // Update the layout information of all nodes
  newLayout.forEach(item => {
    updateNodeLayout(item)
  })
}

const updateNodeLayout = (item: ExtendedGridLayoutPlusItem) => {
  const node = getNodeById(item.i)
  if (node) {
    updateNode(node.id, {
      layout: { ...node.layout, gridstack: { x: item.x, y: item.y, w: item.w, h: item.h } }
    })
  }
}

const onDragStop = (itemId: string, newX: number, newY: number) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    item.x = newX
    item.y = newY
    updateNodeLayout(item)
  }
}

const onResizeStop = (itemId: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    item.h = newH
    item.w = newW
    updateNodeLayout(item)
  }
}
const handleNodeSelect = (nodeId: string) => {
  selectNode(nodeId)
  emit('node-select', nodeId)
}

const handleInteraction = (widget: VisualEditorWidget) => {
  if (props.readonly) {
    // Only trigger interactions in preview mode
    const { onClick } = widget.interaction || {}
    if (!onClick) return

    if (onClick.type === 'link' && onClick.payload?.url) {
      window.open(onClick.payload.url, onClick.payload.newTab ? '_blank' : '_self')
    } else if (onClick.type === 'internal_route' && onClick.payload?.route) {
      router.push(onClick.payload.route)
    }
  }
}

const handleContextMenu = (event: MouseEvent, nodeId: string) => {
  if (isReadOnly.value || props.staticGrid) return
  event.preventDefault()

  const node = getNodeById(nodeId)
  if (!node) return

  contextMenu.value.show = false
  nextTick().then(() => {
    contextMenu.value = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      selectedWidgets: [node]
    }
  })
}

const handleContextMenuSelect = (action: string) => {
  const widget = contextMenu.value.selectedWidgets[0]
  if (!widget) return

  switch (action) {
    case 'copy': {
      // 🔥 Use smart deep copy，Automatic processingVueReactive objects
      const newNode = smartDeepClone(widget)
      newNode.id = `${newNode.type}_${nanoid()}`

      // ✅ Remove lock state when copying，Allow users to instantly adjust their position
      // refer to Figma、Sketch、Adobe XD Industry practices for design tools such as
      delete (newNode as any)._isLocked

      if (newNode.layout?.gridstack) {
        newNode.layout.gridstack.y += 1
      }
      addNode(newNode)
      break
    }
    case 'delete':
      removeNode(widget.id)
      break
    case 'settings':
      emit('request-settings', widget.id)
      break
    case 'lock':
      // ✅ Lock components：set up _isLocked mark
      if (widget) {
        // Set lock flag
        ;(widget as any)._isLocked = true
        // Trigger status update，watchwill be automatically recalculatedlayout
        editorStore.updateNode(widget.id, { ...widget })
      }
      break
    case 'unlock':
      // ✅ Unlock components：Remove _isLocked mark
      if (widget) {
        // Remove lock mark
        ;(widget as any)._isLocked = false
        // Trigger status update，watchwill be automatically recalculatedlayout
        editorStore.updateNode(widget.id, { ...widget })
      }
      break
  }
  closeContextMenu()
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

/**
 * Handle title updates
 * whenNodeWrapperCalled when the title in is edited
 */
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  // NodeWrapperConfiguration updates have been processed，Just record the logs here
}
</script>

<style scoped>
.grid-layout-plus-wrapper-editor {
  width: 100%;
}

.grid-node-wrapper {
  width: 100%;
  height: 100%;
}
</style>
