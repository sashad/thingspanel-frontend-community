import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description Offline device count component definition
 * @summary Shows the number of devices currently offline，Support real-time monitoring
 */
export default {
  type: 'off-line',
  name: 'components.offLine', // Store translation keys，instead of calling$t()
  description: 'Shows the number of devices currently offline',
  // repair：SVG path `d` Property contains illegal number delimiter（For example `10-10 2`），Causing browser parsing errors。
  // solve：Replace with legal Material icon path，and keep the red status dot。
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><circle cx="12" cy="12" r="3" fill="#ef4444"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'equipment', 'Offline', 'state', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition;
