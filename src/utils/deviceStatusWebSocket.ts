import { ref, type Ref } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl } from '@/utils/common/tool'

interface DeviceStatusMessage {
  device_id: string
  is_online: number // 1: online, 0: Offline
}

interface SubscriptionParams {
  device_ids: string[]
  token: string
}

/**
 * Device status WebSocket Manager
 * Devices for subscribing and receiving online/Offline status notification
 */
export class DeviceStatusWebSocket {
  private ws: any = null
  private wsStatus = ref<string>('CLOSED')
  private currentDeviceIds: string[] = []
  private reconnectAttempts = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private wsUrl: string
  private onStatusChangeCallback?: (deviceId: string, isOnline: boolean) => void
  private isConnecting = false // New：Tag is connecting
  
  constructor() {
    // Dynamic acquisition WebSocket Server address
    this.wsUrl = `${getWebsocketServerUrl()}/device/online/status/ws/batch`
  }
  
  /**
   * connect WebSocket and subscribe to device status
   * @param deviceIds equipmentIDlist
   * @param onStatusChange State change callback function
   */
  connect(deviceIds: string[], onStatusChange?: (deviceId: string, isOnline: boolean) => void) {
    // Save callback function
    if (onStatusChange) {
      this.onStatusChangeCallback = onStatusChange
    }

    // If the device list is empty，No connection established
    if (!deviceIds || deviceIds.length === 0) {
      this.disconnect()
      return
    }

    // Get token
    const token = localStg.get('token')
    if (!token) {
      return
    }

    // If connecting，No duplicate connections
    if (this.isConnecting) {
      return
    }

    // If connected and the device list has not changed，No need to reconnect
    if (this.ws && this.wsStatus.value === 'OPEN' && 
        this.arraysEqual(this.currentDeviceIds, deviceIds)) {
      return
    }

    // If you are connected but the device list has changed（Paging switch），Close the old connection and re-establish it
    if (this.ws && this.wsStatus.value === 'OPEN' && 
        !this.arraysEqual(this.currentDeviceIds, deviceIds)) {
      this.disconnect()
    }

    // Mark as connecting
    this.isConnecting = true

    // If there are still old connections，Disconnect first
    if (this.ws) {
      this.disconnect()
    }

    // Save current device list
    this.currentDeviceIds = [...deviceIds]

    // Establish new connection
    const { status, data, send, close } = useWebSocket(this.wsUrl, {
      immediate: true,
      autoReconnect: {
        retries: this.MAX_RECONNECT_ATTEMPTS,
        delay: 3000
      },
      heartbeat: {
        message: 'ping',
        interval: 30000,
        pongTimeout: 10000
      },
      onConnected: (ws: WebSocket) => {
        this.reconnectAttempts = 0
        this.isConnecting = false // Connection successful，Clear connection flag
        
        // Send subscription message
        const subscriptionMessage: SubscriptionParams = {
          device_ids: deviceIds,
          token
        }
        send(JSON.stringify(subscriptionMessage))
      },
      onMessage: (ws: WebSocket, event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          
          // Support batch message format（array）
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.device_id && typeof item.is_online === 'number') {
                if (this.onStatusChangeCallback) {
                  this.onStatusChangeCallback(item.device_id, item.is_online === 1)
                }
              }
            })
          } 
          // Support single message format（object）
          else if (data.device_id && typeof data.is_online === 'number') {
            if (this.onStatusChangeCallback) {
              this.onStatusChangeCallback(data.device_id, data.is_online === 1)
            }
          }
          // Other formats are silently ignored，No error reported
        } catch (error) {
          // Parse failures are silently ignored.
        }
      },
      onError: (ws: WebSocket, event: Event) => {
        this.reconnectAttempts++
        this.isConnecting = false // Connection error，Clear connection flag
      },
      onDisconnected: (ws: WebSocket, event: CloseEvent) => {
        this.isConnecting = false // Disconnect，Clear connection flag
      }
    })

    this.ws = { status, data, send, close }
    this.wsStatus = status
  }

  /**
   * Update subscribed device list
   * @param deviceIds new equipmentIDlist
   */
  updateSubscription(deviceIds: string[]) {
    if (!deviceIds || deviceIds.length === 0) {
      this.disconnect()
      return
    }

    const token = localStg.get('token')
    if (!token) {
      return
    }

    // if WebSocket Connected，Send new subscription messages directly
    if (this.ws && this.wsStatus.value === 'OPEN') {
      this.currentDeviceIds = [...deviceIds]
      const subscriptionMessage: SubscriptionParams = {
        device_ids: deviceIds,
        token
      }
      this.ws.send(JSON.stringify(subscriptionMessage))
    } else {
      // Otherwise reconnect
      this.connect(deviceIds, this.onStatusChangeCallback)
    }
  }

  /**
   * disconnect WebSocket connect
   */
  disconnect() {
    this.isConnecting = false // Clear connection flag
    if (this.ws && this.ws.close) {
      this.ws.close()
      this.ws = null
    }
    this.currentDeviceIds = []
    this.reconnectAttempts = 0
  }

  /**
   * Get current connection status
   */
  getStatus(): string {
    return this.wsStatus.value
  }

  /**
   * Compare two arrays for equality
   */
  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false
    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    return sorted1.every((val, index) => val === sorted2[index])
  }
}

/**
 * Create device status WebSocket Instance composed functions
 * @returns WebSocket Manager instance
 */
export function useDeviceStatusWebSocket() {
  const wsManager = new DeviceStatusWebSocket()
  
  return {
    connect: wsManager.connect.bind(wsManager),
    updateSubscription: wsManager.updateSubscription.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager),
    getStatus: wsManager.getStatus.bind(wsManager)
  }
}
