<script lang="tsx" setup>
import type { VueElement } from 'vue'
import { computed, defineProps, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NDatePicker, NInput, NSelect, NSpace, NPagination, NSpin } from 'naive-ui'
import type { TreeSelectOption } from 'naive-ui'
import { useLoading } from '@sa/hooks'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { createLogger } from '@/utils/logger'
import { getDemoServerUrl } from '@/utils/common/tool'
import AdvancedListLayout from '@/components/list-page/index.vue'
import TencentMap from './modules/tencent-map.vue'
import DevCardItem from '@/components/dev-card-item/index.vue'

// New DeviceItem Interface definition
interface DeviceItem {
  id: string
  device_number: string
  name: string
  device_config_id: string
  device_config_name: string
  ts: string | null
  activate_flag: string
  activate_at: string | null
  batch_number: string
  current_version: string
  created_at: string
  is_online: 0 | 1
  location: string
  access_way: string
  protocol_type: string
  device_status: number
  warn_status: string // For example 'N' means normal, 'Y' Indicates an alarm
  device_type: string
  image_url?: string
  // More fields can be added according to actual conditions
  title?: string // DevCardItem Possible alternate fields
  description?: string // DevCardItem Possible alternate fields
  status?: string | number // DevCardItem Possible alternate fields
  value?: string // DevCardItem Possible alternate fields
  indicator?: string // DevCardItem Possible alternate fields
  timestamp?: string // DevCardItem Possible alternate fields
  updatedAt?: string // DevCardItem Possible alternate fields
  key?: string // DevCardItem Possible alternate fields
}

const logger = createLogger('TablePage')

// Define the type of search configuration item，Supports multiple input types：plain text、date picker、date range picker、Dropdown selection and tree selector
export type theLabel = string | (() => string) | undefined
export type SearchConfig =
  | {
      key: string
      label: string
      type: 'input' | 'date' | 'date-range'
      initValue?: any
    }
  | {
      key: string
      label: string
      type: 'select'
      renderLabel?: any
      renderTag?: any
      initValue?: any
      extendParams?: object
      options: { label: theLabel; value: any }[]
      labelField?: string
      valueField?: string
      loadOptions?: () => Promise<{ label: theLabel; value: any }[]>
    }
  | {
      key: string
      label: string
      type: 'tree-select'
      initValue?: any
      options: TreeSelectOption[]
      multiple: boolean
      loadOptions?: () => Promise<TreeSelectOption[]>
    }

// passpropsReceive parameters from parent component
const props = defineProps<{
  fetchData: () => Promise<any> // Data acquisition function
  columnsToShow: // Table column configuration
  | {
        key: string
        label: theLabel
        render?: () => VueElement | string | undefined // Custom rendering function
      }[]
    | 'all' // special value'all'Show all columns
  searchConfigs: SearchConfig[] // Search configuration array
  tableActions: Array<{
    // Table row operations
    theKey?: string // Operation keys
    label: theLabel // button text
    callback: any // Click callback
  }>
  topActions: { element: () => JSX.Element }[] // Top operating component list
  rowClick?: () => void // Table row click callback
  initPage?: number
  initPageSize?: number
}>()

const { loading, startLoading, endLoading } = useLoading()
// deconstructpropsto simplify access
const { fetchData, columnsToShow, searchConfigs }: any = props

const dataList = ref<DeviceItem[]>([]) // for dataList Specify type
const total = ref(0) // Total data
const currentPage = ref(props.initPage || 1) // Current page number
const pageSize = ref(props.initPageSize || 10) // Display quantity per page
const searchCriteria: any = ref(Object.fromEntries(searchConfigs.map(item => [item.key, item.initValue]))) // Search criteria

// Add current view state management
const currentViewType = ref('list') // Default is list view

// add pictureURLrelated variables
const demoUrl = getDemoServerUrl()
const url = ref(demoUrl)

// function to get data，Combine search criteria、Pagination etc.
const getData = async () => {
  // Process search criteria，Specifically converting a date object to a string
  startLoading()
  const processedSearchCriteria = Object.fromEntries(
    Object.entries(searchCriteria.value).map(([key, value]) => {
      if (value && Array.isArray(value)) {
        // Processing date range
        return [key, value.map(v => (v instanceof Date ? v.toISOString() : v))]
      }
      // single date processing
      return [key, value instanceof Date ? value.toISOString() : value]
    })
  )
  // Call the providedfetchDataFunction to get data

  const response = await fetchData({
    page: currentPage.value,
    page_size: pageSize.value,
    ...processedSearchCriteria
  })
  // Handle response
  if (!response.error) {
    dataList.value = response.data.list
    total.value = response.data.total
  } else {
    logger.error({ 'Error fetching data:': response.error })
  }
  endLoading()
}

// Dynamically generate table column configuration using computed properties
const generatedColumns = computed(() => {
  let columns

  if (dataList.value.length > 0) {
    // according tocolumnsToShowGenerate column configuration
    columns = (columnsToShow === 'all' ? Object.keys(dataList.value[0]) : columnsToShow).map(item => {
      if (item.render) {
        // Use customrenderfunction render column
        return {
          ...item,
          title: item.label,
          key: item.key,
          render: row => item.render(row)
        }
      }
      return {
        ...item,
        title: item.label,
        key: item.key,
        render: row => {
          if (item.key === 'ts' && row[item.key]) {
            return formatDateTime(row[item.key])
          }
          return <>{row[item.key]}</>
        }
      }
    })
  }

  return columns || []
})

// Re-fetch data when updating page number or page size
const onUpdatePage = newPage => {
  currentPage.value = newPage
  getData() // Update data
}
const onUpdatePageSize = newPageSize => {
  pageSize.value = newPageSize
  currentPage.value = 1 // Reset to first page
  getData() // Update data
}

// add pair searchCriteria monitoring
watch(
  searchCriteria,
  (newVal, oldVal) => {
    // Check if changes have actually occurred
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      currentPage.value = 1 // Reset to first page
      getData() // Retrieve data
    }
  },
  { deep: true } // Deeply monitor changes in objects
)

// Observe changes in pagination and search conditions，Automatically re-fetch data
watchEffect(() => {
  searchConfigs.map((item: any) => {
    const vals = searchCriteria.value[item.key]
    if (item?.extendParams && vals) {
      item?.options.map(oitem => {
        if (oitem.dict_value + oitem.device_type === vals) {
          item?.extendParams.map(eitem => {
            searchCriteria.value[eitem.label] = oitem[eitem.value]
          })
        }
      })
    }
  })
  getData()
})

// Search and reset button logic
const handleSearch = () => {
  currentPage.value = 1 // Reset to first page when searching
  getData()
}

const handleReset = () => {
  // Reset search conditions to initial values
  Object.keys(searchCriteria.value).forEach(key => {
    const config = searchConfigs.find(item => item.key === key)
    if (config) {
      // If it is a date range selector，Set to empty array
      if (config.type === 'date-range') {
        searchCriteria.value[key] = []
      }
      // If it is a tree selector，according to multiple Property setting null value
      else if (config.type === 'tree-select') {
        searchCriteria.value[key] = config.multiple ? [] : null
      }
      // If it is a drop-down selection box，set to null to show placeholders
      else if (config.type === 'select') {
        searchCriteria.value[key] = null
      }
      // Other types are set to empty strings
      else {
        searchCriteria.value[key] = ''
      }
    }
  })

  handleSearch() // Retrieve data after reset
}

// Force update of specified parameters and refresh data
const forceChangeParamsByKey = (params: Record<string, any>) => {
  Object.entries(params).forEach(([key, value]) => {
    if (key in searchCriteria.value) {
      searchCriteria.value[key] = value
    }
  })
  getData()
}

// Expose methods to parent component
defineExpose({
  handleSearch,
  handleReset,
  forceChangeParamsByKey,
  dataList // exposeddataListso that the parent component can directly update the data
})

// Update tree selector options
const handleTreeSelectUpdate = (value, key) => {
  currentPage.value = 1
  searchCriteria.value[key] = value
}

// Function for loading dynamic options，Applicable toselectandtree-selectType of search configuration
const loadOptionsOnMount = async pattern => {
  for (const config of searchConfigs) {
    if (config.type === 'select' && config.loadOptions) {
      const opts = await config.loadOptions(pattern)
      config.options = [...config.options, ...opts]
    }
  }
}

const rowProps = row => {
  if (props && props.rowClick) {
    return {
      style: 'cursor: pointer;',
      onClick: () => {
        props.rowClick && props.rowClick(row)
      }
    }
  }
  return {}
}

const loadOptionsOnMount2 = async () => {
  for (const config of searchConfigs) {
    if (config.type === 'tree-select' && config.loadOptions) {
      const opts = await config.loadOptions()
      config.options = [...config.options, ...opts]
    }
  }
}

// Load options when component is mounted
loadOptionsOnMount('')
loadOptionsOnMount2()

// for input Add specialized processing functions to types
const handleInputChange = () => {
  currentPage.value = 1
  getData()
}

// repair NSelect of filter function type error
const filterSelectOption = (pattern: string, option: any) => {
  const label = typeof option.label === 'string' ? option.label : ''
  return label.includes(pattern)
}

// AdvancedListLayout event handling
const handleLayoutQuery = () => {
  handleSearch()
}

const handleLayoutReset = () => {
  handleReset()
}

const handleAddNew = () => {
  // trigger new event，by parent component or first topAction deal with
}

const handleViewChange = ({ viewType }: { viewType: string }) => {
  // Update current view type
  currentViewType.value = viewType
}

const handleRefresh = () => {
  getData()
}

// importSvgIconcomponents，Use the project standard icon system
import SvgIcon from '@/components/custom/svg-icon.vue'

// Device type to icon name mapping (Use the project standard icon system)
const deviceTypeIcons = {
  '1': 'direct', // Direct connect device icon
  '2': 'gateway', // gateway icon
  '3': 'subdevice', // Gateway subdevice icon
  default: 'defaultdevice' // Default device icon
}

// Function to get the device icon name，against"Default configuration"Use direct device icon
const getDeviceIconName = (deviceType: string, deviceConfigName?: string): string => {
  // When the configuration is the default configuration，Force direct connect device icon
  if (!deviceConfigName || deviceConfigName === 'Default configuration') {
    return deviceTypeIcons['1'] // Direct connect device icon
  }
  return deviceTypeIcons[deviceType] || deviceTypeIcons.default
}

// Get configuration pictureURLfunction
const getConfigImageUrl = (imagePath: string | undefined): string => {
  logger.info('imagePath:', imagePath)
  if (!imagePath) return '' // Return empty string，Let the template use the default icon
  const relativePath = imagePath.replace(/^\.?\//, '')
  return `${url.value.replace('api/v1', '') + relativePath}`
}

// Import icon component（Fix icon display problem）
import { ListOutline, MapOutline, GridOutline as CardIcon } from '@vicons/ionicons5'

// Define available views，Fix icon references
const availableViews = [
  { key: 'card', icon: CardIcon, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' },
  { key: 'map', icon: MapOutline, label: 'common.viewMap' }
]
const formSize = ref(undefined)
const router = useRouter()
// Handling the click event of the alarm bell icon
const handleWarningClick = (item: DeviceItem) => {
  // Jump to the corresponding alarm page based on device information
  // Devices can be passed onIDand other parameters
  if (item.warn_status === 'Y') {
    // When an alarm occurs, jump to the alarm details of the specific device.
    router.push(`/alarm/warning-message?device_id=${item.id}`)
  } else {
    // When there is no alarm, it may jump to the alarm management page.
    router.push('/alarm/warning-message')
  }
}
</script>

<template>
  <AdvancedListLayout
    :initial-view="'card'"
    :available-views="availableViews"
    @query="handleLayoutQuery"
    @reset="handleLayoutReset"
    @add-new="handleAddNew"
    @view-change="handleViewChange"
    @refresh="handleRefresh"
  >
    <!-- Search form content -->
    <template #search-form-content>
      <n-grid cols="1 s:2 m:3 l:4 xl:6 2xl:8" x-gap="18" y-gap="18" responsive="screen">
        <n-gi v-for="config in searchConfigs" :key="config.key">
          <template v-if="config.type === 'input'">
            <NInput
              v-model:value="searchCriteria[config.key]"
              :size="formSize"
              :placeholder="$t(config.label)"
              class="input-style"
              @update:value="handleInputChange"
            />
          </template>
          <template v-else-if="config.type === 'date-range'">
            <NDatePicker
              v-model:value="searchCriteria[config.key]"
              :size="formSize"
              type="daterange"
              :placeholder="$t(config.label)"
              class="input-style"
            />
          </template>
          <template v-else-if="config.type === 'select'">
            <NSelect
              v-model:value="searchCriteria[config.key]"
              :value-field="config.valueField"
              :label-field="config.labelField"
              :size="formSize"
              filterable
              :filter="filterSelectOption"
              :options="config.options"
              :render-label="config.renderLabel"
              :render-tag="config.renderTag"
              :placeholder="$t(config.label)"
              class="input-style"
              @update:value="currentPage = 1"
            />
          </template>
          <template v-else-if="config.type === 'date'">
            <NDatePicker
              v-model:value="searchCriteria[config.key]"
              :size="formSize"
              type="date"
              :placeholder="$t(config.label)"
              class="input-style"
            />
          </template>
          <template v-else-if="config.type === 'tree-select'">
            <n-tree-select
              v-model:value="searchCriteria[config.key]"
              :size="formSize"
              filterable
              :options="config.options"
              :multiple="config.multiple"
              class="input-style"
              @update:value="value => handleTreeSelectUpdate(value, config.key)"
            />
          </template>
        </n-gi>
        <n-gi>
          <n-space>
            <n-button type="primary" :size="formSize" @click="handleSearch">
              {{ $t('generate.query') }}
            </n-button>
            <n-button type="default" :size="formSize" @click="handleReset">
              {{ $t('generate.reset') }}
            </n-button>
          </n-space>
        </n-gi>
      </n-grid>
    </template>

    <!-- Operating area on the left side of the head -->
    <template #header-left>
      <div class="flex gap-2">
        <component :is="action.element" v-for="(action, index) in topActions" :key="index"></component>
      </div>
    </template>

    <!-- card view - Use bell icon slot -->
    <template #card-view>
      <n-scrollbar style="height: calc(100vh - 442px)" :size="1">
        <n-spin :show="loading">
          <NGrid x-gap="20px" y-gap="20px" cols="1 s:2 m:3 l:4" responsive="screen">
            <NGridItem v-for="(item, index) in dataList" :key="item.id">
              <DevCardItem
                :title="item.name || 'N/A'"
                :status-active="item.is_online === 1"
                :subtitle="item.device_config_name || '--'"
                :footer-text="(item.ts ? formatDateTime(item.ts) : null) ?? '--'"
                :warn-status="item.warn_status"
                :device-id="item.id"
                @click-card="() => props.rowClick && props.rowClick(item)"
                @click-top-right-icon="handleWarningClick(item)"
              >
                <template #subtitle-icon>
                  <SvgIcon
                    :local-icon="getDeviceIconName(item.device_type, item.device_config_name)"
                    class="image-icon"
                  />
                </template>

                <!-- Bell icon slot in the upper right corner -->
                <template #top-right-icon>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    :fill="item.warn_status === 'Y' ? '#ff4d4f' : '#d9d9d9'"
                    class="bell-icon"
                  >
                    <!-- bell icon SVG path -->
                    <path
                      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                    />
                  </svg>
                </template>
                <template #footer-icon>
                  <div class="footer-icon-container">
                    <img v-if="item.image_url" :src="getConfigImageUrl(item.image_url)" alt="config image" class="config-image" />
                    <SvgIcon v-else local-icon="defaultdevice" class="config-image" />
                  </div>
                </template>
              </DevCardItem>
            </NGridItem>
          </NGrid>
        </n-spin>
      </n-scrollbar>
    </template>

    <!-- list view -->
    <template #list-view>
      <n-scrollbar style="height: calc(100vh - 442px)" :size="1">
        <NDataTable
          size="small"
          :row-props="rowProps"
          :loading="loading"
          :columns="generatedColumns"
          :data="dataList"
          class="w-full"
        />
      </n-scrollbar>
    </template>

    <!-- map view -->
    <template #map-view>
      <n-spin :show="loading">
        <div class="map-view-container">
          <TencentMap :devices="dataList" />
        </div>
      </n-spin>
    </template>

    <!-- bottom pagination -->
    <template #footer>
      <NPagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        class="justify-end"
        :item-count="total"
        :page-sizes="[10, 20, 30, 40, 50]"
        show-size-picker
        @update:page="onUpdatePage"
        @update:page-size="onUpdatePageSize"
      />
    </template>
  </AdvancedListLayout>
</template>

<style scoped lang="scss">
.btn-style {
  @apply hover:bg-[var(--color-primary-hover)] rounded-md shadow;
}

.card-wrapper {
  @apply rounded-lg shadow overflow-hidden;
  margin: 0 auto;
  padding: 16px;
}

.image-icon {
  max-width: 100%;
  max-height: 100%;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.bell-icon {
  transition: fill 0.3s ease;
}

// bottom icon container - fixed40x40square
.footer-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.config-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.map-view-container {
  height: calc(100vh - 442px);
  min-height: 360px;
}
</style>
