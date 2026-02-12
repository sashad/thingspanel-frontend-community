<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** The color at which the gradient starts */
  startColor?: string
  /** The color at which the gradient ends */
  endColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  startColor: '#56cdf3', // Default colors, can be overridden by component props if needed
  endColor: '#719de3'
})

const gradientStyle = computed(() => `linear-gradient(to bottom right, ${props.startColor}, ${props.endColor})`)
</script>

<template>
  <div class="rounded-8px p-16px text-white" :style="{ backgroundImage: gradientStyle }">
    <slot></slot>
  </div>
</template>

<style scoped></style>
