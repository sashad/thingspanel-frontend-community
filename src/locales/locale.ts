// use import.meta.globEager Replace a lot of import
// This can improve performance，and make the code more concise
const modules = import.meta.glob('./langs/**/*.json', { eager: true })

function getLangMessages(modules: Record<string, any>, lang: 'zh-cn' | 'en-us') {
  const messages: Record<string, any> = {}
  const prefix = `./langs/${lang}/`

  for (const path in modules) {
    if (path.startsWith(prefix)) {
      const content = modules[path].default

      // Extract filename as namespace
      const fileName = path.replace(prefix, '').replace('.json', '')

      // special handling：Some files remain flat for compatibility with existing code
      const flatFiles = [
        'common',
        'card',
        'page',
        'device_template',
        'basic',
        'buttons',
        'custom',
        'dashboard_panel',
        'dropdown',
        'form',
        'generate',
        'grouping_details',
        'icon',
        'interaction',
        'kanban',
        'others',
        'route',
        'script',
        'test',
        'theme',
        'time',
        'visual-editor',
        'widget-library'
      ]

      if (flatFiles.includes(fileName)) {
        // flat merge（maintain existing behavior）
        Object.assign(messages, content)
      } else {
        // Use filename as namespace
        messages[fileName] = content
      }
    }
  }
  return messages
}

const locales: Record<I18n.LangType, I18n.Schema> = {
  'zh-CN': getLangMessages(modules, 'zh-cn') as unknown as I18n.Schema,
  'en-US': getLangMessages(modules, 'en-us') as unknown as I18n.Schema
}

export default locales
