<template>
  <div class="card-container" :style="cardStyle">
    <div class="content-wrapper">
      <div class="header">
        <div class="title">
          <slot name="title"></slot>
        </div>
        <div class="icon">
          <slot name="icon"></slot>
        </div>
      </div>
      <div class="value">
        <slot name="value"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// Define components props
const props = defineProps({
  // color properties，Used to set background gradient
  startColor: {
    type: String,
    default: '#409eff'
  },
  endColor: {
    type: String,
    default: '#67c23a'
  }
});

// calculation style，Based on the color passed in props Generate background gradient
const cardStyle = computed(() => ({
  backgroundImage: `linear-gradient(45deg, ${props.startColor} 0%, ${props.endColor} 25%, ${props.startColor} 50%, ${props.endColor} 75%, ${props.startColor} 100%)`,
  backgroundSize: '400% 400%', // Ensure the background size required for animation
  animation: 'dazzling-gradient 10s ease-in-out infinite' // Make sure the animation is not overwritten
}));
</script>

<style lang="scss" scoped>
/*
  Define keyframes for gradient animation
  Achieve sweeping effect by changing background position
*/
@keyframes dazzling-gradient {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

/* Basic styles for card containers */
.card-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  padding: 16px;
  box-sizing: border-box;
  color: white; /* Set text color to white for better contrast */

  /*
    Animation effects now pass JavaScript Calculation style settings
    This ensures that custom colors and animations take effect at the same time
  */
}

/* content wrapper，for centering */
.content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* icon style */
.icon :deep(svg) {
  width: 44px;
  height: 44px;
  opacity: 0.9;
  color: white; /* Make sure the icon is white */
}

/* Title style */
.title {
  font-size: 20px;
  font-weight: 500;
  color: white; /* Make sure the title is white */
}

/* Numeric style */
.value {
  font-size: 44px;
  font-weight: bold;
  color: white; /* Make sure the value is white */
  text-align: left;
  width: 100%;
}

/* dark mode style */
:global(.dark) .card-container {
  /*
    Dark teal gradient coordinated for dark mode
  */
  background-image: linear-gradient(
    45deg,
    #1d3a5c,
    #2c5282,
    #2b6cb0,
    #2a5c40
  );
  color: #e5e7eb; /* Tailwind gray-200 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

:global(.dark) .icon {
  color: #e5e7eb;
}

:global(.dark) .title {
  color: #d1d5db;
}

:global(.dark) .value {
  color: #f9fafb;
}
</style>
