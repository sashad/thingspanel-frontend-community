<script setup lang="ts">
defineOptions({ name: 'DashboardWorkbenchMainTechnologyCard' })

interface Props {
  /** Technical name */
  name: string
  /** Technical description */
  description: string
  /** technical writer */
  author: string
  /** Technology official website */
  site: string
  /** technology icons */
  icon: string
  /** icon color */
  iconColor?: string
}

const props = defineProps<Props>()

function handleOpenSite() {
  window.open(props.site, '_blank')
}
</script>

<template>
  <div
    class="h-120px cursor-pointer border-1px border-#efeff5 rounded-4px p-4px dark:border-#ffffff17 hover:shadow-sm"
    @click="handleOpenSite"
  >
    <header class="flex-y-center">
      <SvgIcon :icon="icon" :style="{ color: iconColor }" class="text-30px" />
      <h3 class="pl-12px text-18px font-semibold">{{ name }}</h3>
    </header>
    <p class="h-56px py-8px text-#999">{{ description }}</p>
    <div class="flex justify-end">
      <span>{{ author }}</span>
    </div>
  </div>
</template>

<style scoped></style>
