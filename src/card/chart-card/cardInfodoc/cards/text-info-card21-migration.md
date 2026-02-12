# Text Info components Card 2.1 Migrate configuration

## Component overview
**Component name**: text-info (text message)  
**componentsID**: chart-text  
**Classification**: information (Information display)  
**Function**: Display static or dynamic text information，Supports rich text formatting and adaptive fonts

## Current implementation analysis

### Configuration structure
```typescript
// Current configuration interface
interface CurrentConfig {
  dataSource: {
    origin: 'device';
    sourceNum: 1;
    systemSource: [{}];
    deviceSource: [{
      metricsType: 'attributes';
      deviceId: string;
      metricsId: string;
      metricsName?: string;
    }];
  };
  iCardViewDefault: {
    w: 2; h: 2; minW: 1; minH: 1;
  };
}
```

### Data acquisition method
- **attribute data**: pass `getAttributeDataSet` API Get device properties
- **WebSocketrenew**: Support real-time data updates
- **default value**: 当无数据时显示default value '1.9.2'
- **unit processing**: Automatically extract attributes from unit Field

### layout properties
- **adaptive fonts**: Dynamically adjust font size based on container size
- **Responsive design**: use ResizeObserver Listen for container changes
- **vertical layout**: Indicator names and values ​​are arranged vertically
- **Minimum size**: support 1x1 minimal layout

## Card 2.1 Migrate configuration

### Component definition
```typescript
import type { ComponentDefinition } from '@/card2.1/core/types';

export const textInfoDefinition: ComponentDefinition = {
  type: 'text-info',
  name: 'text message',
  description: 'Display static or dynamic text information，Supports rich text formatting and adaptive fonts',
  category: 'information',
  
  // Default configuration
  defaultConfig: {
    title: 'text message',
    content: '',
    fontSize: 'auto', // Adaptive font size
    fontWeight: 'normal',
    textAlign: 'center',
    color: '#333333',
    backgroundColor: 'transparent',
    showTitle: true,
    titlePosition: 'top', // 'top' | 'bottom' | 'left' | 'right'
    richText: false, // Whether to support rich text
    defaultValue: 'No data yet',
    wordWrap: true,
    maxLines: null // Maximum number of rows limit
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 12, height: 12 },
    resizable: true,
    aspectRatio: null // Allow any ratio
  },
  
  // Data source configuration
  dataSources: {
    primary: {
      type: 'device-attribute',
      required: false, // Can be static text
      multiple: false,
      description: 'Device attribute data source'
    },
    static: {
      type: 'static-text',
      required: false,
      multiple: false,
      description: 'static text content'
    }
  },
  
  // Static parameter configuration
  staticParams: {
    title: {
      type: 'string',
      label: 'title',
      defaultValue: 'text message',
      required: false
    },
    content: {
      type: 'textarea',
      label: 'static content',
      defaultValue: '',
      required: false,
      description: 'Static content displayed when there is no data source'
    },
    fontSize: {
      type: 'select',
      label: 'font size',
      options: [
        { label: 'Adaptive', value: 'auto' },
        { label: '12px', value: '12px' },
        { label: '14px', value: '14px' },
        { label: '16px', value: '16px' },
        { label: '18px', value: '18px' },
        { label: '20px', value: '20px' },
        { label: '24px', value: '24px' },
        { label: '28px', value: '28px' },
        { label: '32px', value: '32px' }
      ],
      defaultValue: 'auto'
    },
    fontWeight: {
      type: 'select',
      label: 'Font weight',
      options: [
        { label: 'normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
        { label: 'fine body', value: 'lighter' },
        { label: 'Extra thick', value: 'bolder' }
      ],
      defaultValue: 'normal'
    },
    textAlign: {
      type: 'select',
      label: 'text alignment',
      options: [
        { label: 'left aligned', value: 'left' },
        { label: 'center', value: 'center' },
        { label: 'Align right', value: 'right' },
        { label: 'Justify', value: 'justify' }
      ],
      defaultValue: 'center'
    },
    color: {
      type: 'color',
      label: 'text color',
      defaultValue: '#333333'
    },
    backgroundColor: {
      type: 'color',
      label: 'background color',
      defaultValue: 'transparent'
    },
    showTitle: {
      type: 'boolean',
      label: 'show title',
      defaultValue: true
    },
    titlePosition: {
      type: 'select',
      label: 'title position',
      options: [
        { label: 'top', value: 'top' },
        { label: 'bottom', value: 'bottom' },
        { label: 'left side', value: 'left' },
        { label: 'right side', value: 'right' }
      ],
      defaultValue: 'top',
      condition: { showTitle: true }
    },
    richText: {
      type: 'boolean',
      label: 'rich text mode',
      defaultValue: false,
      description: 'supportHTMLtags andMarkdownFormat'
    },
    defaultValue: {
      type: 'string',
      label: 'default value',
      defaultValue: 'No data yet',
      description: 'Content displayed when the data source has no data'
    },
    wordWrap: {
      type: 'boolean',
      label: 'Automatic line wrapping',
      defaultValue: true
    },
    maxLines: {
      type: 'number',
      label: 'Maximum number of rows',
      defaultValue: null,
      min: 1,
      max: 20,
      description: 'Limit the maximum number of rows displayed，Display ellipses in excess parts'
    }
  },
  
  // Interactive capability statement
  interactionCapabilities: {
    supportedEvents: ['click', 'dataUpdate', 'textSelect'],
    supportedActions: ['refresh', 'copy', 'highlight'],
    canListenToProps: ['content', 'title', 'isLoading', 'hasError'],
    defaultInteractionConfig: {
      onClick: {
        enabled: false,
        actions: []
      },
      onDataUpdate: {
        enabled: true,
        actions: ['updateContent']
      },
      onTextSelect: {
        enabled: false,
        actions: ['copy']
      }
    }
  },
  
  // Attribute exposure whitelist
  exposeProps: ['currentContent', 'title', 'textLength', 'isLoading', 'hasError', 'dataSource']
};
```

### Data source mapping
```typescript
// Card 2.1 Data source interface
interface DataSourceMapping {
  // Device attribute data source
  deviceAttribute: {
    deviceId: string;
    attributeKey: string;
    displayName?: string;
  };
  
  // Static text data source
  staticText: {
    content: string;
    format?: 'plain' | 'html' | 'markdown';
  };
  
  // System data source
  systemData: {
    endpoint: string;
    params?: Record<string, any>;
    textField: string; // Specify which field to use as text content
  };
  
  // APIdata source
  apiData: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    textField: string;
  };
}
```

### Implementation points

#### 1. Text processing enhancements
- **Rich text support**: supportHTMLtags andMarkdownformat rendering
- **text formatting**: Support digital formatting、Date formatting, etc.
- **Multi-language support**: Support internationalized text content
- **Text truncation**: Supports truncation by number of characters or number of lines，Show ellipses

#### 2. Style system upgrade
- **Theme adaptation**: Support bright colors/Dark theme automatically switches
- **Font system**: Richer font options and custom fonts
- **Typesetting control**: row height、word spacing、paragraph spacing etc.
- **Borders and shadows**: Supports border styles and shadow effects

#### 3. layout system
- **Flexible layout**: Supports multiple arrangements of titles and content
- **scroll control**: Scroll behavior when content exceeds
- **Alignment**: 支持多种文本Alignment
- **Responsive**: Adaptive layout in different sizes

#### 4. Interactive capabilities
- **text selection**: Supports text selection and copying
- **click event**: Support clicking to trigger custom actions
- **hover effect**: Visual feedback on mouseover
- **right click menu**: Provide copy、Quick operations such as refresh

#### 5. Data processing
- **Multi-source support**: Support device properties、static text、APIand other data sources
- **Data validation**: Add data type validation and error handling
- **caching mechanism**: Implement data caching，Reduce duplicate requests
- **real time updates**: WebSocket数据的real time updates

## Migration checklist

### functional equivalence
- [ ] Obtaining device attribute data
- [ ] WebSocket real time updates
- [ ] Adaptive font size
- [ ] Responsive layout
- [ ] Default value display
- [ ] Title and content display

### New features
- [ ] Rich text support
- [ ] Multiple data sources support
- [ ] Theme adaptation
- [ ] text formatting
- [ ] interaction events
- [ ] Text selection and copying
- [ ] Multiple layout modes

### Performance optimization
- [ ] Data cache
- [ ] Anti-shake processing
- [ ] Memory leak prevention
- [ ] Rendering optimization
- [ ] virtual scrolling（long text）

## Migration steps

1. **Create component definition file** (`definition.ts`)
2. **accomplish Vue components** (`component.vue`)
3. **Configure data source adapter**
4. **Implement configuration panel**
5. **Add rich text renderer**
6. **Implement theme styles**
7. **Add interactive features**
8. **Write unit tests**
9. **Performance testing and optimization**
10. **Documentation and examples**

## Related documents

- [Card 2.1 Component Development Guide](../../../card2.1/docs/component-development.md)
- [Data source system documentation](../../../card2.1/docs/data-source-system.md)
- [Interactive system documentation](../../../card2.1/docs/interaction-system.md)
- [Theme system documentation](../../../card2.1/docs/theme-system.md)
- [Rich text rendering document](../../../card2.1/docs/rich-text-rendering.md)