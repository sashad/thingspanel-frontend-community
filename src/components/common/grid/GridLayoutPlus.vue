<!--
  Grid Layout Plus Packaging components
  based on grid-layout-plus Enterprise Grid Layout Component
  Refactored version：Modular architecture，Improve maintainability and performance
-->
<template>
  <div
    class="grid-layout-plus-wrapper grid-background-base"
    :class="{
      readonly: readonly,
      'dark-theme': isDarkTheme,
      'show-grid': showGrid && !readonly
    }"
  >
    <!-- Grid Core Components -->
    <GridCore
      ref="gridCoreRef"
      :layout="normalizedLayout"
      :config="config"
      :readonly="readonly"
      :show-title="showTitle"
      @layout-created="handleLayoutCreated"
      @layout-before-mount="handleLayoutBeforeMount"
      @layout-mounted="handleLayoutMounted"
      @layout-updated="handleLayoutUpdated"
      @layout-ready="handleLayoutReady"
      @layout-change="handleLayoutChange"
      @breakpoint-changed="handleBreakpointChanged"
      @container-resized="handleContainerResized"
      @item-resize="handleItemResize"
      @item-resized="handleItemResized"
      @item-move="handleItemMove"
      @item-moved="handleItemMoved"
      @item-container-resized="handleItemContainerResized"
    >
      <template #default="{ item }">
        <slot :item="item">
          <!-- The default content will be GridItemContent deal with -->
        </slot>
      </template>
    </GridCore>

    <!-- Drag area component -->
    <GridDropZone
      :readonly="readonly"
      :show-drop-zone="showDropZone"
      @drag-enter="handleDragEnter"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Grid Layout Plus main component - Refactored version
 * Adopt modular architecture，Improve maintainability and performance
 */

import { ref, computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { GridCore, GridDropZone } from './components'
import type {
  GridLayoutPlusConfig,
  GridLayoutPlusItem,
  GridLayoutPlusEmits,
  GridLayoutPlusProps
} from './gridLayoutPlusTypes'
import { EXTENDED_GRID_LAYOUT_CONFIG, GridSizePresets, DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from './gridLayoutPlusTypes'
import { validateExtendedGridConfig, validateLargeGridPerformance, optimizeItemForLargeGrid } from './utils/validation'

// Props
interface Props extends GridLayoutPlusProps {
  /** Grid size presets */
  gridSize?: 'mini' | 'standard' | 'large' | 'mega' | 'extended' | 'custom'
  /** Custom number of columns（when gridSize for 'custom' used when） */
  customColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  layout: () => [],
  readonly: false,
  showGrid: true,
  showDropZone: false,
  showTitle: false, // Title is not displayed by default
  config: () => ({}),
  gridSize: 'standard', // Use standard grid by default (24List)
  customColumns: 50,
  /** Unique key field name，Used by default 'i'。Allow external data structures to rename primary keys（like 'id'） */
  idKey: 'i'
})

// Emits
interface Emits extends GridLayoutPlusEmits {}

const emit = defineEmits<Emits>()

// Store
const themeStore = useThemeStore()

// component reference
const gridCoreRef = ref<InstanceType<typeof GridCore> | null>(null)

// Computed properties：according to idKey Standardized layout，Make sure each item has item.i
const normalizedLayout = computed<GridLayoutPlusItem[]>(() => {
  const key = props.idKey || 'i'
  return (props.layout || []).map(item => {
    // like果外部使用了自定义键名（like 'id'），then map it to an internal field i
    const currentId = (item as any)[key] ?? (item as any).i
    const withI: GridLayoutPlusItem = { ...item, i: currentId as string }
    // Synchronously write back custom keys，Ensure double fields are consistent（Do not change the original agreement，Only add fields）
    if (key !== 'i') {
      ;(withI as any)[key] = withI.i
    }
    return withI
  })
})

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

const config = computed<GridLayoutPlusConfig>(() => {
  // according to gridSize Select basic configuration
  let baseConfig: GridLayoutPlusConfig

  switch (props.gridSize) {
    case 'mini':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.MINI
      }
      break
    case 'standard':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.STANDARD
      }
      break
    case 'large':
      baseConfig = {
        ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
        ...GridSizePresets.LARGE
      }
      break
    case 'mega':
      baseConfig = {
        ...EXTENDED_GRID_LAYOUT_CONFIG,
        ...GridSizePresets.MEGA
      }
      break
    case 'extended':
      baseConfig = { ...EXTENDED_GRID_LAYOUT_CONFIG }
      break
    case 'custom':
      baseConfig = {
        ...EXTENDED_GRID_LAYOUT_CONFIG,
        ...GridSizePresets.CUSTOM(props.customColumns || 50)
      }
      break
    default:
      baseConfig = { ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG }
  }

  // Merge user-defined configuration
  return {
    ...baseConfig,
    ...props.config
  }
})

// Grid validation and performance monitoring
const gridValidation = computed(() => {
  const colNum = config.value.colNum

  // Verify extended grid configuration
  const configValidation = validateExtendedGridConfig(colNum)
  if (!configValidation.success) {
    console.error('Grid configuration validation failed:', configValidation.message)
  }

  // Large grid performance verification
  const performanceCheck = validateLargeGridPerformance(props.layout, colNum)
  if (performanceCheck.success && (performanceCheck.data?.warning || performanceCheck.data?.recommendation)) {
    console.error('Grid performance warning:', performanceCheck.data.warning)
    console.info('Grid performance recommendation:', performanceCheck.data.recommendation)
  }

  return {
    isValid: configValidation.success,
    colNum,
    performance: performanceCheck.data
  }
})

// business methods
const handleItemEdit = (item: GridLayoutPlusItem) => {
  emit('item-edit', withIdKey([item])[0])
}

const handleItemDelete = (item: GridLayoutPlusItem) => {
  // pass GridCore Component handles deletion logic
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    const index = coreLayout.findIndex(i => i.i === item.i)
    if (index > -1) {
      coreLayout.splice(index, 1)
      emit('item-delete', item.i)
    }
  }
}

const handleItemDataUpdate = (itemId: string, data: any) => {
  // pass GridCore Component handles data updates
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    const item = coreLayout.find(i => i.i === itemId)
    if (item) {
      item.data = { ...item.data, ...data }
      emit('item-data-update', itemId, data)
    }
  }
}

// Grid Layout Plus event handling
const handleLayoutCreated = (newLayout: GridLayoutPlusItem[]) => {
  // Unified external layout agreement：complete idKey Alias ​​field
  emit('layout-created', withIdKey(newLayout))
}

const handleLayoutBeforeMount = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-before-mount', withIdKey(newLayout))
}

const handleLayoutMounted = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-mounted', withIdKey(newLayout))
}

const handleLayoutUpdated = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-updated', withIdKey(newLayout))
}

const withIdKey = (items: GridLayoutPlusItem[]): GridLayoutPlusItem[] => {
  // Before announcing bureau-related events abroad，Replenish idKey Field，Guaranteed compatibility with any primary key protocol
  const key = props.idKey || 'i'
  if (key === 'i') return items
  return items.map(it => ({ ...(it as any), [key]: it.i })) as GridLayoutPlusItem[]
}

const handleLayoutReady = (newLayout: GridLayoutPlusItem[]) => {
  emit('layout-ready', withIdKey(newLayout))
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  // Depend on GridCore Component handles layout changes，The main component is only responsible for forwarding events
  const patched = withIdKey(newLayout)
  emit('layout-change', patched)
  emit('update:layout', patched)
}

const handleBreakpointChanged = (newBreakpoint: string, newLayout: GridLayoutPlusItem[]) => {
  emit('breakpoint-changed', newBreakpoint, withIdKey(newLayout))
}

const handleContainerResized = (width: number, height: number, cols: number) => {
  emit('container-resized', width, height, cols)
}

const handleItemResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resize', i, newH, newW, newHPx, newWPx)
}

const handleItemResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resized', i, newH, newW, newHPx, newWPx)
}

const handleItemMove = (i: string, newX: number, newY: number) => {
  emit('item-move', i, newX, newY)
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  emit('item-moved', i, newX, newY)
}

const handleItemContainerResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-container-resized', i, newH, newW, newHPx, newWPx)
}

// Drag event handling - entrusted to GridDropZone components
const handleDragEnter = (e: DragEvent) => {
  emit('drag-enter', e)
}

const handleDragOver = (e: DragEvent) => {
  emit('drag-over', e)
}

const handleDragLeave = (e: DragEvent) => {
  emit('drag-leave', e)
}

const handleDrop = (e: DragEvent) => {
  const componentType = e.dataTransfer?.getData('text/plain')
  if (componentType) {
    addItem(componentType)
  }
  emit('drop', e)
}

// API method - pass GridCore Component implementation
const addItem = (type: string, options?: Partial<GridLayoutPlusItem>) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const newItem: GridLayoutPlusItem = {
    i: generateId(),
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    type,
    ...options
  }

  // If a custom key name is defined externally，then write back this field，Ensure double fields are consistent
  const key = props.idKey || 'i'
  if (key !== 'i') {
    ;(newItem as any)[key] = newItem.i
  }

  // Find the right location
  const position = findAvailablePosition(newItem.w, newItem.h)
  newItem.x = position.x
  newItem.y = position.y

  coreLayout.push(newItem)
  emit('item-add', withIdKey([newItem])[0])
  return newItem
}

const removeItem = (itemId: string) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const index = coreLayout.findIndex(item => item.i === itemId)
  if (index > -1) {
    const removedItem = coreLayout.splice(index, 1)[0]
    emit('item-delete', itemId)
    return removedItem
  }
  return null
}

const updateItem = (itemId: string, updates: Partial<GridLayoutPlusItem>) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return null

  const item = coreLayout.find(i => i.i === itemId)
  if (item) {
    Object.assign(item, updates)
    emit('item-update', itemId, updates)
    return item
  }
  return null
}

const clearLayout = () => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (coreLayout) {
    coreLayout.splice(0)
    emit('layout-change', withIdKey([]))
    emit('update:layout', withIdKey([...coreLayout]))
  }
}

const getItem = (itemId: string) => {
  return gridCoreRef.value?.internalLayout?.find(item => item.i === itemId) || null
}

const getAllItems = () => {
  return gridCoreRef.value?.internalLayout ? [...gridCoreRef.value.internalLayout] : []
}

// Utility function
const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const findAvailablePosition = (w: number, h: number): { x: number; y: number } => {
  const colNum = config.value.colNum
  const layout = gridCoreRef.value?.internalLayout || []

  // Simplified location finding algorithm
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - w; x++) {
      const proposed = { x, y, w, h }

      // Check for conflicts with existing projects
      const hasCollision = layout.some(item => {
        return !(
          proposed.x + proposed.w <= item.x ||
          proposed.x >= item.x + item.w ||
          proposed.y + proposed.h <= item.y ||
          proposed.y >= item.y + item.h
        )
      })

      if (!hasCollision) {
        return { x, y }
      }
    }
  }

  return { x: 0, y: 0 }
}

// 🔥 New：Grid Optimization Method
const optimizeLayoutForGridSize = (targetCols?: number, sourceCols?: number) => {
  const coreLayout = gridCoreRef.value?.internalLayout
  if (!coreLayout) return

  const targetColumns = targetCols || config.value.colNum
  const sourceColumns = sourceCols || 12 // Default from12column optimization

  // Optimize every grid item
  coreLayout.forEach(item => {
    const optimized = optimizeItemForLargeGrid(item, targetColumns, sourceColumns)
    Object.assign(item, optimized)
  })

  emit('layout-change', withIdKey([...coreLayout]))
  emit('update:layout', withIdKey([...coreLayout]))
}

// Layout data listeners have been moved to GridCore Component handling

// exposed API Method to parent component
defineExpose({
  addItem,
  removeItem,
  updateItem,
  clearLayout,
  getItem,
  getAllItems,
  getLayout: () => gridCoreRef.value?.internalLayout || [],
  // 🔥 New：Grid expansion relatedAPI
  getGridInfo: () => ({
    colNum: config.value.colNum,
    gridSize: props.gridSize,
    validation: gridValidation.value
  }),
  optimizeLayoutForGridSize,
  getGridValidation: () => gridValidation.value,
  // Expose subcomponent references for advanced manipulation
  gridCore: gridCoreRef
})
</script>

<style scoped>
.grid-layout-plus-wrapper {
  position: relative;
  width: 100%;
  height: 100%; /* 🔧 restore altitude100%To support adaptive height in grid containers */
}

/* Grid item content */
.grid-item-content {
  height: 100%;
  /* 🔧 Remove default style，avoid withNodeWrapper baseConfiguration conflict */
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 🔧 Remove default shadows and transitions，controlled by internal components */
  transition: none;
}

.dark-theme .grid-item-content {
  /* 🔧 Remove dark theme default style，avoid withNodeWrapperConfiguration conflict */
  background: transparent;
  border-color: transparent;
  color: inherit;
}

.grid-item-content:hover {
  /* 🔧 RemovehoverEffect，avoid withNodeWrapperConfiguration conflict */
  /* box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); */
  /* transform: translateY(-1px); */
}

/* Project header */
.grid-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  font-size: 14px;
  font-weight: 500;
}

.dark-theme .grid-item-header {
  background: #3a3a3a;
  border-bottom-color: #404040;
}

.grid-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.dark-theme .action-btn:hover {
  background: #4a4a4a;
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

/* Project content */
.grid-item-body {
  flex: 1;
  padding: 0; /* 🔧 Remove default padding，controlled by internal components */
  overflow: visible; /* Remove overflow: auto，Let content overflow naturally */
  /* 🔧 Remove default background，avoid withNodeWrapperConfiguration conflict */
  background: transparent;
  /* 🔧 Ensure that internal component styles can be displayed properly */
  border: none;
  border-radius: inherit;
}

.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
}

.item-type {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
}

/* drag area */
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
}

.drop-zone.dragging {
  opacity: 1;
  pointer-events: auto;
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #007bff;
  font-size: 16px;
  font-weight: 500;
}

.dark-theme .drop-zone {
  background: rgba(26, 26, 26, 0.9);
  border-color: #404040;
}

.dark-theme .drop-zone.dragging {
  border-color: #4dabf7;
  background: rgba(77, 171, 247, 0.1);
}

.dark-theme .drop-hint {
  color: #4dabf7;
}

/* read-only mode */
.readonly .grid-item-header {
  display: none;
}

.readonly .grid-item-body {
  padding: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .grid-item-header {
    padding: 6px 8px;
    font-size: 12px;
  }

  .grid-item-body {
    padding: 8px;
  }

  .action-btn {
    width: 20px;
    height: 20px;
  }
}
</style>
