# AutoBind User Guide

AutoBind Features provide simplified data source configuration，Automatically bind component properties toHTTPparameter，No need to manually configure complex parameter binding expressions。

## Basic concepts

AutoBind Support three modes：
- **strict**: strict mode，Only bind specified properties
- **loose**: Relaxed mode，Bind all available properties，Exclude specified attributes
- **custom**: Custom mode，Use custom binding rules

## Configuration example

### 1. Relaxed mode (recommend)

The simplest configuration，Automatically bind all standard properties：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose'
  }
}
```

**Automatically bound properties：**
- `base.deviceId` → `deviceId` parameter
- `base.metricsList` → `metrics` parameter
- `component.startTime` → `startTime` parameter
- `component.endTime` → `endTime` parameter
- `component.dataType` → `dataType` parameter

### 2. strict mode

Only bind specified properties：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'strict',
    includeProperties: [
      'base.deviceId',
      'component.startTime',
      'component.endTime'
    ]
  }
}
```

### 3. Relaxed mode + exclude properties

Bind all properties，but exclude some unnecessary：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose',
    excludeProperties: [
      'component.refreshInterval', // Exclude refresh interval
      'component.filterCondition'  // exclude filter
    ]
  }
}
```

### 4. Custom mode

Use fully custom binding rules：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/custom/endpoint',
    method: 'POST'
  },
  autoBind: {
    enabled: true,
    mode: 'custom',
    customRules: [
      {
        propertyPath: 'base.deviceId',
        paramName: 'device_id', // Custom parameter name
        required: true
      },
      {
        propertyPath: 'component.customProperty',
        paramName: 'custom_param',
        transform: (value) => `prefix_${value}`, // Custom conversion
        required: false
      }
    ]
  }
}
```

## Comparison with traditional methods

### traditional way（complex）

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET',
    params: {
      deviceId: '${component_id}.base.deviceId',
      startTime: '${component_id}.component.startTime',
      endTime: '${component_id}.component.endTime',
      metrics: '${component_id}.base.metricsList'
    }
  }
}
```

### AutoBindWay（simplify）

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose'
  }
}
```

## Technical implementation

AutoBind Functions are implemented by the following core components：

1. **DataSourceBindingConfig**: Manage binding rules and parameter mapping
2. **SimpleDataFlow**: Handle property changes and data source triggers
3. **VisualEditorBridge**: Inject automatically bound parameters when the data source is executed

### Binding rules

The system has built-in the following standard binding rules：

| Property path | HTTPParameter name | data conversion | Is it necessary |
|---------|-----------|---------|----------|
| `base.deviceId` | `deviceId` | none | yes |
| `base.metricsList` | `metrics` | array → comma separated string | no |
| `component.startTime` | `startTime` | Date → ISOstring | no |
| `component.endTime` | `endTime` | Date → ISOstring | no |
| `component.dataType` | `dataType` | none | no |
| `component.refreshInterval` | `refreshInterval` | Convert to integer | no |
| `component.filterCondition` | `filter` | none | no |

### Extend binding rules

Custom binding rules can be added programmatically：

```typescript
import { dataSourceBindingConfig } from '@/core/data-architecture/DataSourceBindingConfig'

// Add global binding rules
dataSourceBindingConfig.addCustomBindingRule({
  propertyPath: 'component.customField',
  paramName: 'custom_field',
  transform: (value) => value?.toString().toUpperCase(),
  required: false,
  description: 'Convert custom fields to uppercase'
})

// Set binding configuration for specific component types
dataSourceBindingConfig.setComponentConfig('my-widget', {
  componentType: 'my-widget',
  autoBindEnabled: true,
  additionalBindings: [
    {
      propertyPath: 'component.widgetSpecificProp',
      paramName: 'widget_prop',
      required: true
    }
  ]
})
```

## Debugging and diagnostics

After enabling development mode，Can be viewed on the consoleAutoBindExecution log：

```
🚀 [VisualEditorBridge] AutoBindParameter injection completed: {
  mode: "loose",
  autoBindParams: {
    deviceId: "device_001",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-01T23:59:59.999Z"
  },
  finalConfig: { ... }
}
```

Binding configuration can be inspected using the global debug object：

```javascript
// In browser console
console.log(__dataSourceBindingConfig.getDebugInfo())
```

## best practices

1. **Prefer relaxed mode**: For most scenarios，Relaxed mode provides the best development experience
2. **合理use排除属性**: When certain properties should not be passed to the backend，use`excludeProperties`
3. **Strict mode is used for sensitive scenarios**: Use strict mode when you need precise control over which parameters are sent
4. **Custom mode for special needs**: Use custom patterns when complex parameter conversions or non-standard parameter names are required
5. **Test parameter binding**: 确保在开发环境中验证AutoBindDo the generated parameters comply withAPIRequire

## Performance considerations

- AutoBindParameters are automatically regenerated when properties change，Ensure the real-time nature of data
- Built-in anti-shake mechanism to avoid frequentHTTPask
- Binding rule caching provides good performance

## backwards compatible

AutoBindFeatures are fully backwards compatible：
- Not configuredautoBindData sources continue to use traditional binding expressions
- Can be mixed in the same projectAutoBindand traditional way
- Existing binding expressions are not affected