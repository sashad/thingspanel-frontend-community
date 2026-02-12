<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- card title bar -->
    <div class="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <Icon icon="mdi:alert-circle-outline" class="text-lg text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.alarmInfo.title', 'Alarm information') }}
        </h3>
      </div>
      <n-button
        text
        size="small"
        type="primary"
        class="hover:bg-blue-50 dark:hover:bg-blue-900 px-3 py-1 rounded-lg transition-colors"
        @click="viewAllAlarms"
      >
        <template #icon>
          <Icon icon="mdi:arrow-right" />
        </template>
        {{ $t('card.alarmInfo.viewAll', 'View all') }}
      </n-button>
    </div>

    <div class="flex-1 overflow-hidden">
      <div class="h-full overflow-auto">
        <n-data-table
          v-if="!loading"
          :columns="columns"
          :data="alarmList"
          :bordered="false"
          striped
          size="small"
          class="min-h-full"
          :scroll-x="600"
          :max-height="400"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Alarm information component
 * Display the latest alarm information list，Contains the alarm name、state、content and time
 */
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { NSpin, NTag, NButton, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import { alarmHistory } from '@/service/api/alarm'
import { $t } from '@/locales'

interface AlarmData {
  id: string
  create_at: string
  name: string
  content: string
  alarm_status: string
}

const loading = ref(true)
const alarmList = ref<AlarmData[]>([])
const router = useRouter()

/**
 * Format time display，Keep with the original1:1consistent
 */
const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * Get alarm status information
 */
const getStatusInfo = (
  status: string
): { label: string; type: 'default' | 'error' | 'warning' | 'info' | 'success' } => {
  switch (status) {
    case 'H':
      return { label: $t('common.highAlarm'), type: 'error' }
    case 'M':
      return { label: $t('common.intermediateAlarm'), type: 'warning' }
    case 'L':
      return { label: $t('common.lowAlarm'), type: 'info' }
    case 'N':
      return { label: $t('common.normal'), type: 'success' }
    default:
      return { label: status, type: 'default' }
  }
}

/**
 * Data table column definition
 */
const columns: DataTableColumns<AlarmData> = [
  {
    key: 'name',
    title: $t('generate.alarm-name'),
    width: 170,
    ellipsis: {
      tooltip: true
    }
  },

  {
    key: 'alarm_status',
    title: $t('generate.alarm-status'),
    width: 90,
    render(row) {
      const statusInfo = getStatusInfo(row.alarm_status)
      return h(NTag, { type: statusInfo.type, size: 'small', round: true }, { default: () => statusInfo.label })
    }
  },
  {
    key: 'content',
    title: $t('generate.alarm-content'),
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'create_at',
    title: $t('common.alarm_time'),
    width: 180,
    render(row) {
      return formatTime(row.create_at)
    }
  }
]

/**
 * Get alarm data
 */
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      page_size: 10, // Keep with the original1:1consistent
      alarm_status: '',
      start_time: '',
      end_time: ''
    }
    const response = await alarmHistory(params)
    const { data } = response
    alarmList.value = data?.list || []
  } catch (error) {
    console.error('Failed to fetch alarm history:', error) // Error messages consistent with the original
    alarmList.value = []
  }
  loading.value = false // Keep with the original1:1consistentloadingProcessing method
}

/**
 * View all alerts
 */
const viewAllAlarms = () => {
  router.push('/alarm/warning-message')
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'AlarmInfoCard21'
})
</script>

<style scoped>
/* Custom table style */
:deep(.n-data-table-thead) {
  background-color: theme('colors.gray.50');
}

:deep(.dark .n-data-table-thead) {
  background-color: theme('colors.gray.700');
}

:deep(.n-data-table-tbody .n-data-table-tr:hover) {
  background-color: theme('colors.blue.50');
}

:deep(.dark .n-data-table-tbody .n-data-table-tr:hover) {
  background-color: theme('colors.blue.900/20');
}

/* Optimize table row height and spacing */
:deep(.n-data-table-td) {
  padding: 8px 12px;
}

:deep(.n-data-table-th) {
  padding: 10px 12px;
  font-weight: 600;
}
</style>