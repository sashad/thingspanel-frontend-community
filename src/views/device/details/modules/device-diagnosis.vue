<script setup lang="ts">
import { h, onMounted, onUnmounted, nextTick, ref } from 'vue'
import dayjs from 'dayjs'

import { $t } from '@/locales'
import { Refresh, HelpCircleOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import { deviceDiagnostics, getDeviceDebugStatus, setDeviceDebugStatus, getDeviceDebugLogs } from '@/service/api'

// type definition
interface StatisticsItem {
  success: number
  total: number
  rate: number
}

// Statistics type
interface Statistics {
  uplink: StatisticsItem
  downlink: StatisticsItem
  storage: StatisticsItem
}

// Failure record type
interface FailureRecord {
  timestamp: string
  direction: 'uplink' | 'downlink'
  stage: string
  error: string
}

// Diagnostic Statistics Type
interface DiagnosticsStatsItem {
  success?: number
  total?: number
  success_rate?: number
}

// Diagnostic Statistics Type
interface DiagnosticsStats {
  uplink?: DiagnosticsStatsItem
  downlink?: DiagnosticsStatsItem
  storage?: DiagnosticsStatsItem
}

// Diagnostic data type
interface DiagnosticsData {
  stats?: DiagnosticsStats
  recent_failures?: Array<{
    timestamp?: string | number
    direction?: 'uplink' | 'downlink'
    stage?: string
    error?: string
  }>
}

// Diagnostic response type
interface DiagnosticsResponse {
  data?: DiagnosticsData
}

// Property definition props
const props = defineProps<{
  id: string
}>()

// Statistics
const statistics = ref<Statistics>({
  uplink: {
    success: 0,
    total: 0,
    rate: 0
  },
  downlink: {
    success: 0,
    total: 0,
    rate: 0
  },
  storage: {
    success: 0,
    total: 0,
    rate: 0
  }
})

// Failure record table data
const failureRecords = ref<FailureRecord[]>([])

// table column definition
const columns: DataTableColumns<FailureRecord> = [
  {
    title: $t('custom.device_details.time'),
    key: 'timestamp',
    width: 200,
    render: (row: FailureRecord) => {
      if (row.timestamp) {
        return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
      }
      return '--'
    }
  },
  {
    title: $t('custom.device_details.direction'),
    key: 'direction',
    width: 150,
    render: (row: FailureRecord) => {
      const direction =
        row.direction === 'uplink' ? $t('custom.device_details.uplink') : $t('custom.device_details.downlink')
      return h('span', {}, { default: () => direction })
    }
  },
  {
    title: $t('custom.device_details.phase'),
    key: 'stage',
    width: 200
  },
  {
    title: $t('custom.device_details.errorDescription'),
    key: 'error',
    ellipsis: {
      tooltip: true
    }
  }
]

// Get diagnostic data
const fetchDiagnostics = async () => {
  try {
    const response = await deviceDiagnostics(props.id) as DiagnosticsResponse
    const data = response?.data || (response as unknown as DiagnosticsData)

    if (data && data.stats) {
      // Update statistics
      statistics.value = {
        uplink: {
          success: data.stats.uplink?.success ?? 0,
          total: data.stats.uplink?.total ?? 0,
          rate: data.stats.uplink?.success_rate ?? 0
        },
        downlink: {
          success: data.stats.downlink?.success ?? 0,
          total: data.stats.downlink?.total ?? 0,
          rate: data.stats.downlink?.success_rate ?? 0
        },
        storage: {
          success: data.stats.storage?.success ?? 0,
          total: data.stats.storage?.total ?? 0,
          rate: data.stats.storage?.success_rate ?? 0
        }
      }

      // Update failed record
      if (Array.isArray(data.recent_failures)) {
        failureRecords.value = data.recent_failures.map((failure) => ({
          timestamp: String(failure.timestamp ?? ''),
          direction: (failure.direction ?? 'uplink') as 'uplink' | 'downlink',
          stage: failure.stage ?? '',
          error: failure.error ?? ''
        }))
      } else {
        failureRecords.value = []
      }
    }
  } catch (error) {
  }
}

// Refresh data
const refresh = () => {
  fetchDiagnostics()
  getLogStatus()
}

// Log related
const logEnabled = ref(false)
const debugLogs = ref<string[]>([])
let logTimer: NodeJS.Timeout | null = null
const logContainerRef = ref<HTMLElement | null>(null)

// Get log switch status
const getLogStatus = async () => {
  try {
    const res = await getDeviceDebugStatus(props.id)
    if (res.data) {
      logEnabled.value = res.data.enabled
    }
  } catch (e) {
    console.error(e)
  }
}

// Toggle log switch
const handleLogSwitch = async (value: boolean) => {
  try {
    await setDeviceDebugStatus(props.id, { enabled: value })
    logEnabled.value = value
  } catch (e) {
    console.error(e)
    // Restore switch status
    logEnabled.value = !value
  }
}

// Get log
const fetchLogs = async () => {
  try {
    const res = await getDeviceDebugLogs(props.id, { limit: 100 })
    if (res.data && res.data.list) {
      // Format log display
      // Sort in reverse order，The latest is below，Comply with console habits
      const list = res.data.list.reverse()
      debugLogs.value = list.map((item: any) => {
         const time = item.ts ? dayjs(item.ts).format('YYYY-MM-DD HH:mm:ss.SSS') : '' // eslint-disable-line
         return `[${time}] ${JSON.stringify(item)}`
      })
      
      // Automatically scroll to bottom
      nextTick(() => {
        if (logContainerRef.value) {
            // If the user doesn't scroll up too far，to automatically scroll
            // Simple processing here，always scroll to bottom
          logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
        }
      })
    }
  } catch (e) {
    console.error(e)
  }
}

// Start polling logs
const startLogPolling = () => {
  if (logTimer) return
  fetchLogs() // Execute once immediately
  logTimer = setInterval(fetchLogs, 3000) // Every3Query once per second
}

// Stop polling logs
const stopLogPolling = () => {
  if (logTimer) {
    clearInterval(logTimer)
    logTimer = null
  }
}

onMounted(() => {
  fetchDiagnostics()
  getLogStatus()
  startLogPolling()
})

onUnmounted(() => {
  stopLogPolling()
})
</script>

<template>
  <div>
    <!-- Statistics overview section -->
    <div class="mb-4">
      <div class="flex items-center justify-between">
        <div class="text-18px">{{ $t('custom.device_details.statisticsOverview') }}</div>
        <NButton :bordered="false" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('common.refresh') }}
        </NButton>
      </div>
      <!-- <div class="text-14px text-gray-500">
        {{ $t('custom.device_details.statisticsRange') }}
      </div> -->
      <NFlex :gap="16" class="mt-4">
        <!-- Upward success rate card -->
        <NCard class="flex-1" :title="$t('custom.device_details.uplinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="info" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.uplink.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">{{ statistics.uplink.success }}/{{ statistics.uplink.total }}strip</NText>
          </NFlex>
        </NCard>

        <!-- Downward success rate card -->
        <NCard class="flex-1" :title="$t('custom.device_details.downlinkSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="success" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.downlink.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">
              {{ statistics.downlink.success }}/{{ statistics.downlink.total }}strip
            </NText>
          </NFlex>
        </NCard>

        <!-- Store success rate card -->
        <NCard class="flex-1" :title="$t('custom.device_details.storageSuccessRate')">
          <NFlex vertical :gap="8">
            <NText type="warning" class="text-28px font-bold">
              <NNumberAnimation :from="0" :to="statistics.storage.rate" :precision="1" />
              <span>%</span>
            </NText>
            <NText :depth="2" class="text-14px">
              {{ statistics.storage.success }}/{{ statistics.storage.total }}strip
            </NText>
          </NFlex>
        </NCard>
      </NFlex>
    </div>

    <!-- Recent failure record section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="text-18px">
          {{ $t('custom.device_details.recentFailureRecords') }}
        </div>
      </div>

      <NDataTable :columns="columns" :data="failureRecords" :max-height="350" remote />
    </div>

    <!-- Device debugging log section -->
    <div class="mt-4">
      <div class="flex items-center justify-between mb-4">
        <div class="text-18px">Device debugging log</div>
        <div class="flex items-center gap-2">
          <NTooltip trigger="hover">
            <template #trigger>
              <div class="flex items-center gap-1 cursor-help">
                <span>debug mode</span>
                <NIcon size="14" class="text-gray-400">
                  <HelpCircleOutline />
                </NIcon>
              </div>
            </template>
            After opening，The system will record the communication messages of the device for troubleshooting。
          </NTooltip>
          <NSwitch :value="logEnabled" @update:value="handleLogSwitch" />
        </div>
      </div>

      <div
        ref="logContainerRef"
        class="bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 rounded h-[400px] overflow-auto whitespace-pre-wrap break-all text-xs"
      >
        <div v-if="debugLogs.length === 0" class="text-center text-gray-500 py-10">
          No logs yet...
        </div>
        <div v-for="(log, index) in debugLogs" :key="index" class="mb-1 border-b border-gray-700/50 pb-1 last:border-0 hover:bg-[#2a2d2e]">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card-header) {
  font-size: 16px;
}
</style>

