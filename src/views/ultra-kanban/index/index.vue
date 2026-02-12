<script setup lang="ts">
/**
 * UltraKanban page
 * integratedvisual-editorA new Kanban implementation for components
 */

import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
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
  NSelect,
  NSpace
} from 'naive-ui'
import type { LastLevelRouteKey } from '@elegant-router/types'
import { DelBoard, PostBoard, PutBoard, getBoardList } from '@/service/api/index'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'
import ItemCard from '@/components/dev-card-item/index.vue'

// Routing and message management
const { routerPushByKey } = useRouterPush()
const message = useMessage()

// Theme system integration
const themeStore = useThemeStore()

// Search and paging status
const nameSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const boards = ref<Panel.Board[]>([])

// Modal state
const showModal = ref<boolean>(false)
const isEditMode = ref(false)

// form data
const formData = reactive({
  id: '',
  name: '',
  home_flag: 'N',
  description: ''
})

/**
 * Set form data
 * @param data form data object
 */
const setFormData = (data: any) => {
  Object.assign(formData, data)
}

/**
 * Clear form data and reset editing status
 */
const clearFormData = () => {
  setFormData({ id: '', name: '', home_flag: 'N', description: '' })
  isEditMode.value = false
}

/**
 * Set up Kanban data
 * @param v Kanban list
 */
const setupData = (v: Panel.Board[]) => {
  boards.value = v
}

/**
 * Get Kanban list data
 */
const fetchBoards = async () => {
  try {
    const { data } = await getBoardList({
      page: currentPage.value,
      page_size: pageSize.value,
      name: nameSearch.value,
      // List requests only：Carrying visualization type parameters
      vis_type: 'new_board'
    })
    if (data && data.list) {
      const filtered = (data.list as Panel.Board[]).filter(item => item?.vis_type === 'new_board')
      setupData(filtered)
      // Use filtered quantity，Avoid showing non- new_board number of entries
      total.value = filtered.length
    }
  } catch (error) {
    message.error($t('common.error'))
  }
}

/**
 * Submit form data（Create or edit a Kanban board）
 */
const submitForm = async () => {
  if (!formData.name) {
    message.error($t('custom.home.kanbanNameNull'))
    return
  }

  try {
    if (isEditMode.value) {
      await PutBoard(formData)
      message.success($t('common.updateSuccess'))
    } else {
      // Pass visualization type parameters when adding
      await PostBoard({ ...formData, vis_type: 'new_board' })
      message.success($t('common.addSuccess'))
    }

    showModal.value = false
    clearFormData()
    await fetchBoards()
  } catch (error) {
    message.error($t('common.saveError'))
  }
}

/**
 * Edit Kanban
 * @param board Kanban object to edit
 */
const editBoard = (board: Panel.Board) => {
  setFormData({ ...board })
  isEditMode.value = true
  showModal.value = true
}

/**
 * Delete Kanban board
 * @param id KanbanID
 */
const deleteBoard = async (id: string) => {
  try {
    await DelBoard(id)
    message.success($t('common.deleteSuccess'))
    await fetchBoards()
  } catch (error) {
    message.error($t('common.deleteError'))
  }
}

/**
 * Cancel the operation and close the modal
 */
const handleCancel = () => {
  showModal.value = false
  clearFormData()
}

/**
 * Route to jump to the Kanban details page
 * @param name Route name
 * @param id KanbanID
 */
const goRouter = (name: LastLevelRouteKey, id: string) => {
  routerPushByKey(name, { query: { id } })
}

/**
 * Get platform type（for responsive design）
 */
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

// Page initialization
onMounted(fetchBoards)
</script>

<template>
  <div class="ultra-kanban-container">
    <NCard>
      <!-- Action toolbar -->
      <div class="m-b-20px flex flex-wrap items-center gap-15px">
        <!-- Create new button area -->
        <div class="flex-1">
          <NButton type="primary" @click="showModal = true">+{{ $t('dashboard_panel.addKanBan') }}</NButton>
        </div>

        <!-- Search operating area -->
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
          <NButton type="primary" @click="fetchBoards">
            {{ $t('common.search') }}
          </NButton>
        </div>
      </div>

      <!-- Kanban grid list -->
      <NGrid x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGridItem v-for="board in boards" :key="board.id">
          <ItemCard
            :title="board.name || ''"
            :subtitle="board.description || $t('common.noDescription')"
            :isStatus="false"
            hoverable
            :hideFooterLeft="true"
            @click-card="goRouter('ultra-kanban_kanban-details', board.id as string)"
          >
            <template #top-right-icon>
              <div v-if="board.home_flag === 'Y'" class="home-badge">
                {{ $t('generate.first') }}
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end gap-8px mt-auto">
                <NButton strong circle secondary @click.stop="editBoard(board)">
                  <template #icon>
                    <icon-material-symbols:contract-edit-outline class="text-20px text-blue" />
                  </template>
                </NButton>
                <NPopconfirm @positive-click="deleteBoard(board.id as string)">
                  <template #trigger>
                    <NButton strong secondary circle @click.stop>
                      <template #icon>
                        <icon-material-symbols:delete-outline class="text-20px text-red" />
                      </template>
                    </NButton>
                  </template>
                  {{ $t('common.confirmDelete') }}
                </NPopconfirm>
              </div>
            </template>
          </ItemCard>
        </NGridItem>
      </NGrid>

      <!-- Paginator -->
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

    <!-- New/Edit Kanban modal box -->
    <NModal
      v-model:show="showModal"
      :title="isEditMode ? $t('dashboard_panel.editKanban') : $t('dashboard_panel.addKanBan')"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
    >
      <NCard bordered>
        <NForm :model="formData" class="flex-1">
          <!-- Kanban name -->
          <NFormItem :label="$t('generate.dashboard-name')" path="name">
            <NInput v-model:value="formData.name" :placeholder="$t('generate.enter-dashboard-name')" />
          </NFormItem>

          <!-- Is it the home page? -->
          <NFormItem :label="$t('generate.is-homepage')">
            <NSelect
              v-model:value="formData.home_flag"
              :options="[
                { label: $t('common.yesOrNo.yes'), value: 'Y' },
                { label: $t('common.yesOrNo.no'), value: 'N' }
              ]"
            />
          </NFormItem>

          <!-- Description information -->
          <NFormItem :label="$t('device_template.table_header.description')">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('generate.enter-description')"
            />
          </NFormItem>
        </NForm>

        <!-- Action button at the bottom of the modal box -->
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton type="default" @click="handleCancel">
              {{ $t('generate.cancel') }}
            </NButton>

            <!-- Confirmation prompt when setting as homepage -->
            <NPopconfirm v-if="formData.home_flag === 'Y'" @positive-click="submitForm">
              <template #trigger>
                <NButton type="primary">{{ $t('common.save') }}</NButton>
              </template>
              {{ $t('custom.visualization.onlyOneHomepage') }}
            </NPopconfirm>

            <!-- Normal save button -->
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
/* UltraKanban container style */
.ultra-kanban-container {
  width: 100%;
  height: 100%;
}

/* Kanban card style */
.ultra-kanban-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.ultra-kanban-card:hover {
  box-shadow: var(--box-shadow);
  border-color: var(--primary-color);
}

/* Home logo badge */
.home-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -4px;
  margin-top: -2px;
  height: 24px;
  width: 24px;
  border: 1px solid var(--error-color);
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
  color: var(--error-color);
  font-weight: 600;
  background-color: var(--card-color);
}

/* Describe text style */
.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  text-wrap: wrap;
  flex: 1;
  max-width: 100%;
  color: var(--text-color-2);
  line-height: 1.4;
  font-size: 14px;
}

/* Main text color */
.text-primary {
  color: var(--primary-color);
}

/* Respond to theme changes */
[data-theme='dark'] .ultra-kanban-card {
  background-color: var(--card-color);
}

[data-theme='dark'] .home-badge {
  background-color: var(--modal-color);
}
</style>
