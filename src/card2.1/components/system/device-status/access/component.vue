<template>
  <GenericCard start-color="#722ed1" end-color="#9254de">
    <template #title>{{ t('card.deviceTotal') }}</template>
    <template #icon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2M9 9h6v6H9zM5 9h2v2H5zm0 4h2v2H5zm12-4h2v2h-2zm0 4h2v2h-2zM9 5h2v2H9zm4 0h2v2h-2zM5 13h2v2H5zm12 0h2v2h-2zm-4 4h2v2h-2zm-4 0h2v2H9z"
        />
      </svg>
    </template>
    <template #value>
      <CountTo :end-val="count" />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { CountTo } from 'vue3-count-to';
import { totalNumber, sumData } from '@/service/api/system-data';
import { useAuthStore } from '@/store/modules/auth';
import { createLogger } from '@/utils/logger';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const logger = createLogger('Access');
const count = ref(0);

/**
 * Get total device data
 * Call different functions based on user permissionsAPIinterface
 */
async function fetchDeviceTotal() {
  try {
    // Choose different ones based on user permissionsAPIinterface，Keep with the original1:1consistent
    const response = authStore?.$state.userInfo.authority === 'TENANT_ADMIN'
      ? await sumData()
      : await totalNumber();

    if (response.data && typeof response.data.device_total === 'number') {
      count.value = response.data.device_total;
    } else {
      logger.error('Data does not contain the required properties or they are not numbers.');
    }
  } catch (error) {
    // Error while processing request data
    logger.error('Error fetching data:', error);
  }
}

onMounted(() => {
  fetchDeviceTotal();
});
</script>

<style lang="scss" scoped>
/* All styles are now handled by the GenericCard component */
</style>
