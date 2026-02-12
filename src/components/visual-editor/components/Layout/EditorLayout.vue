<template>
  <div class="editor-layout h-full w-full flex flex-col" :style="themeColors">
    <!-- toolbar area - Only shown when in edit mode and has slot content -->
    <div
      v-if="showToolbar"
      class="toolbar-area flex-shrink-0 h-12 px-4 flex items-center justify-between transition-all duration-300"
      style="background-color: var(--toolbar-bg); border-bottom: 1px solid var(--panel-border)"
    >
      <slot name="toolbar" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- main content area -->
    <div class="main-content flex-1 flex overflow-hidden" style="background-color: var(--panel-bg)">
      <!-- left area - Only in edit mode、Displayed when there is slot content and is not collapsed -->
      <div
        v-if="showLeft"
        class="left-area flex-shrink-0 overflow-auto transition-all duration-300"
        :style="{
          width: `${leftWidth}px`,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--panel-border)'
        }"
      >
        <slot name="left" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- central editing area - always show -->
      <div class="main-area flex-1 overflow-auto transition-all duration-300" style="background-color: var(--panel-bg)">
        <slot name="main" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- right area - Only in edit mode、Displayed when there is slot content and is not collapsed -->
      <div
        v-if="showRight"
        class="right-area flex-shrink-0 overflow-auto transition-all duration-300"
        :style="{
          width: `${rightWidth}px`,
          backgroundColor: 'var(--sidebar-bg)',
          borderLeft: '1px solid var(--panel-border)'
        }"
      >
        <slot name="right" :mode="props.mode" :isEditMode="isEditMode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useThemeStore } from '@/store/modules/theme'

interface Props {
  mode?: 'edit' | 'preview'
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  leftWidth?: number
  rightWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 280,
  rightWidth: 320
})

const emit = defineEmits<{
  'update:leftCollapsed': [value: boolean]
  'update:rightCollapsed': [value: boolean]
}>()

const slots = useSlots()
const themeStore = useThemeStore()
const isEditMode = computed(() => props.mode === 'edit')

// Theme color computed property
const themeColors = computed(() => {
  const isDark = themeStore.darkMode
  return {
    '--panel-bg': isDark ? '#1f1f1f' : '#f8fafc',
    '--panel-border': isDark ? '#404040' : '#e0e0e0',
    '--panel-shadow': isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    '--toolbar-bg': isDark ? '#1f2937' : '#f8fafc',
    '--sidebar-bg': isDark ? '#252525' : '#fafafa'
  }
})

// Slot existence check
const hasToolbar = computed(() => !!slots.toolbar)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)

// display conditions - Toolbar appears in any mode（If there is slot content）
const showToolbar = computed(() => hasToolbar.value)
// The left and right panels are shown in edit mode，In preview mode, the display can be switched through the toolbar button
const showLeft = computed(() => hasLeft.value && !props.leftCollapsed)
const showRight = computed(() => hasRight.value && !props.rightCollapsed)

// APImethod
const toggleLeft = () => {
  emit('update:leftCollapsed', !props.leftCollapsed)
}

const toggleRight = () => {
  emit('update:rightCollapsed', !props.rightCollapsed)
}

// Expose methods to parent component
defineExpose({
  toggleLeft,
  toggleRight,
  isEditMode: isEditMode.value,
  hasToolbar: hasToolbar.value,
  hasLeft: hasLeft.value,
  hasRight: hasRight.value
})
</script>

<style scoped>
.editor-layout {
  /* Make sure the layout takes up all the space */
  min-height: 0;
}

.main-content {
  /* Make sure the main content area is handled correctly overflow */
  min-height: 0;
}

.left-area,
.right-area,
.main-area {
  /* Prevent child elements from overflowing */
  min-width: 0;
  min-height: 0;
}

/* Custom scroll bar style */
.left-area::-webkit-scrollbar,
.right-area::-webkit-scrollbar,
.main-area::-webkit-scrollbar {
  width: 6px;
}

.left-area::-webkit-scrollbar-track,
.right-area::-webkit-scrollbar-track,
.main-area::-webkit-scrollbar-track {
  background: transparent;
}

.left-area::-webkit-scrollbar-thumb,
.right-area::-webkit-scrollbar-thumb,
.main-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.left-area::-webkit-scrollbar-thumb:hover,
.right-area::-webkit-scrollbar-thumb:hover,
.main-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
