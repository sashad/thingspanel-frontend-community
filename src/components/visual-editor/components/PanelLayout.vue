<script setup lang="ts">
// importVueCore functions、Naive UIComponent and state management
import { computed, useSlots } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'

// Define componentsProps
interface Props {
  mode?: 'edit' | 'preview'
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  leftWidth?: number
  rightWidth?: number
  showHeader?: boolean
  showToolbar?: boolean
  showFooter?: boolean
  headerHeight?: number
  toolbarHeight?: number
  footerHeight?: number
  enableAnimations?: boolean
  customClass?: string
}

// set upPropsThe default value of
const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 380,
  rightWidth: 380,
  showHeader: true,
  showToolbar: true,
  showFooter: false,
  headerHeight: 60,
  toolbarHeight: 48,
  footerHeight: 40,
  enableAnimations: true,
  customClass: ''
})

// Define componentsEmits
const emit = defineEmits<{
  'update:leftCollapsed': [value: boolean]
  'update:rightCollapsed': [value: boolean]
}>()

// Handling the close event of the sidebar drawer
const handleLeftDrawerClose = (show: boolean) => {
  if (!show) emit('update:leftCollapsed', true)
}
const handleRightDrawerClose = (show: boolean) => {
  if (!show) emit('update:rightCollapsed', true)
}

// Get slot and topic status
const slots = useSlots()
const themeStore = useThemeStore()
const isEditMode = computed(() => props.mode === 'edit')

// Dynamically calculate theme colors
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

// Check if each slot exists
const hasHeader = computed(() => !!slots.header)
const hasToolbar = computed(() => !!slots.toolbar)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)
const hasFooter = computed(() => !!slots.footer)

// according toPropsand slot conditions determine whether to display each area
const displayHeader = computed(() => props.showHeader && hasHeader.value)
const displayToolbar = computed(() => props.showToolbar && hasToolbar.value)
const displayLeft = computed(() => isEditMode.value && hasLeft.value && !props.leftCollapsed)
const displayRight = computed(() => isEditMode.value && hasRight.value && !props.rightCollapsed)
const displayFooter = computed(() => props.showFooter && hasFooter.value)

// Dynamic calculationCSSvariable
const cssVariables = computed(() => ({
  ...themeColors.value,
  '--header-height': displayHeader.value ? `${props.headerHeight}px` : '0px',
  '--toolbar-height': displayToolbar.value ? `${props.toolbarHeight}px` : '0px',
  '--footer-height': displayFooter.value ? `${props.footerHeight}px` : '0px'
}))

// Exposed to parent componentAPI
defineExpose({
  toggleLeft: () => emit('update:leftCollapsed', !props.leftCollapsed),
  toggleRight: () => emit('update:rightCollapsed', !props.rightCollapsed),
  isEditMode,
  hasToolbar,
  hasLeft,
  hasRight
})
</script>

<template>
  <div
    class="panel-layout"
    :class="[props.customClass, { 'no-animations': !props.enableAnimations }]"
    :style="cssVariables"
  >
    <!-- Page title area -->
    <div v-if="displayHeader" class="header-area" :style="{ height: 'var(--header-height)' }">
      <slot name="header" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- toolbar area -->
    <div v-if="displayToolbar" class="toolbar-area" :style="{ height: 'var(--toolbar-height)' }">
      <slot name="toolbar" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- main content area -->
    <div class="main-content">
      <!-- central main area -->
      <div ref="mainAreaRef" class="main-area">
        <slot name="main" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- left drawer -->
      <NDrawer
        v-model:show="displayLeft"
        :width="props.leftWidth"
        placement="left"
        :auto-focus="false"
        :trap-focus="false"
        :block-scroll="false"
        :mask-closable="true"
        @update:show="handleLeftDrawerClose"
      >
        <NDrawerContent title="Component library" closable @close="() => handleLeftDrawerClose(false)">
          <slot name="left" :mode="props.mode" :isEditMode="isEditMode" />
        </NDrawerContent>
      </NDrawer>

      <!-- right drawer -->
      <NDrawer
        v-model:show="displayRight"
        :width="props.rightWidth"
        placement="right"
        :auto-focus="false"
        :trap-focus="false"
        :block-scroll="false"
        :mask-closable="true"
        @update:show="handleRightDrawerClose"
      >
        <NDrawerContent title="Property configuration" closable @close="() => handleRightDrawerClose(false)">
          <slot name="right" :mode="props.mode" :isEditMode="isEditMode" />
        </NDrawerContent>
      </NDrawer>
    </div>

    <!-- bottom area -->
    <div v-if="displayFooter" class="footer-area" :style="{ height: 'var(--footer-height)' }">
      <slot name="footer" :mode="props.mode" :isEditMode="isEditMode" />
    </div>
  </div>
</template>

<style scoped>
/* basic layout: useFlexboxImplement vertical layout */
.panel-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--panel-bg);
}

/* Disable animation */
.panel-layout.no-animations * {
  transition: none !important;
}

/* head、Toolbar、bottom area: fixed height，Does not shrink */
.header-area,
.toolbar-area,
.footer-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--panel-border);
  background-color: var(--toolbar-bg);
  z-index: 10;
}
.header-area {
  background-color: var(--panel-bg);
}
.footer-area {
  border-top: 1px solid var(--panel-border);
  border-bottom: none;
}

/* Main content area: Take up all remaining space */
.main-content {
  flex: 1;
  position: relative;
  display: flex;
  min-height: 0; /* flexLayout key attributes，Prevent the container from shrinking when the content overflows */
}

/* central main area: Take up all the space in the main content area，and provide scrolling */
.main-area {
  flex: 1;
  min-width: 0;
  overflow: auto; /* key：Scroll bars are handled here */
  background-color: var(--panel-bg);
}

/* Custom scroll bar style */
.main-area::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.main-area::-webkit-scrollbar-track {
  background: transparent;
}
.main-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 3px;
}
.main-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.6);
}
</style>
