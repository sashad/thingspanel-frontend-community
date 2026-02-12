<script lang="tsx" setup>
import type { Ref } from 'vue'
import { inject, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import type { ICardData, ICardRender, ICardView } from '@/components/panel/card'
import { getTemplat } from '@/service/api'
import { $t } from '@/locales'
import AddTemplateCard from './ui/add-template-card.vue'

const props = defineProps<{ templateId: string; isApp: boolean }>()

const device_template_id = ref<any>(props.templateId as any)

provide('device_template_id', device_template_id)
const webChartConfig = inject<Ref<ICardView[]>>('web_chart_config')
const layout = ref<ICardView[]>([])
const fetchBroad = async () => {
  const { data, error } = await getTemplat(props.templateId)
  if (!error && data) {
    if (props.isApp && data.app_chart_config) {
      const configJson = JSON.parse(data.app_chart_config)
      layout.value = [...configJson]
    } else if (data.web_chart_config) {
      const configJson = JSON.parse(data.web_chart_config)
      layout.value = [...configJson]
    }
  }
}

const state = reactive({
  openAddPanel: false,
  cardData: null as null | ICardData
})

const editView = ref<ICardView | null>()
const cr = ref<ICardRender>()

const insertCard = (card: ICardData) => {
  if (editView.value && 'data' in editView.value) {
    editView.value.data = card

    const lastUniqueById = layout.value
      .reduceRight((acc: ICardView[], cur: ICardView) => {
        if (
          !acc.some(item => {
            if (!item.data) return false
            return item?.data?.cardId === cur?.data?.cardId
          })
        ) {
          acc.push(cur as ICardView) // ifaccmiddle没有当前curofcardId，then addcurarriveaccmiddle
        }
        return acc
      }, [])
      .reverse()
    layout.value = lastUniqueById
  } else {
    cr.value?.addCard(card)
  }
  editView.value = null
  state.openAddPanel = false
}

const add = () => {
  editView.value = null
  state.cardData = null
  state.openAddPanel = true
}
const edit = (view: ICardView) => {
  editView.value = view
  state.cardData = view.data || null
  state.openAddPanel = true
}

const updateLayoutData = (data: ICardView[]) => {
  nextTick(() => {
    layout.value = data
  })
}

watch(
  () => layout.value,
  () => {
    if (webChartConfig?.value) {
      webChartConfig.value = layout.value as any
    }
  }
)

onMounted(fetchBroad)
</script>

<template>
  <div class="w-full px-5 py-5">
    <NSpace align="center">
      <NButton @click="add">
        <SvgIcon icon="material-symbols:add" class="mr-0.5 text-lg" />
        {{ $t('generate.add-chart') }}
      </NButton>
    </NSpace>
    <div class="mb-2 mt-2 h-2px bg-[#f6f9f8]" />
    <div v-if="!layout.length" class="mt-20 text-center text-gray-500 dark:text-gray-400">
      <NEmpty :description="$t('common.componentsAddedYet')"></NEmpty>
    </div>
    <div :class="props.isApp ? 'screena overflow-auto h-[600px]' : 'window-screen'">
      <div :class="props.isApp ? 'm-auto w-480px smartphone overflow-auto' : 'w-full relative'">
        <CardRender
          ref="cr"
          :layout="layout"
          :is-preview="false"
          :col-num="props.isApp ? 4 : 12"
          :default-card-col="4"
          :breakpoints="{ lg: 780, md: 500, sm: 0 }"
          :cols="{ lg: 12, md: 6, sm: 4 }"
          :row-height="85"
          @update:layout="updateLayoutData"
          @edit="edit"
        />
      </div>
    </div>
    <AddTemplateCard v-model:open="state.openAddPanel" :data="state.cardData" @save="insertCard" />
  </div>
</template>

<style lang="scss" scoped>
.panel {
  @apply border border-transparent;
}
.smartphone {
  width: 480px; /* Set the width of the mobile phone frame */
  height: 960px; /* Set the height of the phone frame */
  border: 16px solid black; /* Set borders to simulate mobile phone borders */
  border-radius: 32px; /* Set the border rounded corners to simulate the rounded corners of a mobile phone */
  display: flex; /* useflexlayout */
  justify-content: center; /* Center horizontally */
  align-items: start; /* Center vertically */
  background: #f3f3f3; /* Set background color */
  box-shadow: 0 0 10px #999; /* Add shadow effect */
}

.screen {
  width: 90%; /* Set the screen width to the phone width90% */
  height: 90%; /* Set the screen height to the height of the phone90% */
  background: white; /* Set screen background color to white */
  border-radius: 24px; /* Set screen border rounded corners */
  display: flex; /* useflexlayout */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  color: black; /* Set text color */
  font-family: Arial, sans-serif; /* Set font */
}

/* Customize the overall style of the scroll bar */
.screena::-webkit-scrollbar {
  width: 4px; /* scroll bar width */
}

/* Custom scroll bar slider（thumb）style */
.screena::-webkit-scrollbar-thumb {
  background: #888; /* Scroll bar slider color */
  border-radius: 4px; /* Scroll bar slider rounded corners */
}

/* Custom scroll bar track（track）style */
.screena::-webkit-scrollbar-track {
  background: #f0f0f0; /* Scroll bar track color */
  border-radius: 4px; /* Scroll bar track rounded corners */
}
</style>
