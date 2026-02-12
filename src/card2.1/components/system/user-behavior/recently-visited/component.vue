<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- card title bar -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Icon icon="mdi:history" class="text-lg text-purple-600 dark:text-purple-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.recentlyVisited.title') }}
        </h3>
      </div>
    </div>

    <!-- Access record list -->
    <div class="flex-1 p-4 overflow-hidden">
      <div v-if="visitedRoutes.length > 0" class="h-full overflow-y-auto scrollbar-thin">
        <div class="space-y-2">
          <div
            v-for="route in visitedRoutes"
            :key="route.path + JSON.stringify(route.query)"
            class="group flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all duration-200 hover:shadow-sm"
            @click="navigateTo(route.path, route.query)"
          >
            <!-- icon -->
            <div class="flex-shrink-0 mr-3">
              <div v-if="route.icon" class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <SvgIcon :icon="route.icon" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div v-else class="p-1.5 bg-gray-100 dark:bg-gray-600 rounded-md">
                <Icon icon="mdi:web" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            <!-- title and path -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {{ getRouteDisplayTitle(route) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {{ route.path }}{{ route.query && Object.keys(route.query).length ? '?' + new URLSearchParams(route.query as any).toString() : '' }}
              </div>
            </div>

            <!-- arrow icon -->
            <div class="flex-shrink-0 ml-2">
              <Icon
                icon="mdi:chevron-right"
                class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- No data status -->
      <div v-else class="h-full flex flex-col items-center justify-center text-center">
        <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
          <Icon icon="mdi:clock-outline" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('card.recentlyVisited.noRecords') }}
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500">
          Start browsing the page to view access history
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Recently visited components
 * Display a list of recently visited pages by the user，Support quick navigation
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, type LocationQuery } from 'vue-router'
import { Icon } from '@iconify/vue'
import { $t } from '@/locales'

interface VisitedRoute {
  path: string
  name: string | symbol | undefined
  title: string
  icon?: string
  i18nKey?: string
  query?: LocationQuery
}

const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'
const visitedRoutes = ref<VisitedRoute[]>([])
const router = useRouter()

/**
 * Load access records
 */
const loadVisitedRoutes = () => {
  try {
    const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
    if (routesRaw) {
      visitedRoutes.value = JSON.parse(routesRaw)
    } else {
      visitedRoutes.value = []
    }
  } catch (error) {
    console.error('Failed to load access records:', error)
    visitedRoutes.value = []
  }
}

/**
 * Navigate to the specified route
 */
const navigateTo = (path: string, query?: LocationQuery) => {
  router.push({ path, query })
}

/**
 * Get route display title，Prioritize the use of international translations
 */
const getRouteDisplayTitle = (route: VisitedRoute): string => {
  // if there isi18nKey，then use internationalized translation
  if (route.i18nKey) {
    try {
      return $t(route.i18nKey as App.I18n.I18nKey)
    } catch {
      // If translation fails，fallbackto originaltitle
      return route.title
    }
  }
  // Otherwise use the originaltitleasfallback
  return route.title
}

/**
 * Monitor storage changes
 */
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === RECENTLY_VISITED_ROUTES_KEY) {
    loadVisitedRoutes()
  }
}

// Load data now
loadVisitedRoutes()

onMounted(() => {
  // monitor storage event，to refresh the list when other tabs update
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})

defineOptions({
  name: 'RecentlyVisitedCard21'
})
</script>

<style scoped>
/* Custom scroll bar style */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: transparent;
}

/* Scroll bar style in Firefox browser */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') transparent;
}

.dark .scrollbar-thin {
  scrollbar-color: theme('colors.gray.600') transparent;
}
</style>