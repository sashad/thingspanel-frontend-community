<script setup lang="tsx">
/**
 * propertyTabcontent
 * from src/views/device/template/components/step/model-definition.vue Copy attribute part logic
 */

import { ref, onMounted, reactive, watch } from 'vue'
import { inject } from 'vue'
import type { Ref } from 'vue'
import { NDataTable, NButton, NPopconfirm, NSpace, NModal, NPagination } from 'naive-ui'
import { $t } from '@/locales'
import { attributesApi, delAttributes } from '@/service/api/system-data'
import { attribute } from '@/views/device/template/components/step/tableList'
import EditAttribute from './edit-attribute.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'

const templateData = inject<Ref<any>>('templateData')!

const loading = ref(false)
const attributesList = ref<any[]>([])
const total = ref(0)

// Paging parameters
const queryParams = reactive({
  page: 1,
  page_size: 5,
  device_template_id: ''
})

// Edit pop-up window
const showEditModal = ref(false)
const editingItem = ref<any>({})

// Table column configuration
const columns: any = [
  ...attribute.value,
  {
    key: 'actions',
    width: 350,
    title: () => $t('common.actions'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton quaternary type="primary" size={'small'} onClick={() => handleEdit(row)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton quaternary type="primary" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  }
]

/**
 * Load attribute data
 */
const loadData = async () => {
  // 🔥 Strict verification：Must have a valid templateID
  if (!templateData.value?.id || templateData.value.id === '') {
    return
  }

  loading.value = true

  try {
    queryParams.device_template_id = templateData.value.id
    const res: any = await attributesApi(queryParams)
    if (!res.error && res.data) {
      attributesList.value = res.data.list || []
      total.value = Math.ceil(res.data.total / queryParams.page_size)

      // Handling read and write flag display
      attributesList.value.forEach((item: any) => {
        if (item.read_write_flag === 'R' || item.read_write_flag === 'R-read only') {
          item.read_write_flag = $t('device_template.table_header.readOnly')
        } else if (item.read_write_flag === 'RW' || item.read_write_flag === 'RW-read/Write') {
          item.read_write_flag = $t('device_template.table_header.readAndWrite')
        }
      })
    }
  } catch (error) {
    console.error('Failed to load attributes data:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Add new attributes
 */
const handleAdd = () => {
  editingItem.value = {}
  showEditModal.value = true
}

/**
 * Edit properties
 */
const handleEdit = (row: any) => {
  editingItem.value = { ...row }
  showEditModal.value = true
}

/**
 * Delete attribute
 */
const handleDelete = async (id: string) => {
  await delAttributes(id)
  window.$message?.success($t('common.deleteSuccess'))
  loadData()
}

/**
 * Edit success callback
 */
const handleEditSuccess = () => {
  showEditModal.value = false
  editingItem.value = {}
  loadData()
}

/**
 * Cancel edit
 */
const handleEditCancel = () => {
  showEditModal.value = false
  editingItem.value = {}
}

/**
 * Pagination changes
 */
const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

/**
 * 🔥 monitor templateData change
 * After the parent component loads the template data，Automatically load attribute data
 */
watch(
  () => templateData.value?.id,
  newId => {
    if (newId) {
      loadData()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Data is loaded by watch deal with
})
</script>

<template>
  <div class="tab-content">
    <NButton type="primary" class="addBtn" @click="handleAdd">
      <template #icon>
        <SvgIcon local-icon="add" class="more" />
      </template>
      {{ $t('device_template.add') }}
    </NButton>

    <NDataTable :columns="columns" :data="attributesList" :loading="loading" class="m-t9 flex-1-hidden" />

    <div class="mt-4 w-full flex justify-end">
      <NPagination :page-count="total" :page-size="queryParams.page_size" @update:page="handlePageChange" />
    </div>

    <!-- Edit pop-up window -->
    <NModal
      v-model:show="showEditModal"
      :title="editingItem.id ? $t('common.edit') : $t('common.add')"
      preset="card"
      class="mw-600px w-50%"
    >
      <EditAttribute
        :device-template-id="templateData?.id || ''"
        :edit-item="editingItem"
        @success="handleEditSuccess"
        @cancel="handleEditCancel"
      />
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.tab-content {
  padding: 20px 0;
  min-height: 300px;
  position: relative;
}

.addBtn {
  position: absolute;
  right: 0;
  top: 0.5rem;
}

.mw-600px {
  min-width: 600px !important;
}
</style>
