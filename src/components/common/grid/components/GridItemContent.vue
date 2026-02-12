<!--
  Grid Item Content rendering component
  Responsible for content rendering and style processing of individual grid items
-->
<template>
  <div class="grid-item-content" :class="item.className" :style="item.style">
    <!-- title bar -->
    <div v-if="!readonly && showTitle" class="grid-item-header">
      <span class="grid-item-title">{{ getItemTitle(item) }}</span>
    </div>

    <!-- content area -->
    <div class="grid-item-body">
      <slot :item="item">
        <!-- default content -->
        <div class="default-item-content">
          <div class="item-type">{{ item.type || 'components' }}</div>
          <div class="item-id">{{ item.i }}</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Grid Item content component
 * Focus on the rendering and display of grid item content
 */

import type { GridLayoutPlusItem } from '../gridLayoutPlusTypes'

interface Props {
  /** Grid item data */
  item: GridLayoutPlusItem
  /** Whether to read-only mode */
  readonly?: boolean
  /** Whether to display title */
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showTitle: false
})

/**
 * Get grid item title
 * priority: title > type > Default format
 */
const getItemTitle = (item: GridLayoutPlusItem): string => {
  return item.title || item.type || `project ${item.i}`
}
</script>

<style scoped>
.grid-item-content {
  width: 100%;
  height: 100%; /* 🔧 restore altitude100%To support adaptive height in grid containers */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 🔧 recoveroverflow hiddenEnsure content does not exceed container */
}

.grid-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-color);
  flex-shrink: 0;
}

.grid-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
}

.grid-item-body {
  flex: 1;
  padding: 12px;
  overflow: hidden; /* 🔧 recoveroverflow hiddenEnsure content does not exceed container */
}

.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-color-3);
}

.item-type {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
}

/* Respond to theme changes */
[data-theme='dark'] .grid-item-header {
  border-bottom-color: var(--border-color);
}
</style>
