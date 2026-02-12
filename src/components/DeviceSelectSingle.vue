<script setup lang="ts">
/**
 * Device radio selector component
 * Supports infinite scrolling and search functionality
 */

import { computed, ref, watch } from 'vue'
import { NEmpty, NFlex, NInfiniteScroll, NPopover, NSelect, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'

// --- type definition ---
interface DeviceOption {
  device_id: string
  device_name: string
  device_type?: string
  [key: string]: any
}

// --- Props (Type-based) ---
interface Props {
  modelValue: string | null
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
  placeholder: 'Please select a device',
  disabled: false,
  clearable: false
})

// --- Emits (Type-based) ---
interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'loadMore'): void
  (e: 'initialLoad'): void
  (e: 'search', keyword: string): void
}

const emit = defineEmits<Emits>()

// --- Combined functions ---
const { t } = useI18n()

// --- internal state ---
/** control Popover Whether to display */
const showPopover = ref(false)
/** Search keywords */
const searchKeyword = ref('')

// --- Computed properties ---
/** Selected device options */
const selectedOption = computed(() => {
  if (!props.modelValue) return null
  return props.options.find(opt => opt.device_id === props.modelValue) || null
})

/** show label */
const displayLabel = computed(() => {
  if (!selectedOption.value) return ''
  return selectedOption.value.device_name
})

/** List of options filtered by search keywords */
const filteredOptions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.options
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return props.options.filter(
    option =>
      option.device_name.toLowerCase().includes(keyword) ||
      option.device_id.toLowerCase().includes(keyword)
  )
})

// --- method ---
/** Handling infinite scroll loading events */
const handleLoadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('loadMore')
  }
}

/**
 * Handling option click events
 *
 * @param deviceId The device on which the option was clicked ID
 */
const handleOptionClick = (deviceId: string) => {
  if (props.modelValue === deviceId) {
    // If you click on a selected option，then uncheck
    emit('update:modelValue', null)
  } else {
    // Check new options
    emit('update:modelValue', deviceId)
  }
  // Close pop-up window after selection
  showPopover.value = false
}

/**
 * when Popover Triggered when display status changes
 *
 * @param show Whether to display
 */
const handlePopoverUpdateShow = (show: boolean) => {
  showPopover.value = show
  if (show) {
    // Reset search keywords
    searchKeyword.value = ''
    // When first expanded with no options，Trigger initial load
    if (props.options.length === 0) {
      emit('initialLoad')
    }
  }
}

/**
 * Handling search events
 *
 * @param searchValue Search keywords
 */
const handleSearch = (searchValue: string) => {
  searchKeyword.value = searchValue
  emit('search', searchValue)
}

/**
 * Check if an option is selected
 *
 * @param deviceId equipment ID
 */
const isSelected = (deviceId: string): boolean => {
  return props.modelValue === deviceId
}

/**
 * Clear selection
 */
const handleClear = () => {
  emit('update:modelValue', null)
}
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
          :value="displayLabel"
          :options="[]"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :show-arrow="true"
          :show="false"
          filterable
          :clearable="props.clearable"
          :multiple="false"
          class="select-input"
          @search="handleSearch"
          @clear="handleClear"
        >
          <template #value>
            <span v-if="displayLabel" class="device-display-name">{{ displayLabel }}</span>
            <span v-else class="placeholder-text">{{ props.placeholder }}</span>
          </template>
        </NSelect>
      </div>
    </template>

    <!-- Popover content -->
    <div class="device-select-popover-content">
      <NInfiniteScroll
        class="options-scroll-container"
        :distance="10"
        @load="handleLoadMore"
      >
        <div v-if="filteredOptions && filteredOptions.length > 0" class="options-list">
          <div
            v-for="option in filteredOptions"
            :key="option.device_id"
            class="device-option-item"
            :class="{ 'is-selected': isSelected(option.device_id) }"
            @click="handleOptionClick(option.device_id)"
          >
            <span class="option-label">{{ option.device_name }}</span>
            <span v-if="option.device_type" class="option-type">{{ option.device_type }}</span>
          </div>
        </div>
        <NEmpty
          v-else-if="!props.loading"
          :description="searchKeyword ? 'No matching device found' : t('common.noData') || 'No data yet'"
          class="empty-placeholder"
        />

        <!-- Loading prompt -->
        <NFlex v-if="props.loading" justify="center" class="loading-indicator">
          <NSpin size="small" />
          <span class="loading-text">{{ t('card.loading') || 'loading...' }}</span>
        </NFlex>

        <!-- no more prompts -->
        <NFlex
          v-if="!props.loading && !props.hasMore && filteredOptions && filteredOptions.length > 0"
          justify="center"
          class="no-more-indicator"
        >
          {{ t('common.noMoreData') || 'no more' }}
        </NFlex>
      </NInfiniteScroll>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.device-select-popover {
  padding: 0 !important;
}

.select-trigger-wrapper {
  position: relative;
  width: 100%;
}

.select-input {
  cursor: pointer;
  width: 100%;
}

.device-select-popover-content {
  max-height: 300px;
  overflow-y: auto;
}

.options-scroll-container {
  // NInfiniteScroll internal style
}

.options-list {
  // List container style
}

.device-option-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--n-option-color-pending, #f0f0f0);
  }

  &.is-selected {
    background-color: var(--n-option-color-active, #e6f7ff);
    font-weight: 500;
  }
}

.option-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.option-type {
  font-size: 12px;
  color: var(--text-color-3);
  background-color: var(--n-tag-color, #f5f5f5);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.empty-placeholder {
  padding: 20px 0;
}

.loading-indicator {
  padding: 10px 0;
}

.loading-text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-color-3);
}

.no-more-indicator {
  padding: 10px 0;
  color: var(--text-color-3);
  font-size: 12px;
}

.device-display-name {
  font-size: 14px;
  color: var(--text-color);
}

.placeholder-text {
  font-size: 14px;
  color: var(--text-color-3);
}
</style>