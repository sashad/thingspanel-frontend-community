import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card' // Import the correct type
import { $t } from '@/locales' // import $t
import poster from './image.png' // hypothesis poster Image exists or will be added later

export default {
  id: 'recently-visited', // Use lowercase hyphens ID
  type: 'builtin', // Add to type
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.recentlyVisited.title'), // use $t
  description: $t('card.recentlyVisited.description'), // use $t
  preset: {
    iCardViewDefault: {
      w: 3,
      h: 2,
      minH: 2,
      minW: 2
    }
  }
} as ICardDefine
