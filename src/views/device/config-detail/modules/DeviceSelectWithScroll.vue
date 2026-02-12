<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NCheckbox, NEmpty, NFlex, NInfiniteScroll, NPopover, NSelect, NSpin } from 'naive-ui'
import { $t } from '@/locales'

// --- type definition ---
interface DeviceOption {
  device_id: string
  device_name: string
  // Other attributes can be added as needed
  [key: string]: any // Allow other attributes
}

// --- Props (Type-based) ---
interface Props {
  modelValue: string[] | null
  options: DeviceOption[]
  loading?: boolean
  hasMore?: boolean
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  loading: false,
  hasMore: true,
  placeholder: () => $t('common.selectPlaceholder') || 'Please select',
  disabled: false,
  clearable: false
})

// --- Emits (Type-based) ---
interface Emits {
  (e: 'update:modelValue', value: string[] | null): void
  (e: 'loadMore'): void
  (e: 'initialLoad'): void
}
const emit = defineEmits<Emits>()

// --- internal state ---
/** control Popover Whether to display */
const showPopover = ref(false)
/** Internal maintenance options ID list，and modelValue synchronous */
const selectedDeviceIds = ref<string[]>([])
/** Search keywords */
const searchKeyword = ref('')

// --- Computed properties ---
/** will be selected ID Map back to full device object，used for NSelect of render-tag */
const selectedOptions = computed(() => {
  if (!selectedDeviceIds.value || selectedDeviceIds.value.length === 0) {
    return []
  }
  // optimization：Create a ID Mapping to options，Avoid traversing every time options
  const optionsMap = new Map(props.options.map(opt => [opt.device_id, opt]))
  // Notice：This may only contain the current options selected in list，if modelValue Contains items that have not yet been loaded，they won't show
  // If needed show all（including not loaded）selected tags，Requires more complex logic，The parent component may need to pass in the selected object
  return selectedDeviceIds.value.map(id => optionsMap.get(id)).filter((opt): opt is DeviceOption => Boolean(opt)) // Filter out options not found
})

/** List of options filtered by search keywords */
const filteredOptions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.options
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return props.options.filter(
    option => option.device_name.toLowerCase().includes(keyword) || option.device_id.toLowerCase().includes(keyword)
  )
})

// --- method ---
/** Handling infinite scroll loading events */
const handleLoadMore = () => {
  if (!props.loading && props.hasMore) {
    if (process.env.NODE_ENV === 'development') {
    } // debug log
    emit('loadMore')
  }
}

/**
 * Handling option click events
 *
 * @param deviceId The device on which the option was clicked ID
 */
const handleOptionClick = (deviceId: string) => {
  const index = selectedDeviceIds.value.indexOf(deviceId)
  if (index > -1) {
    // if selected，then uncheck
    selectedDeviceIds.value.splice(index, 1)
  } else {
    // if not selected，then add selected
    selectedDeviceIds.value.push(deviceId)
  }
  // trigger v-model renew
  emit('update:modelValue', [...selectedDeviceIds.value]) // Make sure to emit the new array
}

/**
 * when Popover Triggered when display status changes
 *
 * @param show Whether to display
 */
const handlePopoverUpdateShow = (show: boolean) => {
  showPopover.value = show
  if (show && (!props.options || props.options.length === 0)) {
    // When first expanded with no options，Trigger initial load
    if (process.env.NODE_ENV === 'development') {
    } // debug log
    emit('initialLoad')
  }
}

/**
 * Handling search events
 *
 * @param searchValue Search keywords
 */
const handleSearch = (searchValue: string) => {
  // Update search keywords，Trigger filtering
  searchKeyword.value = searchValue
}

/**
 * Check if an option is selected
 *
 * @param deviceId equipment ID
 */
const isSelected = (deviceId: string): boolean => {
  return selectedDeviceIds.value.includes(deviceId)
}

// --- Watchers ---
/** Listen to external modelValue changes，Sync to internal selectedDeviceIds */
watch(
  () => props.modelValue,
  newVal => {
    if (newVal === null) {
      selectedDeviceIds.value = []
    } else if (Array.isArray(newVal)) {
      // Avoid unnecessary updates，Compare array contents
      if (JSON.stringify(newVal) !== JSON.stringify(selectedDeviceIds.value)) {
        selectedDeviceIds.value = [...newVal]
      }
    }
  },
  { immediate: true, deep: true } // Execute immediately，Deep monitoring（虽然通常不需要Deep monitoring ID array）
)
</script>

<template>
  <NPopover
    trigger="click"
    placement="bottom-start"
    class="device-select-popover"
    width="trigger"
    :show="showPopover"
    :disabled="props.disabled"
    @update:show="handlePopoverUpdateShow"
  >
    <!-- trigger -->
    <template #trigger>
      <div class="select-trigger-wrapper" :class="{ 'is-disabled': props.disabled }">
        <NSelect
          :value="selectedDeviceIds"
          :options="selectedOptions"
          value-field="device_id"
          label-field="device_name"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :show-arrow="true"
          :show="false"
          filterable
          clearable
          multiple
          class="select-input"
          @update:value="value => emit('update:modelValue', value)"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- Popover content -->
    <div class="device-select-popover-content">
      <NInfiniteScroll class="options-scroll-container" :distance="10" @load="handleLoadMore">
        <div v-if="filteredOptions && filteredOptions.length > 0" class="options-list">
          <div
            v-for="option in filteredOptions"
            :key="option.device_id"
            class="device-option-item"
            :class="{ 'is-selected': isSelected(option.device_id) }"
            @click="handleOptionClick(option.device_id)"
          >
            <NCheckbox :checked="isSelected(option.device_id)" class="option-checkbox" />
            <span class="option-label">{{ option.device_name }}</span>
          </div>
        </div>
        <NEmpty
          v-else-if="!props.loading"
          :description="searchKeyword ? 'No matching device found' : $t('common.noData') || 'No data yet'"
          class="empty-placeholder"
        />

        <!-- Loading prompt：put on NInfiniteScroll end of content -->
        <NFlex v-if="props.loading" justify="center" class="loading-indicator">
          <NSpin size="small" />
          <span class="loading-text">{{ $t('card.loading') }}</span>
        </NFlex>

        <!-- no more prompts -->
        <NFlex
          v-if="!props.loading && !props.hasMore && filteredOptions && filteredOptions.length > 0"
          justify="center"
          class="no-more-indicator"
        >
          {{ $t('common.noMoreData') || 'no more' }}
        </NFlex>
      </NInfiniteScroll>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.device-select-popover {
  padding: 0 !important; // Override default popover padding
  // Remove fixed width limit，hand over width="trigger"
  // width: 100%;
  // max-width: 400px;
}

.select-trigger-wrapper {
  position: relative;
  width: 100%;
  // No clear icon styles needed anymore
}

.select-input {
  cursor: pointer;
  width: 100%;
}

.device-select-popover-content {
  // Restore height limit and scrolling for outer containers
  max-height: 300px;
  overflow-y: auto;
}

.options-scroll-container {
  // remove interior NInfiniteScroll height limit
  // max-height: 300px;
}

.options-list {
  // Optional: Styles for the list container if needed
}

.device-option-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--n-option-color-pending, #f0f0f0); // Added fallback color
  }

  // &.is-selected { // Selection indicated by checkbox, avoid background change
  //   font-weight: bold;
  // }
}

.option-checkbox {
  margin-right: 8px;
}

.option-label {
  // Optional: Styles for the label text
}

.empty-placeholder {
  padding: 20px 0;
}

.loading-indicator {
  padding: 10px 0;
}

.loading-text {
  margin-left: 8px;
}

.no-more-indicator {
  padding: 10px 0;
  color: #999;
}
</style>
