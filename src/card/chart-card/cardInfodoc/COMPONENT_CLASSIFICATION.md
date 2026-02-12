# Chart Card Component classification index

based on `src/card2.1/core/category-definition.ts` classification system，right `src/card/chart-card` Components in the directory are classified and Card 2.1 Migration status tracking。

## 📊 Dashboard (dashboard)

### instrument-panel - Dashboard components
- **componentsID**: `chart-instrument`
- **Function description**: Circular dashboard showing a single value，Support custom minimum value、maximum value、Units and color configurations
- **Technical characteristics**: 
  - based on Canvas High-performance dashboards drawn
  - Support dynamic numerical updates and animation effects
  - Configurable scale、Pointer styles and color themes
- **Applicable scenarios**: temperature、pressure、speed、Visual display of single indicators such as voltage
- **data source**: Supports telemetry data from a single device
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

## ℹ️ information (information)

### digit-indicator - digital indicator
- **componentsID**: `chart-digit`
- **Function description**: Display device data as large font numbers，Support unit、Color and font configuration
- **Technical characteristics**:
  - Responsive digital display，Adaptive container size
  - Supports numerical formatting and unit display
  - Configurable color themes and font styles
- **Applicable scenarios**: Prominent display of key indicators，Such as the number of online devices、Number of alarms、total value etc.
- **data source**: Supports telemetry or attribute data from a single device
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### text-info - text message component
- **componentsID**: `chart-text`
- **Function description**: Display static or dynamic text information，Supports rich text formatting and template variables
- **Technical characteristics**:
  - support Markdown format rendering
  - Template variable substitution function
  - Configurable fonts、Color and alignment
- **Applicable scenarios**: Device description、Status description、notification message、Display of text content such as operation guides
- **data source**: Supports static text or device property data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### state-display - Status display component
- **componentsID**: `chart-state`
- **Function description**: with icon、Display device in color or text form/system operating status
- **Technical characteristics**:
  - Supports multiple state mapping rules
  - Configurable icon library and color themes
  - Support status change animation effects
- **Applicable scenarios**: Device online status、System health status、connection status、Operation mode, etc.
- **data source**: Supports state mapping of device telemetry or attribute data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### demo - Demo component
- **componentsID**: `chart-demo`
- **Function description**: Sample components for development testing and functional demonstrations，Display component development specifications
- **Technical characteristics**:
  - Contains complete component development examples
  - Demonstrate data source integration methods
  - Demonstrate configuration form best practices
- **Applicable scenarios**: Component development and debugging、Function display、training demonstration、Getting Started
- **data source**: Supports simulated data and real device data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

## 🎛️ control (control)

### chart-switch - switch controller
- **componentsID**: `chart-switch`
- **Function description**: Provide switch button，Can remotely control the opening of the device/closed state
- **Technical characteristics**:
  - Supports multiple switch styles（button、slider、switcher）
  - Real-time status feedback and confirmation mechanism
  - Support permission control and operation log
- **Applicable scenarios**: Light control、Device power management、Function switch、Valve control, etc.
- **data source**: Supports reading and writing of device attribute data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### digit-setter - digital setter
- **componentsID**: `chart-setter`
- **Function description**: Set numeric parameters via input boxes or sliders，Support range limit and step size control
- **Technical characteristics**:
  - Support input box、slider、Stepper and other input methods
  - Numerical validation and range limits
  - Real-time preview and confirmation mechanism
- **Applicable scenarios**: Temperature setting、Speed ​​adjustment、Threshold configuration、Parameter adjustment and other numerical parameter control
- **data source**: Supports reading and writing of device attribute data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### enum-control - Enum control components
- **componentsID**: `chart-enum`
- **Function description**: Provide drop-down selections or button groups，Used to switch multiple option parameters
- **Technical characteristics**:
  - Support drop-down menu、radio button、Button group and other selection methods
  - Configurable options list and display text
  - Support option grouping and search functions
- **Applicable scenarios**: Mode selection、Gear switch、Status settings、Configuration selection and other enumeration type control
- **data source**: Supports enumeration value operations for device attribute data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

## 📈 data (data)

### chart-bar - Bar chart component
- **componentsID**: `chart-bar`
- **Function description**: Display data as a bar chart，Supports time range selection and data aggregation
- **Technical characteristics**:
  - based on ECharts High performance chart rendering
  - Supports multi-series data and group display
  - Configurable color themes and animation effects
- **Applicable scenarios**: sales statistics、Dosage comparison、Historical data analysis、Comparison of performance indicators, etc.
- **data source**: Supports historical telemetry data from multiple devices
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### chart-curve - Graph component
- **componentsID**: `chart-curve`
- **Function description**: Display data trend changes in the form of a line chart，Supports multiple data lines and real-time updates
- **Technical characteristics**:
  - High performance time series data rendering
  - Support data zoom and pan operations
  - Configurable line styles and marker points
- **Applicable scenarios**: temperature change、Traffic monitoring、Performance trend analysis、Real-time data monitoring, etc.
- **data source**: Supports historical and real-time telemetry data from multiple devices
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### chart-table - Data table component
- **componentsID**: `chart-table`
- **Function description**: Present structured data in tabular form，Support sorting、filter、Paging and exporting
- **Technical characteristics**:
  - Virtual scrolling supports display of large amounts of data
  - Configurable column definitions and data formatting
  - Supports row selection and batch operations
- **Applicable scenarios**: Device list、logging、View detailed data、Report display, etc.
- **data source**: Supports historical and real-time data from multiple devices
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

### dispatch-data - Data distribution component
- **componentsID**: `chart-dispatch`
- **Function description**: Process and distribute data to other components or systems，Support data transformation and routing
- **Technical characteristics**:
  - Supports multiple data sending methods（HTTP、MQTT、WebSocket）
  - Configurable data conversion rules and formats
  - Support error retry and status monitoring
- **Applicable scenarios**: data conversion、message routing、System integration、Third-party interface docking, etc.
- **data source**: Supports processing and distribution of device telemetry and attribute data
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

## 🎥 Audio and video (media)

### video-player - Video player component
- **componentsID**: `chart-videoplayer`
- **Function description**: Play live video streams or record video files，Supports multiple video formats and streaming protocols
- **Technical characteristics**:
  - based on Video.js professional video player
  - support HLS、RTMP、WebRTC Waiting for streaming protocols
  - Configurable playback controls and quality selection
- **Applicable scenarios**: Monitoring screen、Device status video、Operation instruction video、Live streaming and more
- **data source**: Support video provided by device attribute dataURL
- **Migration status**: ✅ Completed Card 2.1 Migrate configuration documents

---

## 📋 Migration status overview

### Migration configuration document completed (13/13)
- ✅ **Dashboard class (1/1)**: instrument-panel
- ✅ **Information (4/4)**: digit-indicator, text-info, state-display, demo
- ✅ **Control class (3/3)**: chart-switch, digit-setter, enum-control
- ✅ **data class (4/4)**: chart-bar, chart-curve, chart-table, dispatch-data
- ✅ **Audio and video (1/1)**: video-player

### Migrate document location
of all components Card 2.1 The migration configuration document is located at：
```
src/card/chart-card/cardInfodoc/cards/
├── chart-bar-card21-migration.md
├── chart-curve-card21-migration.md
├── chart-switch-card21-migration.md
├── chart-table-card21-migration.md
├── demo-card21-migration.md
├── digit-indicator-card21-migration.md
├── digit-setter-card21-migration.md
├── dispatch-data-card21-migration.md
├── enum-control-card21-migration.md
├── instrument-panel-card21-migration.md
├── state-display-card21-migration.md
├── text-info-card21-migration.md
└── video-player-card21-migration.md
```

### Migration priority recommendations
1. **high priority**: instrument-panel, digit-indicator, chart-curve, chart-bar
2. **medium priority**: state-display, chart-switch, chart-table, text-info
3. **low priority**: digit-setter, enum-control, demo, dispatch-data, video-player

---

**statistics**: total 13 components，distributed in 5 in categories，of all components Card 2.1 Migrating configuration documents has been completed ✅

**last updated**: 2024Year12moon - Complete all components Card 2.1 Writing migration configuration documents