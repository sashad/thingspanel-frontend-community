import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'

export default {
  id: 'operation-guide',
  type: 'builtin', // Modify to a valid type 'builtin'
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.operationGuide'), // Need to be added to the language file 'card.operationGuide'
  preset: {
    dataSource: {
      // Action wizards typically do not require external data sources，But the complete structure needs to be provided to avoid type errors
      origin: 'system',
      isSupportTimeRange: false,
      dataTimeRange: '', // Add to dataTimeRange
      isSupportAggregate: false,
      dataAggregateRange: '', // Add to dataAggregateRange
      systemSource: [],
      deviceSource: []
    },
    config: {
      guideList: [
        // use key Replace hardcoded text
        {
          titleKey: 'card.operationGuideCard.guideItems.addDevice.title',
          descriptionKey: 'card.operationGuideCard.guideItems.addDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuideCard.guideItems.configureDevice.title',
          descriptionKey: 'card.operationGuideCard.guideItems.configureDevice.description',
          link: '/device/manage'
        },
        {
          titleKey: 'card.operationGuideCard.guideItems.createDashboard.title',
          descriptionKey: 'card.operationGuideCard.guideItems.createDashboard.description',
          link: '/visualization/kanban'
        }
      ],
      guideListAdmin: [
        {
          titleKey: 'card.operationGuideAdmin.guideItems.createTenant.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.createTenant.description',
          link: '/management/user' // Example link, adjust if needed
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configureNotification.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configureNotification.description',
          link: '/management/notification'
        },
        {
          titleKey: 'card.operationGuideAdmin.guideItems.configurePlugin.title',
          descriptionKey: 'card.operationGuideAdmin.guideItems.configurePlugin.description',
          link: 'apply/plugin'
        }
      ]
    },
    iCardViewDefault: {
      w: 3, // default width
      h: 5, // Default height
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine
