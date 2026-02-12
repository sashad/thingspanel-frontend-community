# TelemetryDataHistoryListFilter components

this is a Vue 3 components，Used to provide filtering capabilities for the telemetry data history of a specified device。It allows users to sort by time range（Default or custom）and aggregation methods（Time windows and aggregate functions）Filter data，and optionally export data。

## Function

*   Select a preset time range（如recent1Hour、recent24Hour等）or custom time range。
*   Select a time window for data aggregation（If not aggregated、30Second、1minute、1Hours waiting）。
*   When selecting the aggregation window，Aggregation function optional（average value、maximum value、minimum value、sum、Difference）。
*   Automatically disable inappropriate aggregation window options based on selected time range（For example，Query1Hourly data cannot be aggregated by day）。
*   Automatically adjust aggregation windows based on selections，Prevent invalid combinations from being selected。
*   Provides two display modes：`detailed`（Show labeled buttons）and `simple`（Display band Tooltip icon button）。
*   Optional export button，Used to trigger the data export process。
*   Automatically obtain data when filter conditions change or components are mounted.。
*   When the device ID (`deviceId`) or data key (`theKey`) Automatically reacquire data when changes occur。
*   Issue data update event (`update:data`) and loading status update event (`update:loading`)。

## Props

| Prop               | type                             | default value      | describe                                                                 | Is it necessary |
| :----------------- | :------------------------------- | :---------- | :------------------------------------------------------------------- | :------- |
| `deviceId`         | `string`                         | -           | The device to query data from ID。                                                | yes       |
| `theKey`           | `string`                         | -           | The key name of the telemetry data to be queried。                                               | yes       |
| `showExportButton` | `boolean`                        | `false`     | Whether to display the export button。                                                   | no       |
| `displayMode`      | `'detailed' \| 'simple'`        | `'detailed'`| Component display mode：`'detailed'` Show full button，`'simple'` show icon button。 | no       |

## Emits

| event name            | Parameter type             | describe                                                                 |
| :---------------- | :------------------- | :------------------------------------------------------------------- |
| `update:data`     | `TimeSeriesItem[]`   | Triggered when filtered data loading is complete，Pass the obtained time series data array。             |
| `update:loading`  | `boolean`            | Triggered when data loading status changes（Start loading as `true`，The loading ends with `false`）。 |
| `update:filterParams`| `FilterParams`       | When internal verification passes，Filter parameters ready（Used to get data or export）triggered when。The parent component can listen to this event to get the current filter conditions。 |

## TimeSeriesItem structure

```typescript
interface TimeSeriesItem {
  x: number; // Timestamp (millisecond)
  x2?: number; // Optional second timestamp (Used for difference aggregation, etc.)
  y: number; // telemetry value
}
```

## Usage example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import TelemetryDataHistoryListFilter from '@/components/TelemetryDataHistoryListFilter/index.vue'; // Make sure the path is correct

const deviceId = ref('your-device-id');
const telemetryKey = ref('temperature');
const historyData = ref([]);
const isLoading = ref(false);

const handleDataUpdate = (data) => {
  historyData.value = data;
  console.log('Data updated:', data);
};

const handleLoadingUpdate = (loading) => {
  isLoading.value = loading;
  console.log('Loading state:', loading);
};
</script>

<template>
  <div>
    <h2>Telemetry Data for {{ telemetryKey }}</h2>
    <TelemetryDataHistoryListFilter
      :device-id="deviceId"
      :the-key="telemetryKey"
      :show-export-button="true"
      display-mode="detailed"
      @update:data="handleDataUpdate"
      @update:loading="handleLoadingUpdate"
    />

    <div v-if="isLoading">
      Loading data...
    </div>
    <div v-else>
      <!-- show here historyData -->
      <pre>{{ JSON.stringify(historyData, null, 2) }}</pre>
    </div>
  </div>
</template>
```

## Things to note

*   Component dependencies Naive UI (`naive-ui`) and `@vicons/material` Icon library。Please make sure these dependencies are installed and configured correctly。
*   The component depends on a component named `telemetryDataHistoryList` of API Service function to get data，and a `useLoading` hook and `createLogger` Utility function。Please make sure these services and tools are available in the project and the paths are correct。
*   Export function (`handleExport`) Currently only logs are printed and prompts are displayed. (`window.$message`)，The actual file download logic may need to be modified depending on the backend API response to achieve。
*   internationalization（i18n）Currently marked as `// TODO`，Need to be implemented according to project requirements。 