# Interactive system update log

This document recordsThingsPanelAll version changes and new features of the core interaction system。

## 🎯 version specifications

we follow[Semantic versioning](https://semver.org/)specification：

- **Major version number (Major)**：incompatibleAPIchange
- **Minor version number (Minor)**：Backwards compatible features added
- **revision number (Patch)**：Backward compatibility issue fixes

---

## [1.3.0] - 2024-08-31 🚀

### ✨ New features

#### Conditional execution system enhancements
- 🎯 **Intelligent attribute monitoring**：Integrated properties expose registry，Automatically obtain component listenable properties
- 🔧 **Multiple condition types**：Support comparison、scope、Three conditional execution modes for expressions
- ⚡ **Real-time condition verification**：Instantly verify the validity of conditional logic during configuration

#### Cross-component interaction optimization
- 🌐 **Visual Editorintegrated**：深度integrated可视化编辑器，Dynamically obtain the list of canvas components
- 🎛️ **Attribute group display**：Display modifiable attributes grouped by function，Improve user experience
- 🔄 **Update mode selection**：Support replacement、Append、Three attribute update modes in front

#### User experience improvements
- 📱 **Mobile terminal adaptation**：NewInteractionCardWizardSimplified Wizard，Optimize the experience of small screen devices
- 🎨 **Advanced options fold**：Smartly hide advanced configuration options，Keep the interface simple
- 🔍 **Search filter**：Property and component selectors support input search filtering

### 🛠️ Function optimization

- ⚡ **Performance improvements**：Optimize rendering performance under a large number of interactive configurations
- 🎯 **Smart defaults**：Automatically set sensible conditional defaults based on property type
- 📊 **Execution statistics**：Added statistics on interaction execution times and response time
- 🌍 **Perfect internationalization**：Supplement missing multi-language translation keys

### 🐛 bug fixes

- 🔧 Fixed an issue where conditional configuration was not saved in some cases
- 🔧 Fixed the problem that the property list is not updated after selecting the target component of cross-component interaction  
- 🔧 Fixed the problem of too strict format verification when importing templates
- 🔧 Fixed the problem that the preview function does not take effect in certain action types

---

## [1.2.0] - 2024-08-15 🎨

### ✨ New features

#### template system
- 📚 **Preset template library**：Provide basic interaction、visual effects、Animation effects、Four categories of composite interaction templates
- 🎨 **Custom template**：Support users to import and save custom interaction templates
- 💾 **local storage**：User templates are automatically saved tolocalStorage，Persistence across sessions
- 🔍 **Template preview**：专用的Template preview组件，Visual display template effect

#### Template preview component (InteractionTemplatePreview)
- 🎮 **Interactive preview**：Real-time display of interactive effects of templates
- 📋 **Details**：Display event types for templates、动作序列等Details
- 🎯 **One click application**：Apply the template directly to the current component configuration

### 🛠️ Function optimization

- 🎭 **icon system**：Configure exclusive icons and colors for different template types
- 📁 **Classification management**：Classify and organize templates by function and complexity
- 🔄 **backwards compatible**：Make sure old version configurations work properly in the new template system

---

## [1.1.0] - 2024-08-01 ⚡

### ✨ New features

#### Live preview system
- 🎮 **Interactive preview**：InteractionPreviewComponents provide a complete interactive testing environment
- 📊 **execution log**：Record the interactive execution process in detail，Contains timestamp and execution results
- 🎛️ **Configuration control**：Enable in real time/Disable specific interaction configurations
- 🔄 **reset function**：Restore preview elements to their initial state with one click

#### conditional execution system
- 🎯 **Data change monitoring**：Supports monitoring component property changes and triggering corresponding interactions
- ⚖️ **Conditional judgment**：Support numerical comparison、range check、Expression calculation and other conditions
- 🔧 **Property binding**：Deep integration with attribute exposure system，Automatically obtain listenable attributes

#### Response action extension
- 🌐 **URLJump enhancement**：Supports two jump modes: internal menu routing and external links
- 🎨 **visual effects**：Add background color、text color、border color、Visual changes such as transparency
- ⚡ **animation support**：integratedCSSAnimation and custom animation effects
- 📱 **Component communication**：Supports data updates and status synchronization across components

### 🛠️ technical improvements

- 🏗️ **Architecture refactoring**：Adopt a clearer component separation of responsibility design
- 📝 **type safety**：perfectTypeScripttype definition system
- 🎨 **Theme integration**：fully adaptedThingsPaneltheme system
- 📱 **Responsive design**：Adapted to mobile and tablet devices

---

## [1.0.0] - 2024-07-15 🎉

### ✨ initial release

#### core components
- 🎛️ **InteractionSettingsForm**：Main interactive configuration form component
- ✏️ **InteractionResponseEditor**：Response Action Editor
- 📋 **ConfigRegistry**：Configure component registration manager

#### Basic functions
- 🖱️ **Basic event support**：Click、Hover、Get focus、Common events such as out of focus
- 🎯 **responsive action system**：Support style changes、Content update、Actions such as function calls
- 🔧 **Configuration management**：Complete interactive configuration adding, deleting, modifying and checking functions
- 🌍 **International support**：Chinese and English bilingual interface

#### Technical basis
- ⚡ **Vue 3 Composition API**：Based on the latestVue 3technology stack
- 🎨 **Naive UIintegrated**：深度integratedNaive UIComponent library
- 📝 **TypeScriptsupport**：Complete type definitions and type safety
- 🎯 **Modular design**：Clear definition of component responsibilities and interfaces

---

## 🔄 Upgrade guide

### from v1.2.x upgrade to v1.3.x

#### 💡 Recommended upgrade steps

1. **Update dependencies**
   ```bash
   npm update @thingspanel/interaction-system
   ```

2. **Check property exposure configuration**
   ```typescript
   // Make sure the component has correctly configured property exposure
   propertyExposureRegistry.register('your-component', {
     listenableProperties: [
       { name: 'value', type: 'number', label: 'numerical value' }
     ]
   })
   ```

3. **Update interaction configuration**
   ```typescript
   // The new version supports richer condition configurations
   const config: InteractionConfig = {
     event: 'dataChange',
     watchedProperty: 'temperature',  // Add new attributes
     condition: {                     // Enhanced conditions system
       type: 'comparison',
       operator: 'greaterThan',
       value: 30
     },
     // ... Other configurations
   }
   ```

#### ⚠️ breaking changes

**No breaking changes** - v1.3.0 Fully backwards compatible v1.2.x

### from v1.1.x upgrade to v1.2.x

#### 🆕 Use new features

```typescript
// Use the new template system
import { InteractionTemplateSelector } from '@/core/interaction-system'

const applyTemplate = (template: InteractionConfig) => {
  interactions.value.push(template)
}
```

#### ⚠️ breaking changes

**No breaking changes** - v1.2.0 Fully backwards compatible v1.1.x

### from v1.0.x upgrade to v1.1.x

#### 🔄 Configuration migration

```typescript
// Old version configuration
const oldConfig = {
  event: 'click',
  responses: [{ action: 'changeColor', value: '#ff0000' }]
}

// The new version supports more configuration options
const newConfig = {
  event: 'click',
  condition: { type: 'always' },        // Add condition configuration
  priority: 1,                          // Add priority
  responses: [{ 
    action: 'changeBackgroundColor',     // More specific action types
    value: '#ff0000',
    duration: 300                       // Add duration
  }]
}
```

---

## 🛣️ Development roadmap

### v1.4.0 (in plan) 🔮

#### 🎯 Plan new features
- 🤖 **AIAuxiliary configuration**：Intelligent generation of interactive configurations based on user intent
- 🔄 **Batch operations**：Support multiple components to configure the same interaction at the same time
- 📊 **Use analytics**：Interactive usage statistics and hotspot analysis
- 🎨 **Theme customization**：Deep customization of visual themes for interactive components

#### 🛠️ technical improvements
- ⚡ **Performance optimization**：Improved rendering performance in large-scale interactive configurations
- 🧪 **test coverage**：完善单元测试和集成test coverage率
- 📚 **Complete documentation**：APIAutomatic documentation generation and interactive examples

### v1.5.0 (Under planning) 🌟

- 🌐 **Cloud sync**：Cloud storage synchronization of interactive templates and configurations
- 🔌 **plug-in system**：Extensible plug-in architecture for third-party developers
- 📱 **PWAsupport**：ProgressiveWebApplication function support
- 🎮 **Gamification elements**：Add a gamified experience to the configuration process

---

## 🙋‍♀️ community contribution

### 🎉 Contributor list

Thanks to all developers who contributed to the interactive system！

- 👨‍💻 **Core development team**
- 🐛 **Question feedback person**
- 📝 **Documentation Contributor**
- 🧪 **test participants**

### 📋 Contribution Guide

1. 🍴 Fork Project warehouse
2. 🌿 Create a feature branch：`git checkout -b feature/amazing-feature`
3. 💾 Commit changes：`git commit -m 'Add amazing feature'`
4. 📤 push branch：`git push origin feature/amazing-feature`
5. 🔄 submitPull Request

---

## 📞 Support and feedback

- 🐛 **Problem report**：[GitHub Issues](https://github.com/thingspanel/frontend/issues)
- 💬 **Discussion and exchange**：[GitHub Discussions](https://github.com/thingspanel/frontend/discussions)
- 📧 **Email contact**：support@thingspanel.io
- 📚 **Document Center**：[ThingsPanel Docs](https://docs.thingspanel.io)

---

## 📜 license

This project uses [MITlicense](./LICENSE) Open source release。

---

*The update log will be continuously maintained，Record every progress of the system。Thank you for choosingThingsPanelinteractive system！*

---

**🎯 Version overview**

| Version | release date | Main features | compatibility |
|------|----------|----------|---------|
| v1.3.0 | 2024-08-31 | conditional execution system、Cross-component interaction | ✅ Fully compatible |
| v1.2.0 | 2024-08-15 | template system、Custom template | ✅ Fully compatible |
| v1.1.0 | 2024-08-01 | Live preview、conditional execution | ✅ Fully compatible |
| v1.0.0 | 2024-07-15 | initial release、Core functions | - |

---

*last updated：2024Year8moon31day*