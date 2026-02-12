<template>
  <GenericCard
    :start-color="cardData.colors[0]"
    :end-color="cardData.colors[1]"
  >
    <template #title>
      {{ cardData.title }}
    </template>
    <template #icon>
      <SvgIcon :icon="cardData.icon" class="text-32px" />
    </template>
    <template #value>
      <CountTo
        :prefix="cardData.unit"
        :start-value="1"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </template>
  </GenericCard>
</template>

<script setup lang="ts">
/**
 * Message information component，Keep with the original1:1Function matching
 */
import { ref } from 'vue'
import { $t } from '@/locales'
import { tenantNum } from '@/service/api'
import { createLogger } from '@/utils/logger'
import GenericCard from '@/card2.1/components/common/generic-card/component.vue'

const logger = createLogger('News') // consistent with the originalloggername

// Card data configuration，Keep with the original1:1consistent
const cardData = ref({
  id: 'trade', // Stay consistent with the original
  title: $t('card.msgTotal'),
  value: 0,
  unit: $t('card.msgUnit'),
  colors: ['#fcbc25', '#f68057'],
  icon: 'fa-envelope' // Stay consistent with the original
})

// Get data，Keep with the original1:1consistent
const getData = async () => {
  try {
    const response = await tenantNum()
    if (response.data) {
      cardData.value.value = response.data?.msg ?? 0
    } else {
      logger.error('Data does not contain the required properties or they are not numbers.')
    }
  } catch (error) {
    // Error while processing request data
    logger.error('Error fetching data:')
  }
}

// call getData function，Stay consistent with the original
getData()

defineOptions({
  name: 'NumCard' // Component names consistent with the original version
})
</script>

<style scoped>
/* All styles are created by GenericCard deal with，No additional styling required here */
</style>