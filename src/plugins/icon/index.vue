<script lang="ts" setup>
import { ref } from 'vue'
import { icons } from './icons'

const selectValue = ref('')

const localIcons = ['custom-icon', 'activity', 'at-sign', 'cast', 'chrome', 'copy', 'wind']
</script>

<template>
  <div class="h-full">
    <NCard title="IconComponent example" :bordered="false" class="rounded-8px shadow-sm">
      <div class="grid grid-cols-10">
        <template v-for="item in icons" :key="item">
          <div class="mt-5px flex-x-center">
            <SvgIcon :icon="item" class="text-30px" />
          </div>
        </template>
      </div>
      <div class="mt-50px">
        <h1 class="mb-20px text-18px font-500">IconIcon selector</h1>
        <IconSelect v-model:value="selectValue" :icons="icons" />
      </div>
      <template #footer>
        <WebSiteLink label="iconifyaddress：" link="https://icones.js.org/" class="mt-10px" />
      </template>
    </NCard>
    <NCard title="Custom icon example" :bordered="false" class="mt-10px rounded-8px shadow-sm">
      <div class="pb-12px text-16px">
        existsrc/assets/svg-icondocument夹下的svgdocument，通过existtemplateinside with icon-local-{document名} Direct rendering,
        inicon-localfor.envin the file VITE_ICON_LOCAL_PREFIX
      </div>
      <div class="grid grid-cols-10">
        <div class="mt-5px flex-x-center">
          <IconLocalActivity class="text-40px text-success" />
        </div>
        <div class="mt-5px flex-x-center">
          <IconLocalCast class="text-20px text-error" />
        </div>
      </div>
      <div class="py-12px text-16px">passSvgIconDynamic rendering of components, 菜单passmetaoflocalIconProperty rendering custom icon</div>
      <div class="grid grid-cols-10">
        <div v-for="(fileName, index) in localIcons" :key="index" class="mt-5px flex-x-center">
          <SvgIcon :local-icon="fileName" class="text-30px text-primary" />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
