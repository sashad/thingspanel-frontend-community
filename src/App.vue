<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { NConfigProvider, darkTheme } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import json from 'highlight.js/lib/languages/json'
import hljs from 'highlight.js/lib/core'
import { useAppStore } from './store/modules/app'
import { useThemeStore } from './store/modules/theme'
import { naiveDateLocales, naiveLocales } from './locales/naive'
import Content from './components/content/index.vue'

hljs.registerLanguage('json', json)

defineOptions({
  name: 'App'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
const { isFullscreen, toggle } = useFullscreen()
const naiveDarkTheme = computed(() => (themeStore.darkMode ? darkTheme : undefined))

const naiveLocale = computed(() => {
  return naiveLocales[appStore.locale]
})

const naiveDateLocale = computed(() => {
  return naiveDateLocales[appStore.locale]
})

/**
 * 🔥 repair：Disable global full screen listener
 *
 * original logic problem：When exiting a child element full screen，Will mistakenly trigger the entire page to full screen
 * Now：Comment out this listener，Let each component manage the full-screen state by itself
 *
 * Original code：
 * const handleFullScreenChange = () => {
 *   if (!document.fullscreenElement) {
 *     if (isFullscreen) {
 *       toggle()  // ❌ Will cause the editor to exit full screen after，Enter page full screen now
 *     }
 *   }
 * }
 */

// Comment out the global full screen listener
// onMounted(() => {
//   document.addEventListener('fullscreenchange', handleFullScreenChange)
// })

// onBeforeUnmount(() => {
//   document.removeEventListener('fullscreenchange', handleFullScreenChange)
// })
</script>

<template>
  <NConfigProvider
    :hljs="hljs"
    :theme="naiveDarkTheme"
    :theme-overrides="themeStore.naiveTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    class="h-full"
  >
    <NMessageProvider>
      <Content />
      <AppProvider>
        <RouterView class="bg-layout" />
      </AppProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
