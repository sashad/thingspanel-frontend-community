<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useScriptTag } from '@vueuse/core'
import { TENCENT_MAP_SDK_URL } from '@/constants/map-sdk'
import { isValidCoordinate, getCoordinateValidationError } from '@/utils/common/map-validator'

const { load } = useScriptTag(TENCENT_MAP_SDK_URL)
const emit = defineEmits(['position-selected'])

// Add component name
defineOptions({ name: 'TencentMap' })

// definitionpropstype
interface Props {
  longitude?: string | number
  latitude?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  longitude: '',
  latitude: ''
})
const domRef = ref<HTMLDivElement | null>(null)
let map
let currentMarker // Current location marker

async function renderMap() {
  await load(true)
  if (!domRef.value) return

  // Use the passed latitude and longitude or default coordinates as the map center point
  const lat = Number(props.latitude) || 39.98412
  const lng = Number(props.longitude) || 116.307484
  const hasValidCoords = props.latitude && props.longitude && props.latitude !== '' && props.longitude !== '' && isValidCoordinate(lat, lng)

  const center = new TMap.LatLng(lat, lng)

  map = new TMap.Map(domRef.value, {
    center,
    zoom: hasValidCoords ? 15 : 9, // If there are coordinates, enlarge the display，Otherwise use default scaling
    maxZoom: 18,
    minZoom: 6
  })

  // If there are valid latitude and longitude parameters，Show current location marker on map
  if (hasValidCoords) {
    addCurrentLocationMarker(lat, lng)
  }

  map.on('click', event => {
    const lat = event.latLng.getLat()
    const lng = event.latLng.getLng()

    // Verify whether the latitude and longitude is within the valid range
    if (!isValidCoordinate(lat, lng)) {
      const error = getCoordinateValidationError(lat, lng)
      console.error('Map click event obtained invalid latitude and longitude:', { lat, lng, error })
      return
    }

    // Remove previous markup
    if (currentMarker) {
      currentMarker.setMap(null)
    }

    // Add new tag
    addCurrentLocationMarker(lat, lng)

    emit('position-selected', { lat, lng })
  })
}

// Add current location marker
function addCurrentLocationMarker(lat: number, lng: number) {
  // Verify whether the latitude and longitude parameters are within the valid range
  if (!isValidCoordinate(lat, lng)) {
    const error = getCoordinateValidationError(lat, lng)
    console.error('addCurrentLocationMarkerInvalid latitude and longitude parameters received:', { lat, lng, error })
    return
  }

  // if tag already exists，Remove first
  if (currentMarker) {
    currentMarker.setMap(null)
  }

  const position = new TMap.LatLng(lat, lng)

  // Create markup styles
  const markerStyle = new TMap.MarkerStyle({
    width: 30,
    height: 40,
    anchor: { x: 15, y: 40 },
    // Use red marker icon
    src: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="#ff4444"/>
        <circle cx="15" cy="15" r="8" fill="white"/>
        <circle cx="15" cy="15" r="5" fill="#ff4444"/>
      </svg>
    `)
  })

  // Create a multi-marker instance
  currentMarker = new TMap.MultiMarker({
    map,
    styles: {
      'current-location': markerStyle
    },
    geometries: [{
      id: 'current-position',
      styleId: 'current-location',
      position
    }]
  })
}

onMounted(() => {
  renderMap()
})

// monitorpropschange，Re-add markers when latitude and longitude are updated
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map && newLat && newLng && newLat !== '' && newLng !== '') {
      const lat = Number(newLat)
      const lng = Number(newLng)
      if (isValidCoordinate(lat, lng)) {
        // Update map center point
        const center = new TMap.LatLng(lat, lng)
        map.setCenter(center)
        // Add or update tags
        addCurrentLocationMarker(lat, lng)
      } else {
        const error = getCoordinateValidationError(lat, lng)
        console.warn('Invalid latitude and longitude update detected:', { lat, lng, error })
      }
    }
  },
  { immediate: false }
)
</script>

<template>
  <div ref="domRef" class="w-full h-full"></div>
</template>

<style scoped></style>
