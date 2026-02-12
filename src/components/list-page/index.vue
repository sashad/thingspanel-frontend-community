<template>
  <div class="advanced-list-container">
    <n-card class="full-height-card" footer-style="padding-top: 0px; padding-bottom: 0px;">
      <div class="advanced-list-layout">
        <!-- search area -->
        <div v-if="shouldShowSearchArea" class="search">
          <div class="search-form-content">
            <slot name="search-form-content" />
          </div>
        </div>
        <n-divider v-if="showAddButton" style="margin-top: 10px; margin-bottom: 10px" />
        <!-- content area -->
        <div class="list-content">
          <!-- Content header -->
          <div class="list-content-header">
            <!-- Left operating area -->
            <div class="list-content-header-left">
              <slot name="header-left">
                <!-- Default new button -->
                <slot name="add-button">
                  <n-button v-if="showAddButton" type="primary" size="small" @click="handleAddNew">
                    <template #icon>
                      <n-icon><plus-icon /></n-icon>
                    </template>
                    {{ getAddButtonText() }}
                  </n-button>
                </slot>
              </slot>
            </div>
            <!-- Right operating area -->
            <div class="list-content-header-right">
              <slot name="header-right">
                <n-space v-if="shouldShowViewSwitcher || hasRefreshButton" align="center">
                  <n-button-group v-if="shouldShowViewSwitcher">
                    <n-button
                      v-for="view in getAvailableViewsWithSlots()"
                      :key="view.key"
                      :type="currentView === view.key ? 'primary' : 'default'"
                      size="small"
                      :title="view.label ? $t(view.label) : view.key"
                      @click="handleViewChange(view.key)"
                    >
                      <n-icon size="14">
                        <component :is="view.icon" />
                      </n-icon>
                    </n-button>
                  </n-button-group>
                  <n-button size="small" :title="$t('buttons.refresh')" @click="handleRefresh">
                    <n-icon size="14"><refresh-icon /></n-icon>
                  </n-button>
                </n-space>
              </slot>
            </div>
          </div>

          <!-- Content body -->

          <div class="list-content-body">
            <div v-if="currentView === 'card' && hasSlot('card-view')" class="view-wrapper">
              <slot name="card-view"></slot>
            </div>
            <div v-else-if="currentView === 'list' && hasSlot('list-view')" class="view-wrapper">
              <slot name="list-view"></slot>
            </div>
            <div v-else-if="currentView === 'map' && hasSlot('map-view')" class="view-wrapper">
              <slot name="map-view"></slot>
            </div>
            <div v-else class="view-wrapper">
              <slot :name="getDefaultViewSlot()"></slot>
            </div>
          </div>
        </div>
      </div>

      <!-- bottom area -->
      <template v-if="hasSlot('footer')" #footer>
        <div class="list-content-footer">
          <slot name="footer" />
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted, onUnmounted, onActivated } from 'vue'
import { useStorage } from '@vueuse/core'
import { NCard, NButton, NButtonGroup, NIcon, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import {
  AddOutline as PlusIcon,
  RefreshOutline as RefreshIcon,
  GridOutline as CardIcon,
  ListOutline as ListIcon,
  MapOutline as MapIcon
} from '@vicons/ionicons5'

// Define component name
defineOptions({
  name: 'AdvancedListLayout'
})

// Props definition
interface ViewItem {
  key: string
  icon: any
  label?: string
}

interface Props {
  addButtonText?: string | (() => string)
  addButtonI18nKey?: string
  initialView?: string
  availableViews?: ViewItem[]
  showQueryButton?: boolean
  showResetButton?: boolean
  showAddButton?: boolean
  mobileBreakpoint?: number // Mobile breakpoints，default768px
  useViewMemory?: boolean // Whether to enable view memory function
  memoryKey?: string // Unique key for view memory
}

const props = withDefaults(defineProps<Props>(), {
  addButtonText: '',
  addButtonI18nKey: 'card.addButton',
  initialView: '',
  availableViews: () => [
    { key: 'card', icon: CardIcon, label: 'common.viewCard' },
    { key: 'list', icon: ListIcon, label: 'common.viewList' },
    { key: 'map', icon: MapIcon, label: 'common.viewMap' }
  ],
  showQueryButton: true,
  showResetButton: true,
  showAddButton: true,
  mobileBreakpoint: 768,
  useViewMemory: false,
  memoryKey: 'advanced-list-view'
})

// Emits definition
const emit = defineEmits<{
  query: [filterData: Record<string, any>]
  reset: []
  'add-new': []
  'view-change': [{ viewType: string }]
  refresh: []
}>()

// Get slot
const slots = useSlots()

// Responsive data
const storageView = props.useViewMemory ? useStorage(props.memoryKey, '') : ref('')
const currentView = ref('')
const windowWidth = ref<number>(window.innerWidth)

// Listen for window size changes
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const shouldShowSearchArea = computed(() => {
  // If there is a search form content slot，or display query/reset button，the search area is displayed
  return hasSlot('search-form-content') || props.showQueryButton || props.showResetButton
})

const shouldShowViewSwitcher = computed(() => {
  const availableSlots = getAvailableViewsWithSlots()
  return availableSlots.length > 1
})

const hasRefreshButton = computed(() => true) // Refresh button always shows

const getAvailableViewsWithSlots = () => {
  return props.availableViews.filter(view => hasSlot(`${view.key}-view`))
}

// method
const hasSlot = (name: string): boolean => {
  return !!slots[name]
}

const getAddButtonText = (): string => {
  // Prefer the text passed in
  if (props.addButtonText) {
    if (typeof props.addButtonText === 'function') {
      return props.addButtonText()
    }
    return props.addButtonText
  }

  // Secondly use internationalizationkey
  if (props.addButtonI18nKey) {
    return $t(props.addButtonI18nKey)
  }

  // Finally use the default value
  return $t('card.addButton')
}

const getDefaultViewSlot = (): string => {
  const availableSlots = getAvailableViewsWithSlots()
  return availableSlots.length > 0 ? `${availableSlots[0].key}-view` : 'list-view'
}

const initializeView = () => {
  const available = getAvailableViewsWithSlots()
  let initial = ''

  // Prioritize from memory storage Get in
  if (props.useViewMemory && storageView.value && available.some(v => v.key === storageView.value)) {
    initial = storageView.value
  }
  // Secondly use initialView prop
  else if (props.initialView && available.some(v => v.key === props.initialView)) {
    initial = props.initialView
  }
  // Finally use the first available view
  else if (available.length > 0) {
    initial = available[0].key
  }
  // default value
  else {
    initial = 'list'
  }

  currentView.value = initial

  // If the memory function is enabled but storage is empty，Then fill it with the initial value
  if (props.useViewMemory && !storageView.value) {
    storageView.value = initial
  }
}

const handleReset = () => {
  // trigger reset event，The parent component is responsible for clearing the form and refreshing data
  emit('reset')
}

const handleAddNew = () => {
  emit('add-new')
}

const handleViewChange = (viewType: string) => {
  if (currentView.value !== viewType && hasSlot(`${viewType}-view`)) {
    currentView.value = viewType
    if (props.useViewMemory) {
      storageView.value = viewType
    }
    emit('view-change', { viewType })
  }
}

const handleRefresh = () => {
  emit('refresh')
}

// life cycle
onMounted(() => {
  initializeView()
  window.addEventListener('resize', handleResize)
})

onActivated(() => {
  initializeView()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* outermost container：Take up the entire height of the parent container */
.advanced-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* card container：Take up remaining height */
.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* main layout container：use flex layout，Ensure height allocation */
.advanced-list-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent content from overflowing */

  /* search area：fixed height，Not participating flex distribute */
  .search {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    z-index: 10; /* Make sure it's above the scrolling content */

    /* Desktop layout */
    .search-form-content {
      flex: 1;
      min-width: 0;
      padding-bottom: 16px;
    }

    .search-button {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }

    /* Mobile layout */
    &:has(.search-button-mobile) {
      flex-direction: column;
      align-items: stretch;

      .search-form-content {
        padding-bottom: 8px;
      }

      .search-button-mobile {
        flex-direction: row;
        gap: 8px;
        width: 100%;

        .mobile-button {
          flex: 1;
        }
      }
    }
  }

  /* List content area：Take up remaining space，The entire area is scrollable */
  .list-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;

    /* Content header：Pinned to top of list content area */
    .list-content-header {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 6px 0;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-shrink: 0;

      .list-content-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .list-content-header-right {
        display: flex;
        align-items: center;
      }
    }

    /* Content body：scrollable area */
    .list-content-body {
      height: 100%;
      margin-top: 20px;

      /* View wrapper：Make sure content displays correctly */
      .view-wrapper {
        height: calc(100% - 66px); /* minuspadding */
        overflow: auto;
      }
    }
  }
}

/* bottom area：fixed height */
.list-content-footer {
  flex-shrink: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: end;
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .search {
    flex-direction: column !important;
    align-items: stretch !important;

    .search-form-content {
      padding-bottom: 8px !important;
    }

    .search-button {
      flex-direction: row !important;
      gap: 8px !important;
      width: 100% !important;

      .n-button {
        flex: 1 !important;
      }
    }
  }
}

/* In order to ensure that naive-ui of Card The component works correctly，Need to override some default styles */
:deep(.n-card__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px; /* Adjust padding as needed */
}

:deep(.full-height-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* make sure n-scrollbar work correctly */
:deep(.n-scrollbar) {
  height: 100%;
}

:deep(.n-scrollbar > .n-scrollbar-container) {
  height: 100%;
}

:deep(.n-scrollbar > .n-scrollbar-container > .n-scrollbar-content) {
  min-height: 100%;
}
</style>
