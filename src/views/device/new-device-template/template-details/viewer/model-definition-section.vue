<script setup lang="ts">
/**
 * Model definition display block
 * show telemetry、property、event、command data（read-only mode）
 */

import { inject, ref, onMounted, computed, h } from 'vue'
import type { Ref } from 'vue'
import { NCard, NTabs, NTabPane, NEmpty, NDataTable, NSpin, NTag, NDescriptions, NDescriptionsItem, NText } from 'naive-ui'
import { $t } from '@/locales'
import {
  telemetryApi,
  attributesApi,
  eventsApi,
  commandsApi,
  deviceCustomControlList,
  deviceCustomCommandsList
} from '@/service/api/system-data'
import type { TelemetryData, AttributeData, EventData, CommandData } from '../types'

const templateData = inject<Ref<any>>('templateData')!

// Various data lists
const telemetryList = ref<TelemetryData[]>([])
const attributesList = ref<AttributeData[]>([])
const eventsList = ref<EventData[]>([])
const commandsList = ref<CommandData[]>([])
const customControlList = ref<any[]>([])
const customCommandsList = ref<any[]>([])

// Loading status
const loading = ref({
  telemetry: false,
  attributes: false,
  events: false,
  commands: false,
  customControl: false,
  customCommands: false
})

/**
 * Get a list of telemetry data
 */
const loadTelemetryData = async () => {
  if (!templateData.value?.id) return

  loading.value.telemetry = true
  try {
    const res = await telemetryApi({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      telemetryList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load telemetry data:', error)
  } finally {
    loading.value.telemetry = false
  }
}

/**
 * Get attribute data list
 */
const loadAttributesData = async () => {
  if (!templateData.value?.id) return

  loading.value.attributes = true
  try {
    const res = await attributesApi({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      attributesList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load attributes data:', error)
  } finally {
    loading.value.attributes = false
  }
}

/**
 * Get event data list
 */
const loadEventsData = async () => {
  if (!templateData.value?.id) return

  loading.value.events = true
  try {
    const res = await eventsApi({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      eventsList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load events data:', error)
  } finally {
    loading.value.events = false
  }
}

/**
 * Get command data list
 */
const loadCommandsData = async () => {
  if (!templateData.value?.id) return

  loading.value.commands = true
  try {
    const res = await commandsApi({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      commandsList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load commands data:', error)
  } finally {
    loading.value.commands = false
  }
}

/**
 * telemetry/Property table column definition
 */
const telemetryColumns = [
  {
    title: $t('device_template.table_header.dataName'),
    key: 'data_name'
  },
  {
    title: $t('device_template.table_header.dataIdentifier'),
    key: 'data_identifier'
  },
  {
    title: $t('device_template.table_header.dataType'),
    key: 'data_type'
  },
  {
    title: $t('device_template.table_header.readAndWriteSign'),
    key: 'read_write_flag',
    render: (row: TelemetryData) => {
      return row.read_write_flag === 'R'
        ? $t('device_template.table_header.readOnly')
        : $t('device_template.table_header.readAndWrite')
    }
  },
  {
    title: $t('device_template.table_header.unit'),
    key: 'unit'
  },
  {
    title: $t('device_template.table_header.description'),
    key: 'description'
  }
]

/**
 * Event table column definitions
 */
const eventsColumns = [
  {
    title: $t('device_template.table_header.eventName'),
    key: 'data_name'
  },
  {
    title: $t('device_template.table_header.eventIdentifier'),
    key: 'data_identifier'
  },
  {
    title: $t('device_template.table_header.description'),
    key: 'description'
  }
]

/**
 * Command table column definition
 */
const commandsColumns = [
  {
    title: $t('device_template.table_header.commandName'),
    key: 'data_name'
  },
  {
    title: $t('device_template.table_header.commandIdentifier'),
    key: 'data_identifier'
  },
  {
    title: $t('device_template.table_header.description'),
    key: 'description'
  }
]

/**
 * Custom control table column definition
 */
const customControlColumns = [
  {
    title: $t('generate.btnname'),
    key: 'name'
  },
  {
    title: $t('generate.commandContent'),
    key: 'content',
    render: (row: any) => {
      return h(NText, { depth: 3, class: 'font-mono text-xs' }, { default: () => row.content })
    }
  },
  {
    title: $t('generate.enableStatus'),
    key: 'enable_status',
    render: (row: any) => {
      return row?.enable_status === 'enable'
        ? h(NTag, { type: 'success' }, { default: () => $t('page.manage.common.status.enable') })
        : h(NTag, { type: 'warning' }, { default: () => $t('page.manage.common.status.disable') })
    }
  },
  {
    title: $t('common.description'),
    key: 'description'
  }
]

/**
 * Custom command table column definition
 */
const customCommandsColumns = [
  {
    title: $t('generate.btnname'),
    key: 'buttom_name'
  },
  {
    title: $t('device_template.table_header.commandIdentifier'),
    key: 'data_identifier'
  },
  {
    title: $t('generate.commandConetnt'),
    key: 'instruct',
    render: (row: any) => {
      return h(NText, { depth: 3, class: 'font-mono text-xs' }, { default: () => row.instruct })
    }
  },
  {
    title: $t('generate.enableStatus'),
    key: 'enable_status',
    render: (row: any) => {
      return row?.enable_status === 'enable'
        ? h(NTag, { type: 'success' }, { default: () => $t('page.manage.common.status.enable') })
        : h(NTag, { type: 'warning' }, { default: () => $t('page.manage.common.status.disable') })
    }
  },
  {
    title: $t('device_template.table_header.commandDescription'),
    key: 'description'
  }
]

/**
 * Get custom control list
 */
const loadCustomControlData = async () => {
  if (!templateData.value?.id) return

  loading.value.customControl = true
  try {
    const res = await deviceCustomControlList({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      customControlList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load custom control data:', error)
  } finally {
    loading.value.customControl = false
  }
}

/**
 * Get a list of custom commands
 */
const loadCustomCommandsData = async () => {
  if (!templateData.value?.id) return

  loading.value.customCommands = true
  try {
    const res = await deviceCustomCommandsList({
      page: 1,
      page_size: 1000,
      device_template_id: templateData.value.id
    })
    if (!res.error && res.data?.list) {
      customCommandsList.value = res.data.list
    }
  } catch (error) {
    console.error('Failed to load custom commands data:', error)
  } finally {
    loading.value.customCommands = false
  }
}

onMounted(() => {
  // waittemplateDataLoad data after loading is complete
  if (templateData.value?.id) {
    loadTelemetryData()
    loadAttributesData()
    loadEventsData()
    loadCommandsData()
    loadCustomControlData()
    loadCustomCommandsData()
  }
})
</script>

<template>
  <div class="model-definition-section">
    <NCard :bordered="false">
      <NTabs type="line">
        <!-- telemetry data -->
        <NTabPane name="telemetry" :tab="$t('device_template.telemetry')">
          <NSpin :show="loading.telemetry || loading.customControl">
            <div class="tab-content">
              <!-- Standard telemetry data -->
              <div v-if="telemetryList.length > 0" class="mb-6">
                <h3 class="text-base font-semibold mb-3">{{ $t('device_template.telemetry') }}</h3>
                <NDataTable
                  :columns="telemetryColumns"
                  :data="telemetryList"
                  :bordered="false"
                  :single-line="false"
                />
              </div>

              <!-- Custom controls -->
              <div v-if="customControlList.length > 0" class="mb-6">
                <h3 class="text-base font-semibold mb-3">{{ $t('generate.customControl') }}</h3>
                <NDataTable
                  :columns="customControlColumns"
                  :data="customControlList"
                  :bordered="false"
                  :single-line="false"
                />
              </div>

              <!-- Empty state -->
              <NEmpty
                v-if="telemetryList.length === 0 && customControlList.length === 0"
                :description="$t('device_template.noAttributesDefined')"
              />
            </div>
          </NSpin>
        </NTabPane>

        <!-- attribute data -->
        <NTabPane name="attributes" :tab="$t('device_template.attributes')">
          <NSpin :show="loading.attributes">
            <div class="tab-content">
              <NDataTable
                v-if="attributesList.length > 0"
                :columns="telemetryColumns"
                :data="attributesList"
                :bordered="false"
                :single-line="false"
              />
              <NEmpty v-else :description="$t('device_template.noAttributesDefined')" />
            </div>
          </NSpin>
        </NTabPane>

        <!-- event definition -->
        <NTabPane name="events" :tab="$t('device_template.events')">
          <NSpin :show="loading.events">
            <div class="tab-content">
              <NDataTable
                v-if="eventsList.length > 0"
                :columns="eventsColumns"
                :data="eventsList"
                :bordered="false"
                :single-line="false"
              />
              <NEmpty v-else :description="$t('device_template.noEventsDefined')" />
            </div>
          </NSpin>
        </NTabPane>

        <!-- Command definition -->
        <NTabPane name="commands" :tab="$t('device_template.commands')">
          <NSpin :show="loading.commands || loading.customCommands">
            <div class="tab-content">
              <!-- standard commands -->
              <div v-if="commandsList.length > 0" class="mb-6">
                <h3 class="text-base font-semibold mb-3">{{ $t('device_template.commands') }}</h3>
                <NDataTable
                  :columns="commandsColumns"
                  :data="commandsList"
                  :bordered="false"
                  :single-line="false"
                />
              </div>

              <!-- Custom command -->
              <div v-if="customCommandsList.length > 0" class="mb-6">
                <h3 class="text-base font-semibold mb-3">{{ $t('generate.customCommand') }}</h3>
                <NDataTable
                  :columns="customCommandsColumns"
                  :data="customCommandsList"
                  :bordered="false"
                  :single-line="false"
                />
              </div>

              <!-- Empty state -->
              <NEmpty
                v-if="commandsList.length === 0 && customCommandsList.length === 0"
                :description="$t('device_template.noCommandsDefined')"
              />
            </div>
          </NSpin>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.model-definition-section {
  padding: 20px;
}

.tab-content {
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
