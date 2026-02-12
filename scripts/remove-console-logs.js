#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Extract all console.log The position and content of the statement
 * Support nested brackets、brackets in string、Complex situations such as template strings
 */
function findConsoleLogs(code) {
  const results = [];
  const regex = /console\.log\s*\(/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const start = match.index;
    let pos = match.index + match[0].length;
    let depth = 1;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    
    while (pos < code.length && depth > 0) {
      const char = code[pos];
      
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
        }
      }
      
      pos++;
    }
    
    if (depth === 0) {
      results.push({
        start,
        end: pos,
        content: code.substring(start, pos)
      });
    }
  }
  
  return results.reverse(); // Reverse an array，Delete from back to front to avoid index changes
}

/**
 * analyze console.log context，Determine how to delete safely
 */
function analyzeConsoleLogContext(code, start, end) {
  // Get console.log previous code snippet (most 300 characters)
  const beforeCode = code.substring(Math.max(0, start - 300), start);
  // Get console.log code snippet behind (most 100 characters)
  const afterCode = code.substring(end, Math.min(code.length, end + 100));
  
  // Check if there is try-catch-finally block
  const tryBlockPatterns = [
    /try\s*\{\s*$/,                     // try {
    /catch\s*\([^)]*\)\s*\{\s*$/,      // catch (error) {
    /finally\s*\{\s*$/,                 // finally {
  ];
  
  const isInTryBlock = tryBlockPatterns.some(pattern => 
    pattern.test(beforeCode.trim())
  );
  
  // Check if it is try-catch the only statement in the block
  const isTryCatchOnlyStatement = /try\s*\{\s*$/.test(beforeCode.trim()) && 
    /^\s*\}\s*catch/.test(afterCode);
  
  const isCatchOnlyStatement = /catch\s*\([^)]*\)\s*\{\s*$/.test(beforeCode.trim()) && 
    /^\s*\}/.test(afterCode);
  
  // Check if in arrow function - more precise match
  const arrowFunctionPatterns = [
    /=>\s*$/,                           // basic arrow functions: () =>
    /=>\s*console\.log/,                // Follow directlyconsole.log
    /"[^"]*=>\s*$/,                     // Vuein template: @click="() => 
    /'[^']*=>\s*$/,                     // Vuein template: @click='() => 
  ];
  
  const isInArrowFunction = arrowFunctionPatterns.some(pattern => 
    pattern.test(beforeCode)
  );
  
  // Check if there is Vue In the event handler of the template
  // more precise Vue Event handler detection
  const vueEventPattern = /@\w+\s*=\s*["'][^"']*=>\s*console\.log/;
  const isInVueEventHandler = vueEventPattern.test(beforeCode + 'console.log');
  
  // examine console.log Whether to end directly with quotation marks? (Vue template scene)
  const endsWithQuote = /^\s*["']/.test(afterCode);
  
  // More general arrow function detection - Check if there is one in front => 
  const hasArrowBefore = /=>\s*$/.test(beforeCode.trim());
  
  // Check if the entire line has only console.log
  const lines = code.split('\n');
  let lineStart = code.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = code.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = code.length;
  
  const currentLine = code.substring(lineStart, lineEnd);
  const beforeLogInLine = code.substring(lineStart, start);
  const afterLogInLine = code.substring(end, lineEnd);
  
  const lineWithoutLog = (beforeLogInLine + afterLogInLine).trim();
  const isFullLine = lineWithoutLog === '' || lineWithoutLog === ';';
  
  // Check if in object properties
  const isInObjectProperty = /:\s*$/.test(beforeCode.trim());
  
  // Check if it is in the parameters of the function call
  const isInFunctionCall = /\(\s*$/.test(beforeCode.trim()) && /^\s*[,)]/.test(afterCode);
  
  // Check if it is in comments
  const isInComment = checkIfInComment(code, start, end);
  
  return {
    isFullLine,
    isInArrowFunction,
    isInVueEventHandler,
    isInObjectProperty,
    isInFunctionCall,
    isInTryBlock,
    isTryCatchOnlyStatement,
    isCatchOnlyStatement,
    isInComment,
    endsWithQuote,
    hasArrowBefore,
    lineStart,
    lineEnd,
    beforeCode: beforeCode.slice(-80), // for debugging
    afterCode: afterCode.slice(0, 40)  // for debugging
  };
}

/**
 * examine console.log Is it in the annotation?
 */
function checkIfInComment(code, start, end) {
  // turn up console.log row
  const lineStart = code.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = code.indexOf('\n', start);
  const currentLine = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
  
  // Check if in single line comment // console.log(...)
  const singleLineCommentIndex = currentLine.indexOf('//');
  if (singleLineCommentIndex !== -1) {
    const consoleLogInLineIndex = start - lineStart;
    if (consoleLogInLineIndex > singleLineCommentIndex) {
      return true;
    }
  }
  
  // Check if in multiline comment /* console.log(...) */
  const beforeConsoleLog = code.substring(0, start);
  const afterConsoleLog = code.substring(end);
  
  // Find nearest forward /* and */
  const lastMultiCommentStart = beforeConsoleLog.lastIndexOf('/*');
  const lastMultiCommentEnd = beforeConsoleLog.lastIndexOf('*/');
  
  // Find the nearest backward */
  const nextMultiCommentEnd = afterConsoleLog.indexOf('*/');
  
  // If the latest /* in the recent */ after，And there are corresponding ones later */，Description in multi-line comments
  if (lastMultiCommentStart > lastMultiCommentEnd && nextMultiCommentEnd !== -1) {
    return true;
  }
  
  return false;
}

/**
 * Remove all console.log statement
 * Intelligent processing of various grammatical structures，Avoid breaking code
 */
function removeConsoleLogs(code) {
  const consoleLogs = findConsoleLogs(code);
  let result = code;
  
  consoleLogs.forEach(log => {
    const beforeLog = result.substring(0, log.start);
    const afterLog = result.substring(log.end);
    
    // Analyze context
    const context = analyzeConsoleLogContext(result, log.start, log.end);
    
    // if in comment，Skip and do not process
    if (context.isInComment) {
      return; // skip this console.log，No processing
    }
    
    if (context.isFullLine) {
      // The whole line only console.log，Delete entire line including newline character
      const lineStart = context.lineStart;
      const lineEnd = context.lineEnd + (context.lineEnd < result.length ? 1 : 0); // +1 for \n
      result = result.substring(0, lineStart) + result.substring(lineEnd);
    } else if (context.isTryCatchOnlyStatement) {
      // try There are only console.log，Need to keep syntax intact
      result = beforeLog + '// try block content removed' + afterLog;
    } else if (context.isCatchOnlyStatement) {
      // catch There are only console.log，Need to keep syntax intact
      result = beforeLog + '// catch block content removed' + afterLog;
    } else if (context.isInTryBlock) {
      // exist try-catch block，But not the only statement，Delete directly
      result = beforeLog + afterLog;
    } else if (context.hasArrowBefore && context.endsWithQuote) {
      // arrow function + Ending in quotation marks（MainlyVuetemplate）
      // () => console.log(...)" become () => {}"
      result = beforeLog + '{}' + afterLog;
    } else if (context.hasArrowBefore) {
      // ordinary arrow function，not in quotes
      result = beforeLog + 'void 0' + afterLog;
    } else if (context.isInVueEventHandler) {
      // Vue Other cases of template event handlers
      result = beforeLog + '{}' + afterLog;
    } else if (context.isInArrowFunction) {
      // A guide to other arrow function situations
      if (context.endsWithQuote) {
        result = beforeLog + '{}' + afterLog;
      } else {
        result = beforeLog + 'void 0' + afterLog;
      }
    } else if (context.isInObjectProperty) {
      // in object properties，Replace with undefined
      result = beforeLog + 'undefined' + afterLog;
    } else if (context.isInFunctionCall) {
      // in function call parameters，Replace with undefined
      result = beforeLog + 'undefined' + afterLog;
    } else {
      // Other situations，Delete directly
      result = beforeLog + afterLog;
    }
  });
  
  return result;
}

/**
 * Recursively retrieve all files in a specified directory
 */
function getAllFiles(dir, fileTypes = ['.js', '.ts', '.vue']) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // jump over node_modules、dist、.git etc. directory
        if (!['node_modules', 'dist', 'build', '.git', '.nuxt', '.next', 'coverage'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (fileTypes.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeConsoleLogs(originalContent);
    
    if (originalContent !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      
      // Statistics deleted console.log quantity
      const originalLogs = findConsoleLogs(originalContent);
      const remainingLogs = findConsoleLogs(cleanedContent);
      const removedCount = originalLogs.length - remainingLogs.length;
      
      return removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Processing file failed ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * main function
 */
function main() {
  const projectRoot = process.cwd();
  
  // Get all files that need to be processed
  const files = getAllFiles(projectRoot);
  
  let totalRemoved = 0;
  let processedFiles = 0;
  
  // Process each file
  files.forEach(filePath => {
    const removed = processFile(filePath);
    if (removed > 0) {
      totalRemoved += removed;
      processedFiles++;
    }
  });
  
  
  if (totalRemoved === 0) {
  }
}

// run script
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}

export {
  findConsoleLogs,
  removeConsoleLogs,
  processFile,
  getAllFiles
};