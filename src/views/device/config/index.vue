<script lang="tsx" setup>
import { onMounted, ref, computed, h, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NInput, NIcon, NPagination, NDataTable, NTag, NSpace, NEmpty } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { deviceConfig } from '@/service/api/device'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import ItemCard from '@/components/dev-card-item/index.vue'

const router = useRouter()
const { routerPushByKey } = useRouterPush()

// query parameters
const queryData = ref({
  page: 1,
  page_size: 10,
  name: ''
})

// data
const deviceConfigList = ref([] as any[])
const dataTotal = ref(0)
const loading = ref(false)

// Get data
const getData = async () => {
  loading.value = true
  try {
    const res = await deviceConfig(queryData.value)
    if (!res.error) {
      deviceConfigList.value = res.data.list
      dataTotal.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// Search processing
const handleQuery = async () => {
  queryData.value.page = 1
  await getData()
}

// Reset search
const handleReset = async () => {
  queryData.value.page = 1
  queryData.value.name = ''
  await getData()
}

// New configuration
const handleAddNew = () => {
  routerPushByKey('device_config-edit')
}

// Page jump
const goToDetail = (id: string) => {
  router.push({ path: '/device/config-detail', query: { id } })
}

// Device type mapping
const deviceTypeMap = {
  '1': $t('generate.direct-connected-device'),
  '2': $t('generate.gateway'),
  '3': $t('generate.gateway-sub-device')
}

// table column definition
const columns = computed(() => [
  {
    title: $t('device_template.templateName'),
    key: 'name',
    ellipsis: {
      tooltip: true
    },
    render: (row: any) => {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => goToDetail(row.id)
        },
        { default: () => row.name }
      )
    }
  },
  {
    title: $t('generate.device-type'),
    key: 'device_type',
    render: (row: any) => {
      const typeText = deviceTypeMap[row.device_type as keyof typeof deviceTypeMap] || row.device_type
      const type = row.device_type === '1' ? 'info' : row.device_type === '2' ? 'success' : 'warning'
      return h(NTag, { type }, { default: () => typeText })
    }
  },
  {
    title: $t('generate.device-count'),
    key: 'device_count',
    render: (row: any) => `${row.device_count} ${$t('generate.individual')}`
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 120,
    render: (row: any) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => handleEdit(row.id)
              },
              { default: () => $t('common.edit') }
            )
          ]
        }
      )
    }
  }
])

// Edit processing
const handleEdit = (id: string) => {
  routerPushByKey('device_config-edit', { query: { id } })
}

// Pagination
const handlePageChange = (page: number) => {
  queryData.value.page = page
  getData()
}

// Page size handling
const handlePageSizeChange = (pageSize: number) => {
  queryData.value.page_size = pageSize
  queryData.value.page = 1
  getData()
}

// sort processing
const handleSorterChange = (sorter: any) => {
  // Implement sorting logic as needed
  if (process.env.NODE_ENV === 'development') {
  }
}

// Refresh data
const handleRefresh = () => {
  getData()
}

// Get data when component is mounted
onMounted(() => {
  getData()
})

// Automatically refresh the page when opening
onActivated(() => {
  getData()
})
import { ListOutline, GridOutline as CardIcon } from '@vicons/ionicons5'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { getDemoServerUrl } from '@/utils/common/tool'

const demoUrl = getDemoServerUrl()

// Comment：RemoveddefaultConfigSvgimport andsvgToDataUrlfunction，Use nowSvgIconComponent handlingSVGicon

// Device type icon mapping - Use localSVGIcon name
const deviceTypeIcons = {
  1: 'direct', // direct connect device
  2: 'gateway', // gateway device  
  3: 'subdevice', // subdevice
  default: 'defaultdevice' // Default device icon
}

// Function to get the device icon name
const getDeviceIconName = (deviceType: string): string => {
  return deviceTypeIcons[deviceType] || deviceTypeIcons.default
}

const getConfigImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${demoUrl.replace('api/v1', '')}${imageUrl}`
}

// Comment：RemovedgetConfigImageUrlfunction，Now check directly in the template whether there isimage_url

const availableViews = [
  { key: 'card', icon: CardIcon, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]
</script>

<template>
  <AdvancedListLayout
    :available-views="availableViews"
    :showQueryButton="false"
    :showResetButton="false"
    :use-view-memory="true"
    memory-key="device-config-view"
    @add-new="handleAddNew"
    @query="handleQuery"
    @reset="handleReset"
    @refresh="handleRefresh"
  >
    <template #header-left>
      <div class="flex gap-2">
        <n-button type="primary" @click="handleAddNew">{{ $t('generate.createDeviceConfig') }}</n-button>
      </div>
    </template>
    <!-- Search form content -->
    <template #search-form-content>
      <div class="flex gap-4">
        <NInput
          v-model:value="queryData.name"
          :placeholder="$t('generate.enter-config-name')"
          type="text"
          clearable
          style="width: 210px"
          @clear="handleReset"
          @keydown.enter="handleQuery"
        >
          <template #prefix>
            <NIcon>
              <IosSearch />
            </NIcon>
          </template>
        </NInput>
        <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
      </div>
    </template>

    <!-- card view -->
    <template #card-view>
      <n-spin :show="loading">
        <div v-if="deviceConfigList.length === 0 && !loading" class="empty-state">
          <NEmpty size="huge" :description="$t('common.nodata')" class="min-h-60" />
        </div>
        <n-grid cols="1 s:2 m:3 l:4 xl:5 2xl:8" x-gap="18" y-gap="18" responsive="screen">
          <n-gi v-for="item in deviceConfigList" :key="item.id">
            <ItemCard
              :title="item.name"
              :footer-text="`${item.device_count} ${$t('generate.individual')} ${$t('generate.device')}`"
              :subtitle="deviceTypeMap[item.device_type as keyof typeof deviceTypeMap]"
              :device-config-id="item.id"
              :isStatus="false"
              @click-card="goToDetail(item.id)"
            >
              <template #subtitle-icon>
                <SvgIcon :local-icon="getDeviceIconName(item.device_type)" class="image-icon" />
              </template>

              <!-- bottom icon - The configuration picture is displayed in the lower left corner -->
              <template #footer-icon>
                <div class="footer-icon-container">
                  <img
                    v-if="item.image_url"
                    :src="getConfigImageUrl(item.image_url)"
                    alt="config image"
                    class="config-image"
                  />
                  <SvgIcon v-else local-icon="default-config" class="config-image" />
                </div>
              </template>

              <!-- Card content area can display more information -->
            </ItemCard>
          </n-gi>
        </n-grid>
      </n-spin>
    </template>

    <!-- table view -->
    <template #list-view>
      <NDataTable
        :columns="columns"
        :data="deviceConfigList"
        :loading="loading"
        size="small"
        :pagination="false"
        :bordered="false"
        :single-line="false"
        striped
        @update:sorter="handleSorterChange"
      />
    </template>

    <!-- bottom pagination -->
    <template #footer>
      <NPagination
        v-model:page="queryData.page"
        :page-size="queryData.page_size"
        :item-count="dataTotal"
        show-size-picker
        :page-sizes="[10, 20, 30, 50]"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </template>
  </AdvancedListLayout>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 4px;
}

.card-item {
  min-height: 200px;
}

.card-extra-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
}

// Device type icon style
.image-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
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

// Responsive design
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (min-width: 1201px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
</style>
