<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NPopconfirm, NSpace, NSwitch, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
// import { userStatusLabels, userStatusOptions } from '@/constants'
import { useBoolean, useLoading } from '@sa/hooks'
import { apiKeyDel, fetchKeyList, updateKey } from '@/service/api'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import TableActionModal from './modules/table-action-modal.vue'
import type { ModalType } from './modules/table-action-modal.vue'
// import ColumnSetting from './components/column-setting.vue'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()
type QueryFormModel = Pick<UserManagement.UserKey, 'name' | 'status'> & {
  page: number
  page_size: number
}

const queryParams = reactive<QueryFormModel>({
  name: null,
  status: null,
  page: 1,
  page_size: 10
})

const tableData = ref<UserManagement.UserKey[]>([])

function setTableData(data: UserManagement.UserKey[]) {
  tableData.value = data
  tableData.value.forEach(item => {
    item.show = false
  })
}

async function getTableData() {
  startLoading()
  const { data } = await fetchKeyList(queryParams)
  if (data) {
    const list: UserManagement.UserKey[] = data.list
    setTableData(list)
    endLoading()
  }
}

const columns: Ref<DataTableColumns<UserManagement.UserKey>> = ref([
  {
    key: 'name',
    minWidth: '100px',
    title: () => $t('page.manage.api.apiName'),
    align: 'left'
  },

  {
    key: 'api_key',
    minWidth: '100px',
    title: () => $t('page.manage.api.api_key'),
    align: 'left',
    render: (row: any) => {
      if (row.show === false) {
        return (
          <NSpace justify="space-between">
            <NSpace>
              <span>********</span>
              <svg-icon local-icon="eye" class="text-20px" onClick={() => handleOpenEye(row.id)} />
            </NSpace>
          </NSpace>
        )
      } else if (row.show === true) {
        return (
          <NSpace justify="space-between">
            <NSpace>
              <span>{row.api_key}</span>
              <svg-icon local-icon="eye-close" class="text-20px" onClick={() => handleCloseEye(row.id)} />
              <svg-icon local-icon="copy" class="text-20px" onClick={() => handleCopyKey(row.api_key)} />
            </NSpace>
          </NSpace>
        )
      }
      return <span></span>
    }
  },
  {
    key: 'status',
    title: () => $t('page.manage.api.apiStatus'),
    minWidth: '140px',
    align: 'left',
    render: (row: any) => {
      if (row.status === 0) {
        return <NTag type="error">{$t('page.manage.api.apiStatus1.freeze')}</NTag>
      } else if (row.status === 1) {
        return <NTag type="success">{$t('page.manage.api.apiStatus1.normal')}</NTag>
      }
      return <sapn></sapn>
    }
  },
  {
    key: 'created_at',
    title: () => $t('page.manage.api.created_at'),
    minWidth: '130px',
    align: 'left',
    render: row => {
      return formatDateTime(row.updated_at)
    }
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'left',
    width: '320px',
    render: (row: any) => {
      return (
        <NSpace justify={'start'}>
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
          <NSwitch value={Boolean(row.status === 1)} onChange={() => handleSwitchChange(row.id)} />
        </NSpace>
      )
    }
  }
]) as Ref<DataTableColumns<UserManagement.UserKey>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<UserManagement.UserKey | null>(null)

function setEditData(data: UserManagement.UserKey | null) {
  editData.value = data
}

function handleAddTable() {
  openModal()
  setModalType('add')
}

function handleOpenEye(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  findItem!.show = true
}
function handleCloseEye(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  findItem!.show = false
}
async function handleCopyKey(key: string) {
  let success = false
  let errorMessage = $t('theme.configOperation.copyFail') || 'Copy failed' // Default error message

  // Prioritize modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(key)
      success = true
      window.$message?.success($t('theme.configOperation.copySuccess') || 'Copied successfully')
      return // Return directly if successful
    } catch (err) {
      console.error('navigator.clipboard.writeText failed:', err)
      // if failed，Check whether it is due to an unsafe environment
      if (window.isSecureContext === false) {
        // Update error message，clearly stated HTTPS question
        errorMessage = $t('theme.configOperation.copyFailSecure') || 'Copy functionality requiresHTTPSorlocalhostenvironment'
      }
      // Noreturn，Keep trying fallback methods
    }
  } else {
    // if Clipboard API Not available，Check whether it is due to an unsafe environment
    if (window.isSecureContext === false) {
      errorMessage = $t('theme.configOperation.copyFailSecure') || 'Copy functionality requiresHTTPSorlocalhostenvironment'
      console.error('Clipboard API not available, likely due to non-secure context.')
    } else {
      console.error('Clipboard API not available.')
    }
  }

  // Try a fallback method document.execCommand('copy')
  if (process.env.NODE_ENV === 'development') {
  }
  const textArea = document.createElement('textarea')
  textArea.value = key
  // Prevent display on screen
  textArea.style.position = 'fixed'
  textArea.style.top = '-9999px'
  textArea.style.left = '-9999px'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.select()
  textArea.setSelectionRange(0, textArea.value.length) // Make sure the mobile version can also be selected

  try {
    success = document.execCommand('copy')
    if (success) {
      window.$message?.success($t('theme.configOperation.copySuccess') || 'Copied successfully')
    } else {
      console.error("document.execCommand('copy') returned false.")
      // if execCommand also failed，and is known to be an unsafe environment，Can give more specific tips
      if (window.isSecureContext === false) {
        errorMessage =
          $t('theme.configOperation.copyFailSecureFallback') || 'Copy failed，Please try atHTTPSenvironment or manual copying。'
      }
      window.$message?.error(errorMessage)
    }
  } catch (err) {
    console.error("Error during document.execCommand('copy'):", err)
    // abnormal situation，Same tips
    if (window.isSecureContext === false) {
      errorMessage =
        $t('theme.configOperation.copyFailSecureFallback') || 'Copy failed，Please try atHTTPSenvironment or manual copying。'
    }
    window.$message?.error(errorMessage)
  } finally {
    // Regardless of success or failure，Remove temporary elements
    document.body.removeChild(textArea)
  }
}
function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  if (findItem) {
    setEditData(findItem)
  }
  setModalType('edit')
  openModal()
}

async function handleSwitchChange(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  if (findItem) {
    const keyStatus = findItem.status === 1 ? 0 : 1
    findItem.status = keyStatus
    await updateKey(findItem)
  }
}

async function handleDeleteTable(rowId: string) {
  const data = await apiKeyDel(rowId)
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'))
    getTableData()
  }
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
    queryParams.page = page
    getTableData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    queryParams.page = 1
    queryParams.page_size = pageSize
    getTableData()
  }
})

function init() {
  getTableData()
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
// initialization
init()
</script>

<template>
  <div>
    <n-card>
      <div class="h-full flex-col gap-15px">
        <NSpace>
          <NButton type="primary" @click="handleAddTable">
            <icon-ic-round-plus class="mr-4px text-20px" />
            {{ $t('page.manage.api.addApiKey') }}
          </NButton>
        </NSpace>
        <NDataTable
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal
          v-model:visible="visible"
          :class="getPlatform ? 'w-90%' : 'w-500px'"
          :type="modalType"
          :edit-data="editData"
          @success="getTableData"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
