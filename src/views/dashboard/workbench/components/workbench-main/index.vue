<script setup lang="ts">
import { $t } from '@/locales'
import { ShortcutsCard, TechnologyCard } from './components'

defineOptions({ name: 'DashboardWorkbenchMain' })

interface Technology {
  id: number
  name: string
  description: string
  author: string
  site: string
  icon: string
  iconColor?: string
}

const technology: Technology[] = [
  {
    id: 0,
    name: 'Vue',
    description: $t('card.vueDesc'),
    author: 'You Yuxi - Evan You',
    site: 'https://v3.cn.vuejs.org/',
    icon: 'logos:vue'
  },
  {
    id: 1,
    name: 'TypeScript',
    description: $t('card.typeScriptDesc'),
    author: 'Microsoft - Microsoft',
    site: 'https://www.typescriptlang.org/',
    icon: 'logos:typescript-icon'
  },
  {
    id: 2,
    name: 'Vite',
    description: $t('card.viteDesc'),
    author: 'You Yuxi - Evan You',
    site: 'https://vitejs.cn/',
    icon: 'logos:vitejs'
  },
  {
    id: 3,
    name: 'NaiveUI',
    description: $t('card.naviewUIDesc'),
    author: 'TuSimple - TuSimple',
    site: 'https://www.naiveui.com/zh-CN/os-theme',
    icon: 'logos:naiveui'
  },
  {
    id: 4,
    name: 'UnoCSS',
    description: $t('card.UnoCssDesc'),
    author: 'Anthony Fu',
    site: 'https://uno.antfu.me/?s=',
    icon: 'logos:unocss'
  },
  {
    id: 5,
    name: 'Pinia',
    description: $t('card.piniaDesc'),
    author: 'Posva',
    site: 'https://pinia.esm.dev/',
    icon: 'noto:pineapple'
  }
]

interface Activity {
  id: number
  content: string
  time: string
}

const activity: Activity[] = [
  {
    id: 4,
    content: 'Soybean I just wrote some random things on the workbench page.，It is okay to watch！',
    time: '2021-11-07 22:45:32'
  },
  {
    id: 3,
    content: 'Soybean are busy working onsoybean-adminWrite project documentation！',
    time: '2021-11-03 20:33:31'
  },
  {
    id: 2,
    content: 'Soybean Prepare forsoybean-admin 1.0Make adequate preparations for the release of！',
    time: '2021-10-31 22:43:12'
  },
  {
    id: 1,
    content: '@yanbowe Towardssoybean-adminsubmitted abug，Multi-tab bar will not adapt。',
    time: '2021-10-27 10:24:54'
  },
  {
    id: 0,
    content: 'Soybean exist2021Year5moon28Open source project created in Japansoybean-admin！',
    time: '2021-05-28 22:22:22'
  }
]

interface Shortcuts {
  id: number
  label: string
  icon: string
  iconColor: string
}

const shortcuts: Shortcuts[] = [
  {
    id: 0,
    label: 'main console',
    icon: 'mdi:desktop-mac-dashboard',
    iconColor: '#409eff'
  },
  {
    id: 1,
    label: 'System management',
    icon: 'ic:outline-settings',
    iconColor: '#7238d1'
  },
  { id: 2, label: 'Permission management', icon: 'mdi:family-tree', iconColor: '#f56c6c' },
  {
    id: 3,
    label: 'components',
    icon: 'fluent:app-store-24-filled',
    iconColor: '#19a2f1'
  },
  { id: 4, label: 'sheet', icon: 'mdi:table-large', iconColor: '#fab251' },
  { id: 5, label: 'chart', icon: 'mdi:chart-areaspline', iconColor: '#8aca6b' }
]
</script>

<template>
  <NGrid :item-responsive="true" :x-gap="16" :y-gap="16">
    <NGridItem span="0:24 640:24 1024:16">
      <NSpace :vertical="true" :size="16">
        <NCard
          :title="$t('generate.project-main-tech-stack')"
          :bordered="false"
          size="small"
          class="rounded-8px shadow-sm"
        >
          <template #header-extra>
            <a class="text-primary" href="javascript:;">{{ $t('generate.more-tech-stack') }}</a>
          </template>
          <NGrid :item-responsive="true" responsive="screen" cols="m:2 l:3" :x-gap="8" :y-gap="8">
            <NGridItem v-for="item in technology" :key="item.id">
              <TechnologyCard v-bind="item" />
            </NGridItem>
          </NGrid>
        </NCard>
        <NCard :title="$t('generate.dynamic')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <template #header-extra>
            <a class="text-primary" href="javascript:;">{{ $t('generate.more-dynamics') }}</a>
          </template>
          <NList>
            <NListItem v-for="item in activity" :key="item.id">
              <template #prefix>
                <IconLocalAvatar class="text-48px" />
              </template>
              <NThing :title="item.content" :description="item.time" />
            </NListItem>
          </NList>
        </NCard>
      </NSpace>
    </NGridItem>
    <NGridItem span="0:24 640:24 1024:8">
      <NSpace :vertical="true" :size="16">
        <NCard :title="$t('generate.quick-operation')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <NGrid :item-responsive="true" responsive="screen" cols="m:2 l:3" :x-gap="8" :y-gap="8">
            <NGridItem v-for="item in shortcuts" :key="item.id">
              <ShortcutsCard v-bind="item" />
            </NGridItem>
          </NGrid>
        </NCard>
        <NCard :title="$t('generate.creativity')" :bordered="false" size="small" class="rounded-8px shadow-sm">
          <div class="h-380px flex-center">
            <IconLocalBanner class="text-400px text-primary sm:text-320px" />
          </div>
        </NCard>
      </NSpace>
    </NGridItem>
  </NGrid>
</template>

<style scoped></style>
