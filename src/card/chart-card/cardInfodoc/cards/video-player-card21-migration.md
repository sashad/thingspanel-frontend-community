# Video Player components Card 2.1 Migrate configuration documents

## Component overview

**componentsID**: `chart-videoplayer`  
**Component type**: `chart`  
**Component name**: video player  
**Function description**: Video player component that supports multiple video formats，Especially for M3U8 Optimized for streaming and regular video files

## Current implementation analysis

### 1. Component structure
```
video-player/
├── index.ts              # Component definition configuration
├── component.vue         # Main component implementation
└── poster.png           # Component preview
```

### 2. Core features
- **Multiple format support**: support M3U8 Streaming and regular video formats
- **single data source**: support 1 device data sources，Get video from deviceURL
- **Autoplay**: Support automatic play and silent play
- **Video.js integrated**: use Video.js As the core of the player
- **Responsive layout**: Adaptive container size
- **Data type support**: Supports telemetry data and attribute data as video sources

### 3. Technical implementation
- **player**: Video.js player库
- **streaming media**: support HLS (M3U8) protocol
- **data acquisition**: Supports two data types: telemetry and attributes
- **Error handling**: 集成播放器Error handling机制

## Card 2.1 Migrate configuration

### 1. Component definition (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const videoPlayerDefinition: ComponentDefinition = {
  // Basic information
  id: 'chart-videoplayer',
  name: 'dashboard_panel.cardName.videoPlayer',
  type: 'chart',
  category: 'media',
  
  // Component configuration
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // layout configuration
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 12, height: 8 },
    resizable: true
  },
  
  // Data source configuration
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: true
    }
  },
  
  // configuration mode
  configSchema: {
    type: 'object',
    properties: {
      // Player configuration
      player: {
        type: 'object',
        properties: {
          autoplay: {
            type: 'boolean',
            default: true,
            title: 'Autoplay'
          },
          muted: {
            type: 'boolean',
            default: true,
            title: 'Play silently',
            description: 'Enable mute to support autoplay'
          },
          controls: {
            type: 'boolean',
            default: true,
            title: 'Show control bar'
          },
          preload: {
            type: 'string',
            enum: ['auto', 'metadata', 'none'],
            default: 'auto',
            title: 'Preloading strategy'
          },
          loop: {
            type: 'boolean',
            default: false,
            title: 'Loop play'
          },
          playbackRates: {
            type: 'array',
            items: { type: 'number' },
            default: [0.5, 1, 1.25, 1.5, 2],
            title: 'Play speed options'
          }
        }
      },
      
      // Video source configuration
      source: {
        type: 'object',
        properties: {
          fallbackUrl: {
            type: 'string',
            format: 'uri',
            title: 'Backup videoURL',
            description: 'Backup video address used when device data source is invalid'
          },
          poster: {
            type: 'string',
            format: 'uri',
            title: 'Video cover image',
            description: 'Cover image displayed before the video loads'
          },
          crossOrigin: {
            type: 'string',
            enum: ['anonymous', 'use-credentials', ''],
            default: '',
            title: 'Cross-domain settings'
          }
        }
      },
      
      // Streaming media configuration
      streaming: {
        type: 'object',
        properties: {
          hlsConfig: {
            type: 'object',
            properties: {
              enableWorker: {
                type: 'boolean',
                default: true,
                title: 'enable Web Worker'
              },
              lowLatencyMode: {
                type: 'boolean',
                default: false,
                title: 'low latency mode'
              },
              maxBufferLength: {
                type: 'number',
                minimum: 10,
                maximum: 300,
                default: 30,
                title: 'Maximum buffer length(Second)'
              },
              maxMaxBufferLength: {
                type: 'number',
                minimum: 30,
                maximum: 600,
                default: 600,
                title: 'Maximum buffer limit(Second)'
              }
            }
          },
          retryConfig: {
            type: 'object',
            properties: {
              maxRetries: {
                type: 'number',
                minimum: 0,
                maximum: 10,
                default: 3,
                title: 'Maximum number of retries'
              },
              retryDelay: {
                type: 'number',
                minimum: 1000,
                maximum: 10000,
                default: 3000,
                title: 'Retry delay(millisecond)'
              }
            }
          }
        }
      },
      
      // show configuration
      display: {
        type: 'object',
        properties: {
          showTitle: {
            type: 'boolean',
            default: false,
            title: 'show title'
          },
          title: {
            type: 'string',
            title: 'video title'
          },
          showLoadingIndicator: {
            type: 'boolean',
            default: true,
            title: 'Show loading indicator'
          },
          showErrorMessage: {
            type: 'boolean',
            default: true,
            title: 'Show error message'
          },
          aspectRatio: {
            type: 'string',
            enum: ['16:9', '4:3', '1:1', 'auto'],
            default: 'auto',
            title: 'aspect ratio'
          }
        }
      },
      
      // Interactive configuration
      interaction: {
        type: 'object',
        properties: {
          allowFullscreen: {
            type: 'boolean',
            default: true,
            title: 'Allow full screen'
          },
          allowPictureInPicture: {
            type: 'boolean',
            default: true,
            title: 'Allow picture-in-picture'
          },
          enableKeyboardShortcuts: {
            type: 'boolean',
            default: true,
            title: 'Enable keyboard shortcuts'
          },
          enableDoubleClickFullscreen: {
            type: 'boolean',
            default: true,
            title: 'Double click to full screen'
          }
        }
      }
    }
  }
}
```

### 2. Data source mapping

```typescript
// Original data source structure -> Card 2.1 Data source structure
const dataSourceMapping = {
  // Device data source
  deviceSource: {
    type: 'device',
    config: {
      deviceId: 'string',      // equipmentID
      metricsId: 'string',     // indexID（videoURLField）
      metricsType: 'string',   // Indicator type: 'telemetry' | 'attribute'
      deviceName: 'string'     // Device name
    }
  }
}
```

### 3. Implementation points

#### Video player initialization
```typescript
// Video.js Player configuration
const createPlayer = (element: HTMLVideoElement, config: PlayerConfig) => {
  const options = {
    autoplay: config.autoplay,
    muted: config.muted,
    controls: config.controls,
    preload: config.preload,
    loop: config.loop,
    playbackRates: config.playbackRates,
    poster: config.source.poster,
    crossOrigin: config.source.crossOrigin,
    
    // HLS Configuration
    html5: {
      hls: {
        enableWorker: config.streaming.hlsConfig.enableWorker,
        lowLatencyMode: config.streaming.hlsConfig.lowLatencyMode,
        maxBufferLength: config.streaming.hlsConfig.maxBufferLength,
        maxMaxBufferLength: config.streaming.hlsConfig.maxMaxBufferLength
      }
    },
    
    // Error handling
    errorDisplay: config.display.showErrorMessage
  }
  
  const player = videojs(element, options, () => {
    console.log('Video player is ready')
    
    // Bind event listener
    setupPlayerEvents(player, config)
  })
  
  return player
}

// Player event handling
const setupPlayerEvents = (player: VideoJsPlayer, config: PlayerConfig) => {
  // Error handling
  player.on('error', () => {
    const error = player.error()
    console.error('Video player error:', error)
    
    if (config.display.showErrorMessage) {
      showErrorMessage(`Video playback error: ${error?.message || 'unknown error'}`)
    }
    
    // Try using fallbackURL
    if (config.source.fallbackUrl) {
      retryWithFallback(player, config.source.fallbackUrl)
    }
  })
  
  // Loading starts
  player.on('loadstart', () => {
    if (config.display.showLoadingIndicator) {
      showLoadingIndicator()
    }
  })
  
  // Can play
  player.on('canplay', () => {
    hideLoadingIndicator()
  })
  
  // End of play
  player.on('ended', () => {
    emit('videoEnded')
  })
}
```

#### Data source processing
```typescript
// Get videoURL
const fetchVideoUrl = async (dataSource: DataSourceConfig) => {
  const { deviceId, metricsId, metricsType } = dataSource
  
  if (!deviceId || !metricsId) {
    throw new Error('equipmentIDand indicatorsIDcannot be empty')
  }
  
  try {
    let response
    
    if (metricsType === 'telemetry') {
      // Get telemetry data
      response = await telemetryDataCurrentKeys({
        device_id: deviceId,
        keys: metricsId
      })
      
      if (response?.data?.[0]?.value) {
        return response.data[0].value
      }
    } else if (metricsType === 'attribute') {
      // Get attribute data
      response = await getAttributeDatasKey({
        device_id: deviceId,
        key: metricsId
      })
      
      if (response?.data?.value) {
        return response.data.value
      }
    }
    
    throw new Error('No valid video foundURL')
  } catch (error) {
    console.error('Failed to fetch video URL:', error)
    throw error
  }
}

// videoURLChange handling
const handleVideoUrlChange = async (newUrl: string, oldUrl: string) => {
  if (!newUrl || newUrl === oldUrl) return
  
  try {
    // verifyURLFormat
    const url = new URL(newUrl)
    
    // Detect video type
    const isHLS = newUrl.includes('.m3u8')
    const videoType = isHLS ? 'application/x-mpegURL' : 'video/mp4'
    
    // Update player source
    if (player.value) {
      player.value.src({
        src: newUrl,
        type: videoType
      })
      
      // HLS Streams require special handling
      if (isHLS) {
        setupHLSPlayer(player.value, newUrl)
      }
    } else {
      // Create new player
      await createPlayer()
    }
  } catch (error) {
    console.error('Invalid video URL:', error)
    
    // Use backupURL
    if (props.card.config.source.fallbackUrl) {
      handleVideoUrlChange(props.card.config.source.fallbackUrl, '')
    }
  }
}
```

#### HLS Streaming media processing
```typescript
// HLS Player settings
const setupHLSPlayer = (player: VideoJsPlayer, hlsUrl: string) => {
  // Check if it is supported HLS
  if (player.tech().hls) {
    const hls = player.tech().hls
    
    // Configuration HLS Options
    hls.xhr.beforeRequest = (options) => {
      // Add custom request headers
      if (props.card.config.streaming.customHeaders) {
        Object.assign(options.headers, props.card.config.streaming.customHeaders)
      }
      return options
    }
    
    // Error retry mechanism
    hls.on('hlsError', (event, data) => {
      console.error('HLS Error:', data)
      
      if (data.fatal) {
        switch (data.type) {
          case 'networkError':
            // Network error retry
            retryHLSConnection(player, hlsUrl)
            break
          case 'mediaError':
            // Media error recovery
            hls.recoverMediaError()
            break
          default:
            // Other fatal errors
            showErrorMessage('HLS The player encountered a fatal error')
            break
        }
      }
    })
  }
}

// HLS Connection retry
const retryHLSConnection = async (player: VideoJsPlayer, url: string) => {
  const { maxRetries, retryDelay } = props.card.config.streaming.retryConfig
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      player.src({
        src: url,
        type: 'application/x-mpegURL'
      })
      
      // waiting to load
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          player.off('canplay', onCanPlay)
          player.off('error', onError)
          resolve(true)
        }
        
        const onError = () => {
          player.off('canplay', onCanPlay)
          player.off('error', onError)
          reject(new Error('Retry failed'))
        }
        
        player.on('canplay', onCanPlay)
        player.on('error', onError)
      })
      
      console.log(`HLS connection retry ${i + 1} succeeded`)
      return
    } catch (error) {
      console.error(`HLS connection retry ${i + 1} failed:`, error)
    }
  }
  
  showErrorMessage('HLS Connection retry failed，Please check the network or video source')
}
```

#### Responsive layout
```typescript
// Aspect ratio calculation
const calculateAspectRatio = (aspectRatio: string, containerWidth: number, containerHeight: number) => {
  if (aspectRatio === 'auto') {
    return { width: '100%', height: '100%' }
  }
  
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
  const targetRatio = widthRatio / heightRatio
  const containerRatio = containerWidth / containerHeight
  
  if (containerRatio > targetRatio) {
    // Containers are wider，Based on height
    const width = containerHeight * targetRatio
    return {
      width: `${width}px`,
      height: `${containerHeight}px`
    }
  } else {
    // container taller，Based on width
    const height = containerWidth / targetRatio
    return {
      width: `${containerWidth}px`,
      height: `${height}px`
    }
  }
}

// Container size monitoring
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const aspectRatio = props.card.config.display.aspectRatio
      
      const dimensions = calculateAspectRatio(aspectRatio, width, height)
      
      // Update player size
      if (player.value) {
        player.value.dimensions(dimensions.width, dimensions.height)
      }
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

## Migration checklist

### Function migration
- [ ] Video.js Player integration
- [ ] HLS Streaming support
- [ ] General video format support
- [ ] Autoplay function
- [ ] Playback control function
- [ ] Error handling mechanism

### Configuration migration
- [ ] Player basic configuration
- [ ] Streaming media configuration
- [ ] Show option configuration
- [ ] Interactive function configuration
- [ ] Data source configuration

### Performance optimization
- [ ] Player resource management
- [ ] Memory leak prevention
- [ ] Network retry mechanism
- [ ] Buffer optimization

## Migration steps

### 1. Create component definition
```bash
# Create component directory
mkdir -p src/card2.1/components/media/video-player

# Create necessary files
touch src/card2.1/components/media/video-player/definition.ts
touch src/card2.1/components/media/video-player/component.vue
touch src/card2.1/components/media/video-player/config.vue
```

### 2. Implement core components
- migrate Video.js player logic
- adaptation Card 2.1 Data source interface
- accomplish HLS Streaming support
- Implement configuration form components

### 3. Configuration verification
- Test playback of various video formats
- verify HLS Streaming capabilities
- Test responsive layout
- Check error handling mechanism

### 4. Performance testing
- Player performance test
- Memory usage monitoring
- Network connection stability test

## Configuration example

### Basic configuration
```json
{
  "player": {
    "autoplay": true,
    "muted": true,
    "controls": true,
    "preload": "auto",
    "loop": false
  },
  "source": {
    "fallbackUrl": "https://example.com/fallback.mp4",
    "poster": "https://example.com/poster.jpg"
  },
  "display": {
    "showTitle": false,
    "showLoadingIndicator": true,
    "showErrorMessage": true,
    "aspectRatio": "16:9"
  },
  "interaction": {
    "allowFullscreen": true,
    "allowPictureInPicture": true,
    "enableKeyboardShortcuts": true
  }
}
```

### Streaming media configuration
```json
{
  "player": {
    "autoplay": true,
    "muted": true,
    "controls": true
  },
  "streaming": {
    "hlsConfig": {
      "enableWorker": true,
      "lowLatencyMode": true,
      "maxBufferLength": 10,
      "maxMaxBufferLength": 60
    },
    "retryConfig": {
      "maxRetries": 5,
      "retryDelay": 2000
    }
  },
  "display": {
    "aspectRatio": "auto",
    "showLoadingIndicator": true
  }
}
```

## Usage scenarios

### 1. Surveillance video
- Real-time monitoring screen
- Video playback
- Multiple video switching

### 2. Device status video
- Equipment operating status video
- Operation instruction video
- Troubleshooting video

### 3. Live streaming
- Live streaming
- Conference video
- Instructional video

## Related documents

- [Card 2.1 Architecture documentation](../architecture.md)
- [Data source configuration guide](../data-source-guide.md)
- [Component Development Specifications](../component-development.md)
- [Video.js Official documentation](https://videojs.com/)
- [HLS Agreement document](../hls-protocol.md)