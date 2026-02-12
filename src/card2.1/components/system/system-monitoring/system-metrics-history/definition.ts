import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * System indicator history component definition
 * display systemCPU、Memory、Historical trend chart of disk usage
 */
export default {
  type: 'system-metrics-history',
  name: 'components.systemMetricsHistory', // Store translation keys，instead of calling$t()
  description: 'display systemCPU、Memory、Historical trend chart of disk usage，Support multi-index comparative analysis',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3z"/><path d="M7 17l3-3 2 2 5-5 1.4 1.4-6.4 6.4-2-2L7 17z" fill="#06b6d4"/><circle cx="9" cy="13" r="2" fill="#10b981"/><circle cx="14" cy="9" r="2" fill="#3b82f6"/><circle cx="18" cy="6" r="2" fill="#8b5cf6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['System monitoring', 'Performance indicators', 'historical trends', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition
