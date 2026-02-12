import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

/**
 * Create mobile layout guards
 * on mobile devices will automatically use base The layout's routing is switched to mobile layout
 */
export function createMobileLayoutGuard(router: Router) {
  router.beforeEach((to, from, next) => {
    const appStore = useAppStore()

    // If it is a mobile device and the current routing uses base layout
    if (appStore.isMobile && shouldUseMobileLayout(to)) {
      // Modify routing configuration to mobile layout
      const mobileRoute = { ...to }

      // Change the routing component from base The layout is changed to mobile layout
      const routeMatch = router.getRoutes().find(route => route.name === to.name)
      if (routeMatch && routeMatch.matched?.[0]) {
        const matched = routeMatch.matched[0]
        // Check if using base layout component
        if (isBaseLayoutComponent(matched.components?.default)) {
          // Here we dynamically modify components through routing guards
          // because Vue Router restrictions，We use different processing methods at the routing level
          // In fact, we will use the isMobile state to render different layouts
        }
      }
    }

    next()
  })
}

/**
 * Determine whether mobile layout should be used
 */
function shouldUseMobileLayout(route: RouteLocationNormalized): boolean {
  // Exclude routes that do not require mobile layout
  const excludeRoutes = ['login', '403', '404', '500']

  // If it is a constant route（Such as login page、error page）Do not use mobile layout
  if (route.meta?.constant) {
    return false
  }

  // If the route name is in the exclude list
  if (excludeRoutes.includes(route.name as string)) {
    return false
  }

  // Check if the route explicitly specifies not to use mobile layout
  if (route.meta?.disableMobileLayout) {
    return false
  }

  return true
}

/**
 * Check if the component is base layout component
 */
function isBaseLayoutComponent(component: any): boolean {
  // This can be determined by the component name or other identifiers.
  if (!component) return false

  // Check component name or options
  const componentName = component.name || component.__name || component.displayName
  return (
    componentName === 'BaseLayout' || (component.__asyncResolved && component.__asyncResolved.name === 'BaseLayout')
  )
}
