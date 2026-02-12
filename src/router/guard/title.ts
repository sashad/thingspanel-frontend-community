import type { Router } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { $t } from '@/locales'
import { useSysSettingStore } from '@/store/modules/sys-setting'

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    const sysSettingStore = useSysSettingStore()
    const { i18nKey, title } = to.meta
    const appTitle = sysSettingStore.system_name === '' ? $t('title') : sysSettingStore.system_name
    let routeTitle = ''

    // Handle sub-routes for login page
    if (to.path?.startsWith('/login/')) {
      const path = to.path.split('/').pop()?.toLowerCase()
      switch (path) {
        case 'register-email':
          routeTitle = $t('page.login.register.title')
          break
        case 'reset-pwd':
          routeTitle = $t('page.login.resetPwd.title')
          break
        case 'code-login':
          routeTitle = $t('page.login.codeLogin.title')
          break
        default:
          routeTitle = $t('page.login.pwdLogin.title')
      }
    } else {
      // Processing of other routes
      routeTitle = i18nKey ? $t(i18nKey) : title
    }

    // Combine full title：Application title - Route header
    const documentTitle = routeTitle ? `${routeTitle}-${appTitle}` : appTitle

    useTitle(documentTitle)
  })
}
