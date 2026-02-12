#!/usr/bin/env node

/**
 * Develop QA scripts
 * Ensure code meets all quality standards before submission
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Color output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`, 'cyan')
  log(`${colors.bold}${colors.cyan}${title}`, 'cyan')
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}`, 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Run the command and return the results
 */
function runCommand(command, description) {
  try {
    logInfo(`implement: ${description}`)
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000 // 2minutes timeout
    })
    return { success: true, output: result }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    }
  }
}

/**
 * Check if the file exists
 */
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} exist`)
    return true
  } else {
    logError(`${description} does not exist: ${filePath}`)
    return false
  }
}

/**
 * examine PanelV2 Architecture compliance
 */
function checkPanelV2Compliance() {
  logSection('PanelV2 Architecture compliance checks')

  const issues = []

  // Check if renderer contains toolbar
  const rendererDir = path.join(process.cwd(), 'src/components/panelv2/renderers')
  if (fs.existsSync(rendererDir)) {
    const renderers = fs.readdirSync(rendererDir)

    renderers.forEach(renderer => {
      const rendererPath = path.join(rendererDir, renderer)
      if (fs.statSync(rendererPath).isDirectory()) {
        const mainRenderer = path.join(
          rendererPath,
          `${renderer.charAt(0).toUpperCase() + renderer.slice(1)}Renderer.vue`
        )

        if (fs.existsSync(mainRenderer)) {
          const content = fs.readFileSync(mainRenderer, 'utf8')

          // Check whether toolbar related code is included
          if (content.includes('toolbar') && content.includes('<div') && content.includes('toolbar')) {
            issues.push(`${renderer} Renderers may contain built-in toolbars，Violation of the principle of separation`)
          }

          // Check if theme system is used
          if (!content.includes('useThemeStore') && content.includes('<style')) {
            issues.push(`${renderer} The renderer is not integrated with the theme system`)
          }

          // Check whether the icon is used correctly
          const iconImports = content.match(/import.*from.*@vicons\/ionicons5/g)
          if (iconImports) {
            iconImports.forEach(importLine => {
              if (!importLine.includes('Outline')) {
                issues.push(`${renderer} Renderer uses wrong icon naming convention`)
              }
            })
          }
        }
      }
    })
  }

  if (issues.length === 0) {
    logSuccess('PanelV2 Architecture compliance check passed')
    return true
  } else {
    issues.forEach(issue => logError(issue))
    return false
  }
}

/**
 * Check necessary documents
 */
function checkRequiredFiles() {
  logSection('Necessary document check')

  const requiredFiles = [
    { path: 'DEVELOPMENT_CHECKLIST.md', desc: 'development checklist' },
    { path: 'CLAUDE.md', desc: 'Claude Guidance document' },
    { path: 'src/components/panelv2/docs/RENDERER_DEVELOPMENT_GUIDE.md', desc: 'Renderer Development Guide' },
    { path: 'package.json', desc: 'Package Configuration file' }
  ]

  let allExist = true

  requiredFiles.forEach(file => {
    if (!checkFileExists(file.path, file.desc)) {
      allExist = false
    }
  })

  return allExist
}

/**
 * Code quality check
 */
function checkCodeQuality() {
  logSection('Code quality check')

  const checks = [
    {
      command: 'pnpm lint --max-warnings 0',
      description: 'ESLint Code specification check',
      required: true
    },
    {
      command: 'pnpm typecheck',
      description: 'TypeScript type checking',
      required: true
    }
  ]

  let allPassed = true

  checks.forEach(check => {
    const result = runCommand(check.command, check.description)

    if (result.success) {
      logSuccess(`${check.description} pass`)
    } else {
      logError(`${check.description} fail`)
      if (result.output) {
        log(result.output, 'red')
      }
      if (check.required) {
        allPassed = false
      }
    }
  })

  return allPassed
}

/**
 * CSS Grammar check
 */
function checkCSSIssues() {
  logSection('CSS Grammar check')

  const vueFiles = []

  function findVueFiles(dir) {
    const items = fs.readdirSync(dir)

    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findVueFiles(fullPath)
      } else if (item.endsWith('.vue')) {
        vueFiles.push(fullPath)
      }
    })
  }

  try {
    findVueFiles(path.join(process.cwd(), 'src'))
  } catch (error) {
    logWarning('Unable to scan Vue document')
    return true
  }

  let issues = []

  vueFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')

      // Check common CSS syntax error
      const cssIssues = [
        {
          pattern: /justify-between;/,
          fix: 'justify-content: space-between;',
          desc: 'justify-between should be justify-content: space-between'
        },
        { pattern: /align-center;/, fix: 'align-items: center;', desc: 'align-center should be align-items: center' },
        { pattern: /#[0-9a-fA-F]{3,6}/, fix: 'CSS variable', desc: 'Hardcoded colors found，应使用主题variable' }
      ]

      cssIssues.forEach(issue => {
        if (issue.pattern.test(content)) {
          issues.push(`${file}: ${issue.desc}`)
        }
      })
    } catch (error) {
      // Ignore unreadable files
    }
  })

  if (issues.length === 0) {
    logSuccess('CSS Grammar check passed')
    return true
  } else {
    issues.forEach(issue => logWarning(issue))
    return issues.length < 5 // A small number of issues do not prevent submission
  }
}

/**
 * Generate quality reports
 */
function generateQualityReport(results) {
  logSection('Quality inspection report')

  const passed = results.filter(r => r.passed).length
  const total = results.length
  const percentage = Math.round((passed / total) * 100)

  log(`\nCheck items: ${total}`)
  log(`by project: ${passed}`)
  log(`pass rate: ${percentage}%`)

  if (percentage >= 90) {
    logSuccess('Excellent code quality (Aclass)')
  } else if (percentage >= 80) {
    logInfo('Code quality is good (Bclass)')
  } else if (percentage >= 70) {
    logWarning('Code quality is average (Cclass)，Suggest improvements')
  } else {
    logError('Poor code quality (Dclass)，must be repaired')
  }

  return percentage >= 70
}

/**
 * main function
 */
function main() {
  log(`${colors.bold}${colors.magenta}🚀 ThingsPanel Develop QA tools`, 'magenta')
  log(`${colors.magenta}Ensure code meets project quality standards before submission\n`, 'magenta')

  const results = []

  // Perform various checks
  results.push({ name: 'Necessary document check', passed: checkRequiredFiles() })
  results.push({ name: 'PanelV2Architecture compliance', passed: checkPanelV2Compliance() })
  results.push({ name: 'Code quality check', passed: checkCodeQuality() })
  results.push({ name: 'CSSGrammar check', passed: checkCSSIssues() })

  // Generate report
  const overallPassed = generateQualityReport(results)

  // Output suggestions
  logSection('Improvement suggestions')

  if (overallPassed) {
    logSuccess('Congratulations！Code quality meets submission standards')
    log('\n📋 Please confirm before submitting：')
    log('1. Completed DEVELOPMENT_CHECKLIST.md All checks in')
    log('2. Functionality has been manually tested and works fine')
    log('3. Styles display normally under different themes')
    log('4. No errors and warnings in browser console')
  } else {
    logError('Code quality does not meet submission standards，Please fix the problem first')
    log('\n🔧 Repair suggestions：')
    log('1. run pnpm lint --fix Automatically fix specification issues')
    log('2. examine TypeScript Type error and fix')
    log('3. Ensure all components are integrated into the theme system')
    log('4. Remove toolbar implementation in renderer')
  }

  process.exit(overallPassed ? 0 : 1)
}

// run check
main()
