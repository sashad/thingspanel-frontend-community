<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- card title bar - Compact design -->
    <div class="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-2">
        <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">
          <Icon icon="mdi:database-arrow-up" class="text-sm text-green-600 dark:text-green-400" />
        </div>
        <h3 class="text-sm font-medium text-gray-800 dark:text-gray-100">
          {{ $t('card.reportedData.title') }}
        </h3>
      </div>

      <!-- refresh button - smaller size -->
      <n-button
        text
        size="tiny"
        :type="isRefreshing ? 'primary' : 'default'"
        :loading="isFetchingUpdate && !isRefreshing"
        class="hover:bg-green-50 dark:hover:bg-green-900 px-2 py-1 rounded transition-colors"
        @click="toggleRefresh"
      >
        <template #icon>
          <Icon
            icon="mdi:refresh"
            class="text-xs"
            :class="{ 'animate-spin': isRefreshing }"
          />
        </template>
      </n-button>
    </div>

    <!-- content area - reduce padding -->
    <div class="flex-1 p-2 overflow-hidden">
      <n-spin :show="loading">
        <!-- error status -->
        <n-alert v-if="error && !loading" type="error" :title="$t('common.error')" class="mb-4">
          {{ error.message || $t('card.fetchError') }}
        </n-alert>

        <!-- No data status -->
        <n-empty
          v-if="!loading && !error && (!devices || devices.length === 0)"
          :description="$t('card.noData')"
          class="h-full flex items-center justify-center"
        >
          <template #icon>
            <Icon icon="mdi:database-off-outline" class="text-4xl text-gray-400" />
          </template>
        </n-empty>

        <!-- Device list - reduce spacing -->
        <div v-else-if="!loading && devices && devices.length > 0" class="h-full overflow-auto">
          <n-spin :show="isFetchingUpdate && !loading">
            <div class="space-y-2">
              <div
                v-for="(device, index) in devices"
                :key="device.device_id"
                class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                :class="{
                  'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20': index === 0
                }"
              >
                <!-- Device title - reduce padding -->
                <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 flex-1 min-w-0">
                      <Icon icon="mdi:devices" class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span
                        class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                        :title="device.device_name"
                      >
                        {{ device.device_name }}
                      </span>
                      <n-tag
                        :type="device.is_online === 1 ? 'success' : 'default'"
                        size="small"
                        round
                        class="flex-shrink-0"
                      >
                        {{ device.is_online === 1 ? $t('custom.devicePage.online') : $t('custom.devicePage.offline') }}
                      </n-tag>
                    </div>

                    <!-- Last push time -->
                    <div class="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Icon icon="mdi:clock-outline" class="text-xs" />
                      <span>{{ formatRelativeTime(device.last_push_time) }}</span>
                    </div>
                  </div>
                </div>

                <!-- telemetry data area - reduce padding -->
                <div class="px-3 py-2">
                  <BottomUpInfiniteScroller
                    v-if="device.telemetry_data && device.telemetry_data.length > 0"
                    :list="getPairedTelemetry(device.telemetry_data)"
                    height="60px"
                    class="border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden"
                  >
                    <template #default="{ item: pair }">
                      <div class="grid grid-cols-2 gap-2 px-2 py-1.5 text-xs border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                        <!-- left column -->
                        <div v-if="pair.left" class="space-y-1">
                          <div
                            class="text-gray-600 dark:text-gray-400 truncate"
                            :title="pair.left.label || pair.left.key"
                          >
                            {{ pair.left.label || pair.left.key }}
                          </div>
                          <div
                            class="font-medium text-gray-900 dark:text-gray-100 truncate"
                            :title="String(pair.left.value)"
                          >
                            {{ formatValue(pair.left) }}
                          </div>
                        </div>
                        <div v-else class="h-8"></div>

                        <!-- right column -->
                        <div v-if="pair.right" class="space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3">
                          <div
                            class="text-gray-600 dark:text-gray-400 truncate"
                            :title="pair.right.label || pair.right.key"
                          >
                            {{ pair.right.label || pair.right.key }}
                          </div>
                          <div
                            class="font-medium text-gray-900 dark:text-gray-100 truncate"
                            :title="String(pair.right.value)"
                          >
                            {{ formatValue(pair.right) }}
                          </div>
                        </div>
                        <div v-else class="h-8"></div>
                      </div>
                    </template>
                  </BottomUpInfiniteScroller>

                  <!-- No telemetry data - reduce padding -->
                  <div v-else class="text-xs text-center py-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded-md">
                    {{ $t('card.reportedData.noTelemetry') }}
                  </div>
                </div>
              </div>
            </div>
          </n-spin>
        </div>
      </n-spin>
    </div>

    <!-- Bottom link - reduce padding -->
    <div class="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <div class="text-center">
        <router-link
          to="/device/manage"
          class="text-blue-600 dark:text-blue-400 text-xs hover:underline inline-flex items-center space-x-1 transition-colors"
        >
          <span>{{ $t('card.viewAll') }}</span>
          <Icon icon="mdi:arrow-right" class="text-xs" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Device reporting data component
 * Display the latest telemetry data reported by the device，Support real-time refresh and online status display
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NSpin, NEmpty, NTag, NButton, NAlert } from 'naive-ui'
import { $t } from '@/locales'
import { getLatestTelemetryData } from '@/service/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import BottomUpInfiniteScroller from '@/components/BottomUpInfiniteScroller.vue'

dayjs.extend(relativeTime)

// Interface definition
interface TelemetryItem {
  key: string
  label: string | null
  unit: string | null
  value: any
}

interface DeviceData {
  device_id: string
  device_name: string
  is_online: number
  last_push_time: string
  telemetry_data: TelemetryItem[]
}

interface ApiLatestTelemetryResponse {
  data: DeviceData[] | null
  error: any
}

interface PairedTelemetryItem {
  left: TelemetryItem | null
  right: TelemetryItem | null
}

// Responsive state
const devices = ref<DeviceData[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const isRefreshing = ref(true)
const refreshIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
const REFRESH_INTERVAL = 6000
const isFetchingUpdate = ref(false)

// current locale
const currentLocale = computed(() => dayjs.locale())

/**
 * Pairing telemetry data（Two columns display）
 */
const getPairedTelemetry = (telemetry: TelemetryItem[]): PairedTelemetryItem[] => {
  if (!Array.isArray(telemetry)) return []
  const paired: PairedTelemetryItem[] = []
  for (let i = 0; i < telemetry.length; i += 2) {
    paired.push({
      left: telemetry[i] || null,
      right: telemetry[i + 1] || null
    })
  }
  return paired
}

/**
 * Get data
 */
const fetchData = async (initialLoad = false) => {
  if (initialLoad) {
    loading.value = true
  } else {
    isFetchingUpdate.value = true
  }
  error.value = null

  try {
    const response: ApiLatestTelemetryResponse = await getLatestTelemetryData()
    if (response.error) {
      let errorMessage = $t('card.fetchError')
      if (typeof response.error === 'string') errorMessage = response.error
      else if (typeof response.error === 'object' && response.error !== null && (response.error as any).message)
        errorMessage = (response.error as any).message
      error.value = new Error(errorMessage)
      devices.value = []
    } else {
      devices.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (err) {
    const catchErrorMessage = err instanceof Error ? err.message : $t('card.unknownError')
    error.value = new Error(catchErrorMessage)
    devices.value = []
  } finally {
    if (initialLoad) {
      loading.value = false
    }
    isFetchingUpdate.value = false
  }
}

/**
 * Start polling
 */
const startPolling = () => {
  stopPolling()
  if (!isRefreshing.value) return

  refreshIntervalId.value = setInterval(() => {
    fetchData(false)
  }, REFRESH_INTERVAL)
}

/**
 * Stop polling
 */
const stopPolling = () => {
  if (refreshIntervalId.value) {
    clearInterval(refreshIntervalId.value)
    refreshIntervalId.value = null
  }
}

/**
 * Toggle refresh status
 */
const toggleRefresh = () => {
  isRefreshing.value = !isRefreshing.value
  if (isRefreshing.value) {
    fetchData(false)
    startPolling()
  } else {
    stopPolling()
  }
}

/**
 * Format relative time
 */
const formatRelativeTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-'
  const time = dayjs(timeStr).locale(currentLocale.value)
  if (!time.isValid()) return '-'
  const now = dayjs().locale(currentLocale.value)
  if (now.diff(time, 'minute') < 1) return $t('time.justNow', 'just')
  return time.fromNow()
}

/**
 * Format telemetry values
 */
const formatValue = (item: TelemetryItem | any): string => {
  if (item !== null && typeof item !== 'object') {
    if (typeof item === 'string') return item
    if (typeof item === 'number') return String(item)
    if (typeof item === 'boolean') return item ? $t('card.yes') : $t('card.no')
    return String(item)
  }

  if (!item || item.value === null || item.value === undefined) return '-'
  const value = item.value
  const key = item.key
  const unit = item.unit
  let displayValue = ''

  if (typeof value === 'boolean') {
    displayValue = value ? $t('card.yes') : $t('card.no')
    if (key?.includes('switch')) {
      displayValue = value ? $t('card.on') : $t('card.off')
    }
  } else if (typeof value === 'number') {
    if (
      (key === 'temperature' ||
        key === 'humidity' ||
        (typeof key === 'string' && (key.toLowerCase().includes('temp') || key.toLowerCase().includes('hum')))) &&
      value != null
    ) {
      displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1)
    } else {
      displayValue = String(value)
    }
  } else {
    displayValue = String(value)
  }

  if (unit) {
    if (['%', '°C', '°F'].includes(unit)) {
      displayValue += unit
    } else if (unit.trim()) {
      displayValue += ` ${unit.trim()}`
    }
  }

  return displayValue
}

// life cycle
onMounted(() => {
  fetchData(true)
  if (isRefreshing.value) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

defineOptions({
  name: 'ReportedDataCard21'
})
</script>

<style scoped>
/* Custom scroll bar style */
:deep(.n-scrollbar-rail) {
  border-radius: 4px;
}

/* rotation animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>