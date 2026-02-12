<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** The color at which the gradient starts */
  startColor?: string
  /** The color at which the gradient ends */
  endColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  startColor: '#5B8CFF', // New default start color
  endColor: '#8EC5FC' // New default end color
})

const gradientStyle = computed(() => `linear-gradient(to bottom right, ${props.startColor}, ${props.endColor})`)
</script>

<template>
  <div class="rounded-8px p-16px text-white" :style="{ backgroundImage: gradientStyle }">
    <slot></slot>
  </div>
</template>

<style scoped></style>
