<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
// import {useRouter} from 'vue-router';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  useMessage,
  NPopconfirm,
  NTooltip,
  NFlex,
  NPagination,
  NSelect
} from 'naive-ui'
import type { LastLevelRouteKey } from '@elegant-router/types' // Assuming you have defined theseAPI
import { DelBoard, PostBoard, PutBoard, getBoardList } from '@/service/api/index'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'

const { routerPushByKey } = useRouterPush()
const message = useMessage()
const nameSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(12) // Or set it according to your actual needs
const total = ref(0)
const boards = ref<Panel.Board[]>([])
const showModal = ref<boolean>(false)
const isEditMode = ref(false)
// Initialize form data
const formData = reactive({
  id: '',
  name: '',
  home_flag: 'N',
  description: ''
})

// Set form data
const setFormData = data => {
  Object.assign(formData, data)
}

// Clear form data
const clearFormData = () => {
  setFormData({ id: '', name: '', home_flag: 'N', description: '' })
  isEditMode.value = false
}

const setupData = v => {
  boards.value = v
}
// Get the Kanban list
const fetchBoards = async () => {
  const { data } = await getBoardList({ page: currentPage.value, page_size: pageSize.value, name: nameSearch.value })
  if (data && data.list) {
    setupData(data.list as Panel.Board[])
    total.value = data.total
  }
}

// Submit form
const submitForm = async () => {
  if (!formData.name) {
    message.error($t('custom.home.kanbanNameNull'))
    return
  }

  if (isEditMode.value) {
    await PutBoard(formData) // Edit Kanban
  } else {
    await PostBoard(formData) // Create a new Kanban board
  }

  showModal.value = false
  clearFormData()
  await fetchBoards()
}

const editBoard = board => {
  setFormData({ ...board })
  isEditMode.value = true
  showModal.value = true
}

// Delete Kanban board
const deleteBoard = async (id: string) => {
  await DelBoard(id) // hypothesisDelBoardreceiving kanbanid
  await fetchBoards() // Refresh the board list
}

// Page jump
const goRouter = (name: LastLevelRouteKey, id: string) => {
  routerPushByKey(name, { query: { id } })
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
onMounted(fetchBoards)
</script>

<template>
  <div>
    <NCard>
      <div class="m-b-20px flex flex-wrap items-center gap-15px">
        <!-- New button -->
        <div class="flex-1">
          <NButton type="primary" @click="showModal = true">+{{ $t('dashboard_panel.addKanBan') }}</NButton>
        </div>
        <!-- Search section -->
        <div class="flex items-center gap-20px">
          <NInput
            v-model:value="nameSearch"
            clearable
            :placeholder="$t('generate.search-by-name')"
            @clear="
              () => {
                nameSearch = ''
                fetchBoards()
              }
            "
          />

          <NButton type="primary" @click="fetchBoards">{{ $t('common.search') }}</NButton>
        </div>
      </div>
      <!-- Kanban list -->
      <NGrid x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGridItem
          v-for="board in boards"
          :key="board.id"
          @click="goRouter('visualization_kanban-details', board.id as string)"
        >
          <NCard
            hoverable
            style="height: 160px"
            content-style="display: flex; flex-direction: column; height: 100%; gap: 8px;"
          >
            <div class="flex justify-between">
              <div class="text-16px font-600">
                {{ board.name }}
              </div>
              <div
                v-if="board.home_flag === 'Y'"
                class="mr--4 mt--2 h-24px w-24px border border-red-4 rounded-50 text-center text-12px text-red font-600"
              >
                {{ $t('generate.first') }}
              </div>
            </div>
            <!-- useNTooltipcomponents -->
            <NTooltip
              trigger="hover"
              :disabled="!board.description || !board.description.trim()"
              placement="top-start"
              :style="{ maxWidth: '200px' }"
            >
              <template #trigger>
                <div class="description">{{ board.description }}</div>
              </template>
              {{ board.description }}
            </NTooltip>
            <div class="flex justify-end">
              <NButton strong circle secondary @click.stop="editBoard(board)">
                <template #icon>
                  <icon-material-symbols:contract-edit-outline class="text-24px text-blue" />
                </template>
              </NButton>
              <!-- use Vue template syntax NPopconfirm -->
              <NPopconfirm @positive-click="deleteBoard(board.id as string)">
                <template #trigger>
                  <NButton strong secondary circle @click.stop>
                    <template #icon>
                      <icon-material-symbols:delete-outline class="text-24px text-red" />
                    </template>
                  </NButton>
                </template>
                {{ $t('common.confirmDelete') }}
              </NPopconfirm>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
      <!-- Add a paginator after the Kanban list -->
      <div class="mt-4 h-60px w-full">
        <NFlex justify="end">
          <NPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :item-count="total"
            @update:page="fetchBoards"
          />
        </NFlex>
      </div>
    </NCard>
    <!-- Create and edit modal boxes for Kanban boards -->
    <NModal
      v-model:show="showModal"
      :title="isEditMode ? $t('dashboard_panel.editKanban') : $t('dashboard_panel.addKanBan')"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
    >
      <NCard bordered>
        <NForm :model="formData" class="flex-1">
          <NFormItem :label="$t('generate.dashboard-name')" path="name">
            <NInput v-model:value="formData.name" :placeholder="$t('generate.enter-dashboard-name')" />
          </NFormItem>
          <NFormItem :label="$t('generate.is-homepage')">
            <NSelect
              v-model:value="formData.home_flag"
              :options="[
                { label: $t('common.yesOrNo.yes'), value: 'Y' },
                { label: $t('common.yesOrNo.no'), value: 'N' }
              ]"
            />
          </NFormItem>
          <NFormItem :label="$t('device_template.table_header.description')">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('generate.enter-description')"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton
              type="default"
              @click="
                showModal = false
                clearFormData()
              "
            >
              {{ $t('generate.cancel') }}
            </NButton>
            <n-popconfirm v-if="formData.home_flag === 'Y'" @positive-click="submitForm">
              <template #trigger>
                <NButton type="primary">{{ $t('common.save') }}</NButton>
              </template>
              {{ $t('custom.visualization.onlyOneHomepage') }}
            </n-popconfirm>
            <NButton v-if="formData.home_flag === 'N'" type="primary" @click="submitForm">
              {{ $t('common.save') }}
            </NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  text-wrap: wrap;
  flex: 1;
  /* Make sure this is a block level element */
  max-width: 100%;
  color: #666;
}
</style>
