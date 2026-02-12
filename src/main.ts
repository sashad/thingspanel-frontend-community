import { createApp, watch } from 'vue'
import 'gridstack/dist/gridstack.css'
import 'gridstack/dist/gridstack-extra.css'
import './plugins/assets'
import { useSysSettingStore } from '@/store/modules/sys-setting'
import { setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins'
import { setupStore } from './store'
import { router, setupRouter } from './router'
import { i18n, setupI18n } from './locales'
import { initEChartsComponents } from '@/utils/echarts/echarts-manager'
// import Card2.1 Component registration file to start the component registration and property exposure system（Use unified entrance）
import '@/card2.1/index'
// 🔥 critical fix：Make sure the component system is initialized when the app starts（Use unified entrance）
import { initializeCard2System } from '@/card2.1/index'
// 🔥 critical fix：make sure InteractionManager is properly initialized when the application starts
import '@/card2.1/core2/interaction'
// 🧹 importlocalStoragecleaning tool
import { cleanupLocalStorage } from '@/utils/storage-cleaner'
// 🎯 Import renderer registration system
import { registerAllRenderers } from '@/components/visual-editor/renderers/registry'
import App from './App.vue'
// Recently visited routing function
const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'
const MAX_RECENT_ROUTES = 8

// --- Update list of excluded paths，Supports wildcards ---
const excludedPaths = ['/login/*', '/404', '/home', '/visualization/kanban-details']

// Anti-shake function - reduce frequent localStorage operate
function debounce<T extends () => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Memory cache of recently accessed routes，reduce localStorage read
let recentRoutesCache: any[] | null = null

async function setupApp() {
  // 🧹 Clean up unnecessarylocalStorageitem
  cleanupLocalStorage()

  const app = createApp(App)

  // 1. Critical sync initialization - Required for application startup
  setupStore(app)
  setupI18n(app)
  setupNProgress()
  // Show splash loading once during bootstrap (before mount).
  setupLoading()
  // 🔥 critical fix：initialization Card2.1 component system
  initializeCard2System()
    .then(() => {
      // Component system initialization completed，Notify all listeners
      window.dispatchEvent(new CustomEvent('card2-system-ready'))
    })
    .catch(error => {
      console.error('❌ Card2.1 Component system initialization failed:', error)
    })

  // 🎯 Initialize the renderer registration system
  try {
    registerAllRenderers()
  } catch (error) {
    console.error('❌ Renderer registration system initialization failed:', error)
  }

  // 2. System settings lazy loading - Avoid blocking application startup
  const sysSettingStore = useSysSettingStore()

  // use Promise but don't wait，Let system settings load in parallel
  sysSettingStore.initSysSetting().then(() => {
    // monitor system_name changes，And dynamically update international news according to changes
    watch(
      () => sysSettingStore.system_name,
      newSystemName => {
        const locales = i18n.global.availableLocales

        locales.forEach(locale => {
          i18n.global.mergeLocaleMessage(locale, {
            system: {
              title: newSystemName
            }
          })
        })
      },
      { immediate: true }
    )
  })

  // 3. non-critical initialization - use requestIdleCallback Delayed execution
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      () => {
        setupIconifyOffline()
        setupDayjs()
        // ECharts Lazy initialization，Reduce startup memory usage
        initEChartsComponents()
      },
      { timeout: 2000 }
    )
  } else {
    // Compatibility rollback
    setTimeout(() => {
      setupIconifyOffline()
      setupDayjs()
      initEChartsComponents()
    }, 100)
  }

  // 4. Route initialization - Required for application startup
  await setupRouter(app)

  // Route recording function
  const debouncedSaveRoutes = debounce((routes: any[]) => {
    try {
      localStorage.setItem(RECENTLY_VISITED_ROUTES_KEY, JSON.stringify(routes))
      recentRoutesCache = routes
    } catch (error) {}
  }, 1000)

  // Initialize cache
  try {
    const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY)
    recentRoutesCache = routesRaw ? JSON.parse(routesRaw) : []
  } catch (error) {
    recentRoutesCache = []
  }

  // Post guard for routing record function
  router.afterEach(to => {
    // --- Update exclusion logic to support wildcards ---
    const isExcluded = excludedPaths.some(pattern => {
      if (pattern.endsWith('/*')) {
        // Handling wildcard patterns，ensure match /login/ instead of /login-other
        const prefix = pattern.slice(0, -1) // /login/
        return to.path.startsWith(prefix)
      } else {
        // Handling exact match patterns
        return to.path === pattern
      }
    })

    if (isExcluded) {
      return
    }
    // --- end of exclusion logic ---

    // Simply filter out no names or title routing，以及重定向routing
    if (!to.name || !to.meta?.title || to.redirectedFrom) {
      return
    }

    // Use memory cache to avoid frequent reads localStorage
    if (!recentRoutesCache) {
      return
    }

    try {
      // Get data from memory cache，avoid JSON.parse
      let recentRoutes = [...recentRoutesCache]

      // Check if the same route already exists，Avoid duplicate additions
      const existingIndex = recentRoutes.findIndex(route => route.path === to.path)
      if (existingIndex === 0) {
        // If it is already the first，Return directly
        return
      }

      // Remove the same route that already exists
      if (existingIndex > 0) {
        recentRoutes.splice(existingIndex, 1)
      }

      // Add a new route to the beginning of the list
      const newRoute = {
        path: to.path,
        name: to.name,
        title: to.meta.title,
        i18nKey: to.meta.i18nKey,
        icon: to.meta.icon,
        query: to.query // save query parameter
      }

      recentRoutes.unshift(newRoute)

      // Limit list length
      if (recentRoutes.length > MAX_RECENT_ROUTES) {
        recentRoutes = recentRoutes.slice(0, MAX_RECENT_ROUTES)
      }

      // Save with image stabilization，reduce localStorage write frequency
      debouncedSaveRoutes(recentRoutes)
    } catch (error) {}
  })

  app.config.globalProperties.getPlatform = () => {
    const { appVersion }: any = window.navigator
    if (['iPhone', 'Android', 'iPad'].includes(appVersion) || window.innerWidth < 680) {
      return true
    }
    return false
  }

  app.mount('#app')
}

setupApp()
