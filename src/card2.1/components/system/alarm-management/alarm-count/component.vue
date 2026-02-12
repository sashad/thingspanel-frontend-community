<template>
  <GenericCard :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <template #title>{{ cardData.title }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    </template>
    <template #value>
      <CountTo
        :start-value="0"
        :end-value="cardData.value"
        :suffix="cardData.unit"
      />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
/**
 * @file Alarm statistics card (Card 2.1)
 * @description use GenericCard Refactor，Display the current total number of alarms in the system。
 */
import { ref } from "vue";
import GenericCard from "@/card2.1/components/common/generic-card/component.vue";
import { CountTo } from 'vue3-count-to';
import { $t } from '@/locales';
import { getAlarmCount } from '@/service/api';
import { createLogger } from '@/utils/logger';

// Define component name
defineOptions({ name: 'AlarmCountCardV2' });

// Logger
const logger = createLogger('AlarmCountCardV2');

// Card responsive data，Keep with the original1:1consistent
const cardData = ref({
  title: $t('card.alarmCount'),
  value: 0,
  unit: $t('card.alarmUnit'), // Use internationalization，Consistent with the original
  colors: ['#f97316', '#ef4444'], // Color scheme consistent with the original
});

/**
 * @function getData
 * @description from API Get alarm statistics and update cards。
 */
const getData = async () => {
  try {
    const response: { data: any } = await getAlarmCount();
    // Verify the validity of response data
    if (response && response.data && typeof response.data.alarm_device_total === 'number') {
      cardData.value.value = response.data.alarm_device_total;
    } else {
      logger.error('Alarm statistics are missing、Non-numeric or response structure not expected。', response);
      cardData.value.value = 0; // Reset to when data is invalid0
    }
  } catch (error) {
    logger.error('An error occurred while obtaining alarm statistics:', error);
    cardData.value.value = 0; // Reset to0
  }
};

// Get data during initialization
getData();
</script>

<style scoped>
.icon {
  color: #fff;
}
</style>