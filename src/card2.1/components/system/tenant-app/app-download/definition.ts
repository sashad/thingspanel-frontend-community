import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Application download component definition
 * Provide download entrance for mobile applications，Contains QR code and app store link
 */
export default {
  type: 'app-download',
  name: 'components.appDownload', // Store translation keys，instead of calling$t()
  description: 'Provide download entrance for mobile applications，Contains QR code scanning and app store download links',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zM14 21h-4v-1h4v1zm3-4H7V6h10v11z"/><path d="M12 8l-4 4h3v4h2v-4h3l-4-4z" fill="#06b6d4"/></svg>',
  component,
  version: '2.1.0',
  tags: ['Application download', 'QR code', 'mobile application', 'interaction'],
  dataDriven: false, // This is a purely interactive component，Provide static download function，Does not rely on external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
