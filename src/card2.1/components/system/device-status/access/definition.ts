import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';
/**
 * @description Component definition
 * @summary Device total card，Used to display the total number of devices in the system statistics。
 */
export default {
  type: 'access',
  name: 'components.access', // Store translation keys，instead of calling$t()
  title: 'Total number of devices',
  description: 'Displays statistics on the total number of devices in the system，Supports displaying different ranges of device data based on permissions',
  icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4zm-2-8V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm0 5v-2c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm0 5v-2c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z"/></svg>',
  component,
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  // Since this component has no properties that the user can configure in the editor，therefore omitted `props` definition
} as ComponentDefinition;