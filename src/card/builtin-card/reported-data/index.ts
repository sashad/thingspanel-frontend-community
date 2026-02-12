import { defineAsyncComponent } from 'vue'
import type { ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'
import poster from './poster.png'
export default {
  id: 'reported-data',
  type: 'builtin',
  component: defineAsyncComponent(() => import('./component.vue')),
  poster,
  title: $t('card.reportedData.title'), // Need to be added to the language file 'page.dashboard.cards.reportedData' key value pair
  preset: {
    dataSource: {
      origin: 'device', // The data source usually comes from the device
      isSupportTimeRange: true, // Typically required to support time ranges
      dataTimeRange: '1h', // Default time range
      isSupportAggregate: true, // Typically required to support aggregation
      dataAggregateRange: '1m', // Default aggregation scope
      systemSource: [],
      deviceSource: [] // The default device source is empty，Configured by user
    },
    config: {},
    iCardViewDefault: {
      w: 2, // default width
      h: 2, // Default height
      minW: 2,
      minH: 2
    }
  }
} as ICardDefine
