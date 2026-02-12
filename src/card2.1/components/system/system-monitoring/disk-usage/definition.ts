import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description Disk usage component definition
 * @summary Display system disk usage percentage，Support real-time monitoring
 */
export default {
  type: 'disk-usage',
  name: 'components.diskUsage', // Store translation keys，instead of calling$t()
  description: 'Display system disk usage percentage，Every30Automatically refresh data every second',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 18V4h12v16H6z"/><path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#f59e0b"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'monitor', 'disk', 'storage', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;