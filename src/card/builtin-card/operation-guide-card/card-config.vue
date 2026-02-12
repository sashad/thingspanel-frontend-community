<script lang="ts" setup>
import { inject, ref, watch, onMounted, computed } from 'vue'
import { NDynamicInput, NInput, NColorPicker, NFormItem, NGrid, NFormItemGi } from 'naive-ui'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'
import { cloneDeep } from 'lodash'

interface GuideItem {
  title: string
  description: string
  link: string
}

const ctx = inject<IConfigCtx>('config-ctx')!

const guideListRef = ref<GuideItem[]>([])

const configRef = computed(() => ctx.config)
if (!configRef.value.serialBgColor) {
  configRef.value.serialBgColor = '#2080f0'
}
if (!configRef.value.itemBgColor) {
  configRef.value.itemBgColor = '#f3f3f5'
}
if (!configRef.value.itemHoverBgColor) {
  configRef.value.itemHoverBgColor = '#EDEDFF'
}
if (!configRef.value.titleColor) {
  configRef.value.titleColor = '#333639'
}
if (!configRef.value.descriptionColor) {
  configRef.value.descriptionColor = '#666'
}

watch(
  guideListRef,
  newValue => {
    ctx.config.guideList = newValue
  },
  { deep: true }
)

watch(
  () => ctx.config.guideList,
  newConfigValue => {
    if (JSON.stringify(newConfigValue) !== JSON.stringify(guideListRef.value)) {
      guideListRef.value = cloneDeep(newConfigValue as GuideItem[]) || []
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  // Watch with immediate: true should handle initial sync
  // guideListRef.value = cloneDeep(ctx.config.guideList as GuideItem[]) || [];
})

const createDefaultGuideItem = (): GuideItem => {
  return {
    title: '',
    description: '',
    link: ''
  }
}
</script>

<template>
  <div>
    <h4 class="mb-2 font-semibold">{{ $t('card.uiSettings') }}</h4>
    <NGrid :cols="5" :x-gap="12">
      <NFormItemGi :label="$t('card.serialBgColor')" class="config-item">
        <NColorPicker v-model:value="configRef.serialBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.itemBgColor')" class="config-item">
        <NColorPicker v-model:value="configRef.itemBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.itemHoverBgColor')" class="config-item">
        <NColorPicker v-model:value="configRef.itemHoverBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.titleColor')" class="config-item">
        <NColorPicker v-model:value="configRef.titleColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.descriptionColor')" class="config-item">
        <NColorPicker v-model:value="configRef.descriptionColor" size="small" :show-alpha="false" />
      </NFormItemGi>
    </NGrid>

    <hr class="my-4" />

    <h4 class="mb-2 font-semibold">{{ $t('card.guideList') }}</h4>
    <NDynamicInput
      #default="{ value, index }"
      v-model:value="guideListRef"
      :on-create="createDefaultGuideItem"
      item-style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #eee;"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold w-6 text-center">{{ index + 1 }}.</span>
        <NInput v-model:value="value.title" class="flex-1" type="text" :placeholder="$t('card.title')" size="small" />
        <NInput
          v-model:value="value.description"
          class="flex-1"
          type="text"
          :placeholder="$t('card.description')"
          size="small"
        />
        <NInput
          v-model:value="value.link"
          class="flex-1"
          type="text"
          :placeholder="$t('card.pleaseEnterLink')"
          size="small"
        />
      </div>
    </NDynamicInput>
  </div>
</template>

<style scoped>
/* Adjustment NFormItemGi within label and picker Alignment */
.config-item :deep(.n-form-item-label) {
  padding: 0;
  line-height: normal; /* Adjust row height to avoid being too high */
  margin-bottom: 4px; /* label and picker add a little distance between */
  text-align: left; /* Make sure to align left */
  /* Add fixed width and overflow handling */
  width: 80px; /* Or adjust according to the actual longest label max-width */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.config-item :deep(.n-form-item-blank) {
  width: 100%; /* Make the color picker full */
}

/* Some global styles can be kept or removed */
</style>
