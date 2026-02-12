<script setup lang="ts">
import { computed, h, onMounted, onUnmounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { ArrowBack } from '@vicons/ionicons5'
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials'
import type { LayoutMode } from '@sa/materials'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useAppStore } from '@/store/modules/app'
import { useThemeStore } from '@/store/modules/theme'
import { useRouteStore } from '@/store/modules/route'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { useRouter, useRoute } from 'vue-router'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { getSSEEndpoint } from '~/env.config'
import GlobalHeader from '../modules/global-header/index.vue'
import GlobalSider from '../modules/global-sider/index.vue'
import GlobalTab from '../modules/global-tab/index.vue'
import GlobalContent from '../modules/global-content/index.vue'
import GlobalFooter from '../modules/global-footer/index.vue'
import ThemeDrawer from '../modules/theme-drawer/index.vue'
import { setupMixMenuContext } from '../hooks/use-mix-menu'
import onlineAlert  from '@/assets/audio/online2.wav'
import offLineAlert  from '@/assets/audio/offline.wav'
const logger = createLogger('Layout')

const { routerPushByKey } = useRouterPush()
defineOptions({
  name: 'BaseLayout'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
const routeStore = useRouteStore()
const router = useRouter()
const route = useRoute()

const layoutMode = computed(() => {
  const vertical: LayoutMode = 'vertical'
  const horizontal: LayoutMode = 'horizontal'
  return themeStore.layout.mode.includes(vertical) ? vertical : horizontal
})

const headerPropsConfig: Record<UnionKey.ThemeLayoutMode, App.Global.HeaderProps> = {
  vertical: {
    showLogo: false,
    showMenu: false,
    showMenuToggler: true
  },
  'vertical-mix': {
    showLogo: false,
    showMenu: false,
    showMenuToggler: false
  },
  horizontal: {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  },
  'horizontal-mix': {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  }
}

const headerProps = computed(() => headerPropsConfig[themeStore.layout.mode])

const siderVisible = computed(() => themeStore.layout.mode !== 'horizontal')

const isVerticalMix = computed(() => themeStore.layout.mode === 'vertical-mix')

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix')

const siderWidth = computed(() => getSiderWidth())

const siderCollapsedWidth = computed(() => getSiderCollapsedWidth())

function getSiderWidth() {
  const { width, mixWidth, mixChildMenuWidth } = themeStore.sider
  let w = isVerticalMix.value || isHorizontalMix.value ? mixWidth : width
  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth
  }
  return w
}

function getSiderCollapsedWidth() {
  const { collapsedWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider
  let w = isVerticalMix.value || isHorizontalMix.value ? mixCollapsedWidth : collapsedWidth

  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth
  }
  return w
}

// Mobile dynamic title
const mobileTitle = computed(() => {
  // useVue Routerthe current route of
  if (route.meta?.i18nKey) {
    return $t(route.meta.i18nKey as string)
  }
  if (route.meta?.title) {
    return route.meta.title as string
  }
  return 'ThingsPanel'
})

// Whether to display the return button
const showBackButton = computed(() => {
  // Home page does not display return button
  const noBackRoutes = ['home', 'root', 'login']
  return !noBackRoutes.includes(route.name as string)
})

// return function
function handleBack() {
  router.go(-1)
}

setupMixMenuContext()

/**
 * ===========================================
 * Internet of Things equipment status real-time monitoring system (SSE)
 * ===========================================
 * 
 * Function description：
 * 1. passServer-Sent EventsEstablish a long connection with the backend
 * 2. Real-time receiving equipment goes online/Offline status change notification
 * 3. Display device status change notifications globally
 * 4. Play sound effects to remind users to pay attention to device status changes
 * 
 * Technical implementation：
 * - useEventSourcePolyfillEnsure browser compatibility
 * - Automatic reconnection mechanism handles network interruptions
 * - Complete error handling and logging
 * - Automatically clean up connection resources when components are destroyed
 */

/**
 * ===========================================
 * Global equipment status monitoring system
 * ===========================================
 *
 * Function description：
 * 1. Real-time monitoring of global equipment status，Cover the entire application
 * 2. When the device comes online/When offline，Show notifications and play alerts
 * 3. Provide user-friendly reminders of device status changes
 * 4. Works with page-level monitoring systems，Achieve complete state synchronization
 *
 * Technical features：
 * - Show pop-up notification + Play sound effects（Global reminder）
 * - Intelligent reconnection mechanism，Ensure connection stability
 * - Complete error handling and data validation
 * - Automatically clean up resources when components are uninstalled
 * - Network status detection and graceful degradation
 */

// EventSource Connection instance，For global device status monitoring
let eventSource: EventSourcePolyfill | null = null
// Reconnection attempt counter
let reconnectAttempts = 0
// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5
// Reconnect delay configuration（millisecond）- exponential backoff strategy
const RECONNECT_DELAYS = [2000, 5000, 10000, 20000, 30000]
// connection status identifier
let isConnecting = false
// Reconnect timer
let reconnectTimer: NodeJS.Timeout | null = null
// last error time，Used to avoid frequent error logging
let lastErrorTime = 0
const ERROR_LOG_THROTTLE = 10000 // 10Only log the same error once per second

/**
 * Check network connection status
 */
const checkNetworkStatus = (): boolean => {
  return navigator.onLine !== false
}

/**
 * Throttle error logging
 */
const logErrorThrottled = (message: string, error?: any) => {
  const now = Date.now()
  if (now - lastErrorTime > ERROR_LOG_THROTTLE) {
    logger.error(message, error)
    lastErrorTime = now
  }
}

/**
 * Create global device status monitoringEventSourceconnect
 * Establish a real-time communication connection with the backend，Used to receive device status change events
 */
const createEventSource = () => {
  // Prevent duplicate connections
  if (isConnecting || eventSource?.readyState === EventSource.OPEN) {
    return
  }

  try {
    // Check network status
    if (!checkNetworkStatus()) {
      return
    }

    // Get user authenticationtoken，used forSSEConnection authentication
    const token = localStg.get('token')
    if (!token) {
      logger.warn('User not foundtoken，jump overEventSourceConnection creation')
      return
    }

    isConnecting = true

    // Clean up previous connections，Avoid duplicate connections
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    // Clear previous reconnection timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    /**
     * createEventSourceconnect
     * Automatically select the correct one based on environment configurationSSEendpoint
     */
    eventSource = new EventSourcePolyfill(getSSEEndpoint(import.meta.env), {
      heartbeatTimeout: 3 * 60 * 1000, // Heartbeat timeout：3minute
      headers: {
        'x-token': token // Pass user authenticationtoken
      }
    })
    
    /**
     * Connection success callback
     * Reset reconnection counter，Record connection success status
     */
    eventSource.onopen = () => {
      isConnecting = false
      reconnectAttempts = 0
      logger.info('Equipment status monitoringSSEConnection established successfully')
    }
    
    /**
     * Monitor device online status change events
     * When a device comes online or goes offline，The server will push'device_online'event
     */
    eventSource.addEventListener(
      'device_online',
      event => {
        try {
          // Data security verification：Check if event data exists
          if (!event.data) {
            logger.warn('Empty device status event data received')
            return
          }
          
          // parseJSONformat device status data
          const data = JSON.parse(event.data)
          
          // Required fields to validate device data
          if (!data.device_name || typeof data.device_name !== 'string') {
            logger.warn('Device status event data is invalid，Missing valid device name:', data)
            return
          }
          
          /**
           * Show different types of notifications based on device status
           * is_online: true = Device online，false = Equipment offline
           */
          if (data.is_online) {
            // Device online notification（success type，green）
            window.$notification?.success({
              title: `${data.device_name}${$t('card.deviceConnected')}`,
              duration: 5000, // show5Second
              action: () =>
                h(
                  NButton,
                  {
                    text: true,
                    type: 'default',
                    onClick: () => {
                      // Click the notification to jump to the device details page
                      routerPushByKey('device_details', {
                        query: {
                          d_id: data.device_id
                        }
                      })
                    }
                  },
                  {
                    default: () => $t('card.toDeviceDetailPage')
                  }
                )
            })
          } else {
            // Device offline notification（Information type，blue）
            window.$notification?.info({
              title: `${data.device_name}${$t('card.deviceDisconnected')}`,
              duration: 5000, // show5Second
              action: () =>
                h(
                  NButton,
                  {
                    text: true,
                    type: 'default',
                    onClick: () => {
                      // Click the notification to jump to the device details page
                      routerPushByKey('device_details', {
                        query: {
                          d_id: data.device_id
                        }
                      })
                    }
                  },
                  {
                    default: () => $t('card.toDeviceDetailPage')
                  }
                )
            })
          }
          
          /**
           * Play device status change prompts
           * Use asynchronous play，avoid blockingUIthread
           * Handle browser autoplay policy restrictions
           */
          try {

            // Prompt tone for distinguishing between upper and lower lines
            const audio = new Audio(data.is_online ? onlineAlert : offLineAlert)
            // Set audio properties to comply with browser policy
            audio.volume = 0.5 // Set a moderate volume
            audio.preload = 'auto' // Preload audio
            
            audio.play().catch(audioError => {
              // Silently handle situations where autoplay is blocked，This is normal browser behavior
              if (audioError.name === 'NotAllowedError') {
                return
              }
              // Warnings are logged only for other audio errors
              logger.warn('Failed to play device status change prompt sound:', audioError)
            })
          } catch (audioError) {
            logger.warn('Failed to create audio object:', audioError)
          }
          
        } catch (parseError) {
          logger.error('Failed to parse device status event data:', parseError, 'raw data:', event.data)
        }
      },
      false
    )
    
    /**
     * Error handling and intelligent reconnection mechanism
     */
    eventSource.onerror = (error) => {
      isConnecting = false
      logErrorThrottled('EventSourceConnection error:', error)

      // Immediately clear the current connection
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }

      // Smart reconnection：Use predefined delay time
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts - 1, RECONNECT_DELAYS.length - 1)]
        
        reconnectTimer = setTimeout(() => {
          if (checkNetworkStatus()) {
            createEventSource()
          } else {
            // When the network is unavailable，Extend reconnection interval
            reconnectTimer = setTimeout(() => {
              createEventSource()
            }, 60000) // 1Try again in minutes
          }
        }, delay)
      } else {
        // After reaching the maximum number of reconnections，Every5Try once every minute
        reconnectTimer = setTimeout(() => {
          reconnectAttempts = 0 // reset counter
          createEventSource()
        }, 5 * 60 * 1000)
      }
    }
    
  } catch (error) {
    isConnecting = false
    logger.error('Create device status monitoringEventSourceConnection failed:', error)
  }
}

/**
 * clean upEventSourceconnect
 * Ensure connection resources are released correctly when components are destroyed，Avoid memory leaks
 */
const cleanupEventSource = () => {
  // clean upEventSourceconnect
  if (eventSource) {
    eventSource.close()
    eventSource = null
    logger.info('Equipment status monitoringSSEConnection cleared')
  }
  
  // Clear reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  // reset state
  isConnecting = false
  reconnectAttempts = 0
}

/**
 * Establish a device status monitoring connection when the component is mounted
 * Start monitoring device status changes immediately after the user enters the system
 */
onMounted(() => {
  // createEventSource()
})

/**
 * Clean up connections when components are uninstalled
 * Ensure resources are properly cleaned up when the user leaves or the component is destroyed
 */
onUnmounted(() => {
  // cleanupEventSource()
})
</script>

<template>
  <!-- Mobile layout -->
  <div v-if="appStore.isMobile" class="mobile-layout">
    <!-- iOSstyle header -->
    <header v-if="0" class="ios-header">
      <!-- back button -->
      <div 
        v-if="showBackButton" 
        class="ios-back-btn" 
        @click="handleBack"
      >
        <NIcon size="20">
          <ArrowBack />
        </NIcon>
      </div>
      
      <!-- title -->
      <h1 class="ios-title">{{ mobileTitle }}</h1>
    </header>

    <!-- main content area -->
    <main :id="LAYOUT_SCROLL_EL_ID" class="mobile-main">
      <GlobalContent :show-padding="true" />
    </main>

    <ThemeDrawer />
  </div>

  <!-- Desktop layout -->
  <AdminLayout
    v-else
    v-model:sider-collapse="appStore.siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.height"
    :tab-visible="themeStore.tab.visible"
    :tab-height="themeStore.tab.height"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="siderVisible"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="themeStore.footer.visible"
    :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right"
  >
    <template #header>
      <GlobalHeader v-bind="headerProps" />
    </template>
    <template #tab>
      <GlobalTab />
    </template>
    <template #sider>
      <GlobalSider />
    </template>
    <GlobalContent />
    <ThemeDrawer />
    <template #footer>
      <GlobalFooter />
    </template>
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}

// Mobile layout style
.mobile-layout {
  @apply h-screen flex flex-col bg-layout;
}

// iOSstyle header
.ios-header {
  @apply fixed top-0 left-0 right-0 z-50 relative;
  height: 44px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);

  .ios-back-btn {
    @apply absolute left-0 top-0 h-full flex items-center justify-center;
    width: 44px;
    background: none;
    border: none;
    color: #007AFF;
    cursor: pointer;
    padding: 0;
    z-index: 10;
    pointer-events: auto;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.6;
    }

    &:active {
      opacity: 0.3;
    }

    // Make sure the touch area is large enough
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: transparent;
    }
  }

  .ios-title {
    @apply absolute inset-0 flex items-center justify-center;
    font-size: 17px;
    font-weight: 600;
    color: #000;
    margin: 0;
    // Leave space for the back button
    padding: 0 44px;
  }
}

.mobile-main {
  @apply flex-1 overflow-auto;

  @include scrollbar();
}

// Dark mode support
[data-theme='dark'] {
  .ios-header {
    background: rgba(0, 0, 0, 0.8);
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
    
    .ios-back-btn {
      color: #0A84FF;
    }
    
    .ios-title {
      color: #fff;
    }
  }
}
</style>
