<template>
  <div class="h-full flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
    <!-- title bar -->
    <div class="w-full flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
          <Icon icon="mdi:information-outline" class="text-xl text-blue-600 dark:text-blue-400" />
        </div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('card.versionInfo.title') }}</span>
      </div>

      <!-- GitHub Link -->
      <a
        href="https://github.com/ThingsPanel/thingspanel-frontend-community"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        :title="$t('card.versionInfo.visitGithub')"
      >
        <Icon icon="mdi:github" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </a>
    </div>

    <!-- Version information display area -->
    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-4">
      <!-- Current version label -->
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('card.versionInfo.currentVersion') }}
      </div>

      <!-- version number -->
      <div class="text-4xl font-bold text-gray-900 dark:text-white tracking-wider">
        {{ currentVersion }}
      </div>

      <!-- Version description -->
      <div class="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
        {{ $t('card.versionInfo.description') }}
      </div>

      <!-- version status label -->
      <div class="mt-4">
        <n-tag
          type="info"
          size="medium"
          round
          class="px-4 py-2 font-medium"
        >
          <template #icon>
            <Icon icon="mdi:tag-outline" class="text-base" />
          </template>
          {{ $t('card.versionInfo.stableVersion') }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Version information component - system interactive components
 * Pure static display component，Display current system version information，unnecessaryAPIdata source
 */
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NTag } from 'naive-ui'
import { $t } from '@/locales'

// Static version configuration（Should be obtained from configuration files or environment variables）
const currentVersion = computed(() => {
  // Can be obtained from package.json Or environment variable to get the version number
  return import.meta.env.VITE_APP_VERSION || 'v2.1.0'
})

defineOptions({
  name: 'VersionCard21'
})
</script>

<style scoped>
/* Pulse animation effect */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>