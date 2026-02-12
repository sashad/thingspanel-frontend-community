<!--
  Grid core components
  Responsible for the core logic and rendering of grid layout
-->
<template>
  <GridLayout
    v-model:layout="internalLayout"
    :col-num="config.colNum"
    :row-height="config.rowHeight"
    :is-draggable="!readonly && config.isDraggable && !config.staticGrid"
    :is-resizable="!readonly && config.isResizable && !config.staticGrid"
    :is-mirrored="config.isMirrored"
    :auto-size="config.autoSize"
    :vertical-compact="config.verticalCompact"
    :margin="config.margin"
    :use-css-transforms="config.useCssTransforms"
    :responsive="config.responsive"
    :breakpoints="config.breakpoints"
    :cols="config.cols"
    :prevent-collision="config.preventCollision"
    :use-style-cursor="config.useStyleCursor"
    :restore-on-drag="config.restoreOnDrag"
    @layout-created="handleLayoutCreated"
    @layout-before-mount="handleLayoutBeforeMount"
    @layout-mounted="handleLayoutMounted"
    @layout-updated="handleLayoutUpdated"
    @layout-ready="handleLayoutReady"
    @update:layout="handleLayoutChange"
    @breakpoint-changed="handleBreakpointChanged"
    @container-resized="handleContainerResized"
    @item-resize="handleItemResize"
    @item-resized="handleItemResized"
    @item-move="handleItemMove"
    @item-moved="handleItemMoved"
  >
    <GridItem
      v-for="item in internalLayout"
      :key="item.i"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i"
      :min-w="item.minW"
      :min-h="item.minH"
      :max-w="item.maxW"
      :max-h="item.maxH"
      :is-draggable="!readonly && item.isDraggable !== false && !item.static"
      :is-resizable="!readonly && item.isResizable !== false && !item.static"
      :static="item.static"
      :drag-ignore-from="item.dragIgnoreFrom"
      :drag-allow-from="item.dragAllowFrom"
      :resize-ignore-from="item.resizeIgnoreFrom"
      :preserve-aspect-ratio="item.preserveAspectRatio"
      :drag-option="item.dragOption"
      :resize-option="item.resizeOption"
      @resize="(i, newH, newW, newHPx, newWPx) => handleItemResize(i, newH, newW, newHPx, newWPx)"
      @resized="(i, newH, newW, newHPx, newWPx) => handleItemResized(i, newH, newW, newHPx, newWPx)"
      @move="(i, newX, newY) => handleItemMove(i, newX, newY)"
      @moved="(i, newX, newY) => handleItemMoved(i, newX, newY)"
      @container-resized="(i, newH, newW, newHPx, newWPx) => handleItemContainerResized(i, newH, newW, newHPx, newWPx)"
    >
      <GridItemContent :item="item" :readonly="readonly" :show-title="showTitle">
        <template #default="{ item: slotItem }">
          <slot :item="slotItem">
            <!-- Fallback to default content -->
          </slot>
        </template>
      </GridItemContent>
    </GridItem>
  </GridLayout>
</template>

<script setup lang="ts">
/**
 * Grid core components
 * Focus on the core functionality and event handling of grid layout
 */

import { computed, shallowRef, watch } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus'
import GridItemContent from './GridItemContent.vue'
import type { GridLayoutPlusConfig, GridLayoutPlusItem, GridLayoutPlusEmits } from '../gridLayoutPlusTypes'

interface Props {
  /** Grid layout data */
  layout: GridLayoutPlusItem[]
  /** Grid configuration */
  config: GridLayoutPlusConfig
  /** Whether to read-only mode */
  readonly?: boolean
  /** Whether to display grid item titles */
  showTitle?: boolean
}

interface Emits extends GridLayoutPlusEmits {}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showTitle: false
})

const emit = defineEmits<Emits>()

// Internal layout status
const internalLayout = shallowRef<GridLayoutPlusItem[]>([...props.layout])

// Monitor external layout changes
watch(
  () => props.layout,
  newLayout => {
    internalLayout.value = [...newLayout]
  },
  { deep: true }
)

// event handler
const handleLayoutCreated = (event: any) => {
  emit('layout-created', event)
}

const handleLayoutBeforeMount = (event: any) => {
  emit('layout-before-mount', event)
}

const handleLayoutMounted = (event: any) => {
  emit('layout-mounted', event)
}

const handleLayoutUpdated = (event: any) => {
  emit('layout-updated', event)
}

const handleLayoutReady = (event: any) => {
  emit('layout-ready', event)
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  internalLayout.value = newLayout
  emit('layout-change', newLayout)
}

const handleBreakpointChanged = (breakpoint: string, layout: GridLayoutPlusItem[]) => {
  emit('breakpoint-changed', breakpoint, layout)
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

// Expose internal state to parent component
defineExpose({
  internalLayout
})
</script>

<style scoped>
/* Grid Core styles will inherit the styles of the parent component */
</style>
