# ThingsPanel International Development Guide

## 🌐 Project internationalization introduction

ThingsPanel The front-end project adopts a modern modular internationalization architecture，
Support bilingual Chinese and English，Provide localized experience for global users。

### 🏗️ Architectural features

- **Modular management**: Split by function into18modules，Easy to maintain
- **Bilingual support**: Chinese（zh-CN）and english（en-US）
- **Automatic merge**: Automatically merge all module files at runtime
- **Smart reminder**: Cooperate i18n Ally Provide strong development support

### 📁 Directory structure

```
src/locales/
├── langs/                        # Language pack directory
│   ├── zh-cn/                   # Chinese module file (18indivual)
│   │   ├── basic.json           # Basic configuration (2keys)
│   │   ├── common.json          # universal text (279keys)
│   │   ├── page.json            # Page related (532keys)
│   │   ├── custom.json          # Custom functions (177keys)
│   │   ├── card.json            # card component (332keys)
│   │   └── ... (other13modules)
│   └── en-us/                   # English module file (18indivual)
│       ├── basic.json
│       ├── common.json
│       ├── page.json
│       └── ... (Corresponding to Chinese module)
├── locale.ts                    # Language pack merge and export
├── index.ts                     # International entrance
├── i18n-ally-config.json       # i18n Ally Configuration copy
└── Configuration instructions.md                  # This guidance document
```

### 📊 Module distribution statistics

| module | Number of keys | illustrate | Main purpose |
|------|------|------|----------|
| `page.json` | 532 | Page related | Dedicated text for each page |
| `generate.json` | 481 | Generate related | Dynamically generate content |
| `card.json` | 332 | card component | Dashboard cards |
| `common.json` | 279 | universal text | button、Tips etc. |
| `custom.json` | 177 | Custom functions | Business logic related |
| `route.json` | 121 | Routing related | Navigation and menus |
| other12modules | 256 | Special functions | equipment、Alarm, etc. |
| **total** | **2198** | **18modules** | **Complete coverage** |

## 🔧 i18n Ally Plug-in installation guide

### first step：Install plugin

1. **Open VS Code**
2. **Visit the extended market**：according to `Ctrl+Shift+X` Or click the extension icon on the left
3. **Search plugin**：Enter in the search box `i18n Ally`
4. **Install插件**：Click [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) of"Install"button

### Step 2：Copy configuration file

Copy the project configuration to the root directory：

**Windows user**:
```powershell
# Execute in the project root directory
Copy-Item "src/locales/i18n-ally-config.json" ".i18nrc.json"
```

**Linux/Mac user**:
```bash
# Execute in the project root directory  
cp src/locales/i18n-ally-config.json .i18nrc.json
```

**Manual copy**:
1. Open `src/locales/i18n-ally-config.json`
2. Copy all content
3. Create in the project root directory `.i18nrc.json` document
4. Paste content and save

### Step 3：reload VS Code

1. according to `Ctrl+Shift+P` Open command palette
2. enter `Developer: Reload Window`
3. Press Enter to reload

### Verify successful installation

Open any containing `$t()` function file，should be able to see：
- 💡 Live preview of translated content
- 🔍 Smart prompts for translation keys  
- ⚠️ Warning sign for missing translations

## 📖 Instructions for use

### 🎯 Basic usage

#### 1. Using translations in code

```vue
<template>
  <!-- in template -->
  <h1>{{ $t('page.dashboard.title') }}</h1>
  <button>{{ $t('common.buttons.save') }}</button>
  
  <!-- dynamic translation -->
  <span>{{ $t('custom.devicePage.status', { status: deviceStatus }) }}</span>
</template>

<script setup>
import { $t } from '@/locales'

// in script
const message = $t('common.messages.success')
console.log($t('page.device.createDevice'))
</script>
```

#### 2. Add new translation

**step one**：Determine module
Choose appropriate module files based on functionality：
- Page title、content → `page.json`
- Device related functions → `custom.json`  
- Universal button、hint → `common.json`
- card component text → `card.json`

**Step 2**：Add Chinese translation
exist `src/locales/langs/zh-cn/module.json` Add in：
```json
{
  "custom.devicePage.newFeature": "new features",
  "custom.devicePage.description": "This is a description of a new feature"
}
```

**Step 3**：Add English translation
exist `src/locales/langs/en-us/module.json` Add in：
```json
{
  "custom.devicePage.newFeature": "New Feature", 
  "custom.devicePage.description": "This is a description of the new feature"
}
```

#### 3. Translation key naming convention

```
{module}.{page/components}.{Specific functions}

✅ Correct example：
- custom.devicePage.deviceName
- page.dashboard.title
- common.buttons.save
- card.chart.dataSource

❌ Error example：
- deviceName (Missing module prefix)
- custom_device_page_name (Use underscore)
- custom.DevicePage.name (uppercase letter)
```

### 🛠️ Advanced features

#### 1. Translation with parameters

```json
// zh-cn/common.json
{
  "common.welcome": "welcome {name}，today is {date}"
}

// en-us/common.json  
{
  "common.welcome": "Welcome {name}, today is {date}"
}
```

```vue
<template>
  <div>{{ $t('common.welcome', { name: userName, date: currentDate }) }}</div>
</template>
```

#### 2. Plural form processing

```json
// zh-cn/common.json
{
  "common.itemCount": "common {count} items"
}

// en-us/common.json
{
  "common.itemCount": "{count} item | {count} items"
}
```

#### 3. Namespace usage

```vue
<script setup>
// Use namespaces to improve performance
const deviceTexts = $tm('custom.devicePage')
console.log(deviceTexts.deviceName) // "Device name"
</script>
```

### 🔍 i18n Ally Detailed function explanation

#### 1. Live preview
Hover in code `$t()` function，View translations in the current language

#### 2. Quick jump
- `Ctrl+Click` The translation key quickly jumps to the correspondingJSONdocument
- See the structure of all translation files in the sidebar

#### 3. Deletion detection
- Automatic detection of missing translation keys
- Show translation completion in sidebar
- Highlight untranslated text

#### 4. Batch operations
- Add missing translations in bulk
- Batch rename translation keys
- Export/Import translation files

#### 5. Translation suggestions
- Automatic translation suggestions（Translation engine needs to be configured）
- termbase matching
- Translation consistency check

## ⚙️ Configuration instructions

### Language settings
```json
{
  "sourceLanguage": "zh-CN",      // source language（development language）
  "targetLanguages": ["en-US"]    // Target language list
}
```

### File path configuration
```json
{
  "locales": {
    "zh-CN": "src/locales/langs/zh-cn/*.json",
    "en-US": "src/locales/langs/en-us/*.json"
  }
}
```

### Translation glossary
```json
{
  "termBase": {
    "equipment": "device",
    "Alarm": "alarm", 
    "Dashboard": "dashboard",
    "automation": "automation",
    "Visualization": "visualization",
    "manage": "management"
  }
}
```

## 🎨 best practices

### ✅ Recommended practices

1. **stay in sync**：Update both Chinese and English files when adding new keys
2. **Naming convention**：Use a unified key name format
3. **Module division**：Place translations into appropriate modules by function
4. **timely testing**：添加翻译后timely testing显示效果
5. **code review**：翻译也需要进行code review

### ❌ Things to avoid

1. **hardcoded text**：Avoid writing Chinese text directly in the code
2. **Duplicate key name**：Avoid using the same key names in different modules
3. **Too long translation**：Avoid long translation text affecting the interface layout
4. **special characters**：避免在翻译中使用special characters
5. **forget english**：When adding Chinese, I forgot to add the corresponding English

## 🚨 troubleshooting

### FAQ

#### 1. Can't see translation preview
**reason**: The configuration file is incorrectly located or in the wrong format
**solve**:
- confirm `.i18nrc.json` In the project root directory
- examine JSON Is the grammar correct?
- reload VS Code window

#### 2. Prompt translation missing
**reason**: The translation key does not exist in the corresponding language file
**solve**:
- Check file path configuration
- Confirm whether the translation key is added correctly
- The verification file is encoded as UTF-8

#### 3. Plug-in function abnormally
**reason**: Plug-in version incompatibility or configuration conflict
**solve**:
- renew i18n Ally to the latest version
- Restart VS Code
- Reinstall plugin

### Debugging steps

1. **Check configuration file**：confirm `.i18nrc.json` exists and is in the correct format
2. **Verify file path**：Confirm that the language file path matches the configuration
3. **查看插件state**：exist VS Code Status bar view i18n Ally state
4. **Check the console**：Open developer tools to view error messages

## 📞 Support and help

### Technical support
- **Project documentation**: View documentation related to the root directory
- **Official documentation**: [i18n Ally GitHub](https://github.com/lokalise/i18n-ally)
- **community support**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally)

### Teamwork
- **Code specifications**: Follow project translation key naming conventions
- **Collaboration process**: Translation modifications are also needed PR review
- **Synchronous updates**: Regularly synchronize the latest configuration files

---

**Document maintenance**: ThingsPanel development team  
**last updated**: 2025Year1moon1day  
**Applicable version**: ThingsPanel Frontend Community v1.0+ 