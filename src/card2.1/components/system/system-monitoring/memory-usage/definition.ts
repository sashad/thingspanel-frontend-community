import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description Memory usage component definition
 * @summary Display system memory usage percentage，Support real-time monitoring
 */
export default {
  type: 'memory-usage',
  name: 'components.memoryUsage', // Store translation keys，instead of calling$t()
  description: 'Display system memory usage percentage，Every30Automatically refresh data every second',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/><rect x="7" y="7" width="2" height="6" fill="#10b981"/><rect x="11" y="8" width="2" height="5" fill="#06b6d4"/><rect x="15" y="6" width="2" height="7" fill="#8b5cf6"/><path d="M8 21h8v2H8v-2z" fill="#6b7280"/><path d="M12 17v4" fill="#6b7280"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'monitor', 'Memory', 'performance', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;