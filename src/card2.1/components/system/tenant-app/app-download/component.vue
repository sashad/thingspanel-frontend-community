<template>
  <!-- Simplified version，Keep with the original1:1Function matching -->
  <div class="p-4 border rounded flex flex-col items-center justify-center h-full">
    <div class="text-lg font-semibold mb-4">{{ $t('card.appDownload.title') }}</div>
    <div class="flex items-center justify-center space-x-4 mb-4">
      <img :src="downloadAppImage" alt="QR Code" class="w-24 h-24" />
      <div class="flex flex-col space-y-2">
        <!-- Remove click functionality，Maintain a static display consistent with the original version -->
        <img :src="appStoreImage" alt="App Store" class="h-10 cursor-pointer" />
        <img :src="googlePlayImage" alt="Google Play" class="h-10 cursor-pointer" />
      </div>
    </div>
    <div>{{ $t('card.appDownload.scanOrClick') }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * Application download component，Keep with the original1:1Function matching
 * Provide static display only，Does not include click to download function
 */
import { $t } from '@/locales'

// Import image resources，Keep naming consistent with the original
import downloadAppImage from './download_app.png'
import appStoreImage from './placeholder-app-store.png'
import googlePlayImage from './placeholder-google-play.png'

defineOptions({
  name: 'AppDownloadCard'
})
</script>

<style scoped>
/* Simple style consistent with the original */
img {
  /* Prevent images from being stretched */
  object-fit: contain;
}
</style>