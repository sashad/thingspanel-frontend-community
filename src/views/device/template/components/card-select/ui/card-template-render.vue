<script setup lang="ts">
import type { ICardData, ICardView } from '@/components/panel/card'
import './gird.css'
import { $t } from '@/locales'
import CardTemplateItem from './card-template-item.vue'

// This file is not used any more, but I keep it here for reference.
// Standard card render component is used instead.

const props = defineProps<{
  layout: ICardView[]
  isApp: boolean
}>()

const emit = defineEmits<{
  (e: 'update:layout', layout: ICardView[] | any): void
  (e: 'edit', view: ICardView): void
  // (e: 'remove', view: ICardView): void;
}>()

defineExpose({
  addCard: (data: ICardData) => {
    const layout = props.layout
    const foundIndex = layout.findIndex(item => item?.data?.cardId === data.cardId)
    if (foundIndex !== -1) {
      layout[foundIndex].data = data
    } else {
      layout.push({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        i: 0,
        data
      })
    }
    emit('update:layout', [...layout])
  }
})

const removeLayout = (i: any) => {
  emit(
    'update:layout',
    props.layout.filter(item => item.data?.cardId !== i)
  )
}
</script>

<template>
  <div :class="props.isApp ? 'screena overflow-auto h-[600px]' : 'window-screen'">
    <div :class="props.isApp ? 'm-auto w-480px smartphone overflow-auto' : 'w-full relative'">
      <n-grid :cols="props.isApp ? 1 : 2" x-gap="12" y-gap="12" class="screena relative w-full overflow-auto">
        <n-gi v-for="item in layout" :key="item?.data?.cardId">
          <div class="relative h-full">
            <NIcon
              class="absolute right-8 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
              @click="emit('edit', item)"
            >
              <SvgIcon icon="uil:setting" class="text-base" />
            </NIcon>
            <NPopconfirm
              :show-icon="false"
              :negative-button-props="{ size: 'tiny' }"
              :positive-button-props="{ size: 'tiny' }"
              :on-positive-click="() => removeLayout(item?.data?.cardId)"
            >
              <template #trigger>
                <NIcon
                  class="absolute right-2 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
                >
                  <SvgIcon icon="material-symbols:delete-outline" class="text-base" />
                </NIcon>
              </template>
              <span>{{ $t('generate.confirm-delete-dashboard') }}</span>
            </NPopconfirm>
            <CardTemplateItem :data="item.data!" />
          </div>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
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
