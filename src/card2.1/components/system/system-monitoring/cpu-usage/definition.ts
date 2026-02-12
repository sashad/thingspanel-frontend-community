import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description CPU Usage component definition
 * @summary display system CPU Utilization percentage，Support real-time monitoring
 */
export default {
  type: 'cpu-usage',
  name: 'components.cpuUsage', // Store translation keys，instead of calling$t()
  description: 'display system CPU Utilization percentage，Every30Automatically refresh data every second',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm5 5h6v6H9V9z"/><path d="M7 2h2v3H7V2zm8 0h2v3h-2V2zm-8 17h2v3H7v-3zm8 0h2v3h-2v-3zM2 7h3v2H2V7zm0 6h3v2H2v-2zm17-6h3v2h-3V7zm0 6h3v2h-3v-2z" fill="#3b82f6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'monitor', 'CPU', 'performance', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;