/**
 * Script Template Manager
 * Creation of management script templates、renew、Deletion and code generation
 */

import type { IScriptTemplateManager, ScriptTemplate, ScriptTemplateParameter, TemplateCategory } from '@/core/script-engine/types'
import { nanoid } from 'nanoid'

/**
 * Script template manager implementation class
 */
export class ScriptTemplateManager implements IScriptTemplateManager {
  private templates: Map<string, ScriptTemplate>

  constructor() {
    this.templates = new Map()
    this.initializeSystemTemplates()
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ScriptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): ScriptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category)
  }

  /**
   * Get the specified template
   */
  getTemplate(id: string): ScriptTemplate | null {
    return this.templates.get(id) || null
  }

  /**
   * Create template
   */
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate {
    const now = Date.now()
    const newTemplate: ScriptTemplate = {
      ...template,
      id: nanoid(),
      createdAt: now,
      updatedAt: now
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<ScriptTemplate>): boolean {
    const template = this.templates.get(id)
    if (!template) {
      return false
    }

    const updatedTemplate: ScriptTemplate = {
      ...template,
      ...updates,
      id, // make sureIDnot be modified
      updatedAt: Date.now()
    }

    this.templates.set(id, updatedTemplate)
    return true
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id)
    if (!template || template.isSystem) {
      return false // Cannot delete system template
    }

    return this.templates.delete(id)
  }

  /**
   * Generate code based on template
   */
  generateCode(templateId: string, parameters: Record<string, any>): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template does not exist: ${templateId}`)
    }

    let code = template.code

    // Replace template parameters
    template.parameters.forEach(param => {
      const value = parameters[param.name]
      const actualValue = value !== undefined ? value : param.defaultValue

      if (param.required && actualValue === undefined) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }

      // Validation parameters
      this.validateParameter(param, actualValue)

      // Replace placeholders in code
      const placeholder = new RegExp(`\\{\\{${param.name}\\}\\}`, 'g')
      const replacement = this.formatParameterValue(actualValue, param.type)
      code = code.replace(placeholder, replacement)
    })

    return code
  }

  /**
   * Validate parameter values
   */
  private validateParameter(param: ScriptTemplateParameter, value: any): void {
    if (value === undefined && !param.required) {
      return
    }

    // type checking
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`parameter ${param.name} Must be of type string`)
        }
        break
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`parameter ${param.name} Must be of numeric type`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`parameter ${param.name} Must be of type boolean`)
        }
        break
      case 'object':
        if (typeof value !== 'object' || value === null) {
          throw new Error(`parameter ${param.name} Must be of object type`)
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`parameter ${param.name} Must be an array type`)
        }
        break
    }

    // Validation rule checks
    if (param.validation) {
      const validation = param.validation

      // Numeric range check
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          throw new Error(`parameter ${param.name} cannot be less than ${validation.min}`)
        }
        if (validation.max !== undefined && value > validation.max) {
          throw new Error(`parameter ${param.name} cannot be greater than ${validation.max}`)
        }
      }

      // String length check
      if (typeof value === 'string') {
        if (validation.min !== undefined && value.length < validation.min) {
          throw new Error(`parameter ${param.name} The length cannot be less than ${validation.min}`)
        }
        if (validation.max !== undefined && value.length > validation.max) {
          throw new Error(`parameter ${param.name} The length cannot be greater than ${validation.max}`)
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`parameter ${param.name} Incorrect format`)
        }
      }

      // Enumeration value checking
      if (validation.enum && !validation.enum.includes(value)) {
        throw new Error(`parameter ${param.name} Must be one of the following values: ${validation.enum.join(', ')}`)
      }
    }
  }

  /**
   * Format parameter value
   */
  private formatParameterValue(value: any, type: ScriptTemplateParameter['type']): string {
    switch (type) {
      case 'string':
        return JSON.stringify(value)
      case 'number':
      case 'boolean':
        return String(value)
      case 'object':
      case 'array':
        return JSON.stringify(value)
      case 'function':
        return typeof value === 'function' ? value.toString() : String(value)
      default:
        return JSON.stringify(value)
    }
  }

  /**
   * Initialize system template
   */
  private initializeSystemTemplates(): void {
    // Data generation template
    this.createSystemTemplate({
      name: 'random data generator',
      category: 'data-generation',
      description: 'Generate a specified amount of random data',
      code: `
// Generate random data
const count = {{count}};
const fields = {{fields}};

const result = [];
for (let i = 0; i < count; i++) {
  const item = {};
  fields.forEach(field => {
    switch (field.type) {
      case 'number':
        item[field.name] = _utils.mockData.randomNumber(field.min || 0, field.max || 100);
        break;
      case 'string':
        item[field.name] = _utils.mockData.randomString(field.length || 10);
        break;
      case 'boolean':
        item[field.name] = _utils.mockData.randomBoolean();
        break;
      case 'date':
        item[field.name] = _utils.mockData.randomDate();
        break;
      default:
        item[field.name] = null;
    }
  });
  result.push(item);
}

return result;
      `,
      parameters: [
        {
          name: 'count',
          type: 'number',
          description: 'The amount of data generated',
          required: true,
          defaultValue: 10,
          validation: { min: 1, max: 1000 }
        },
        {
          name: 'fields',
          type: 'array',
          description: 'Field configuration array',
          required: true,
          defaultValue: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string', length: 8 },
            { name: 'active', type: 'boolean' }
          ]
        }
      ]
    })

    // Data processing template
    this.createSystemTemplate({
      name: 'data aggregator',
      category: 'data-processing',
      description: 'Group and aggregate data',
      code: `
// Data aggregation processing
const data = {{data}};
const groupByField = {{groupByField}};
const aggregateField = {{aggregateField}};
const operation = {{operation}};

const grouped = _utils.dataUtils.groupBy(data, groupByField);
const result = {};

Object.keys(grouped).forEach(key => {
  const group = grouped[key];
  switch (operation) {
    case 'sum':
      result[key] = group.reduce((sum, item) => sum + (item[aggregateField] || 0), 0);
      break;
    case 'avg':
      result[key] = group.reduce((sum, item) => sum + (item[aggregateField] || 0), 0) / group.length;
      break;
    case 'count':
      result[key] = group.length;
      break;
    case 'max':
      result[key] = Math.max(...group.map(item => item[aggregateField] || 0));
      break;
    case 'min':
      result[key] = Math.min(...group.map(item => item[aggregateField] || 0));
      break;
    default:
      result[key] = group;
  }
});

return result;
      `,
      parameters: [
        {
          name: 'data',
          type: 'array',
          description: 'array of data to process',
          required: true,
          defaultValue: []
        },
        {
          name: 'groupByField',
          type: 'string',
          description: 'Grouping field name',
          required: true,
          defaultValue: 'category'
        },
        {
          name: 'aggregateField',
          type: 'string',
          description: 'Aggregation field name',
          required: true,
          defaultValue: 'value'
        },
        {
          name: 'operation',
          type: 'string',
          description: 'Aggregation operation type',
          required: true,
          defaultValue: 'sum',
          validation: { enum: ['sum', 'avg', 'count', 'max', 'min'] }
        }
      ]
    })

    // Time series data template
    this.createSystemTemplate({
      name: 'Time series data generator',
      category: 'time-series',
      description: 'Generate time series data',
      code: `
// Generate time series data
const startDate = new Date({{startDate}});
const endDate = new Date({{endDate}});
const interval = {{interval}}; // minute
const baseValue = {{baseValue}};
const variance = {{variance}};

const result = [];
let currentDate = new Date(startDate);

while (currentDate <= endDate) {
  const value = baseValue + (_utils.mockData.randomNumber(-variance, variance));
  result.push({
    timestamp: currentDate.toISOString(),
    value: Math.round(value * 100) / 100,
    date: _utils.timeUtils.format(currentDate)
  });
  
  currentDate = new Date(currentDate.getTime() + interval * 60 * 1000);
}

return result;
      `,
      parameters: [
        {
          name: 'startDate',
          type: 'string',
          description: 'start date (ISOFormat)',
          required: true,
          defaultValue: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'endDate',
          type: 'string',
          description: 'end date (ISOFormat)',
          required: true,
          defaultValue: new Date().toISOString()
        },
        {
          name: 'interval',
          type: 'number',
          description: 'time interval（minute）',
          required: true,
          defaultValue: 30,
          validation: { min: 1, max: 1440 }
        },
        {
          name: 'baseValue',
          type: 'number',
          description: 'base value',
          required: true,
          defaultValue: 50
        },
        {
          name: 'variance',
          type: 'number',
          description: 'Range of change',
          required: true,
          defaultValue: 10,
          validation: { min: 0 }
        }
      ]
    })

    // API Integrated template
    this.createSystemTemplate({
      name: 'HTTP API caller',
      category: 'api-integration',
      description: 'callHTTP APIand handle the response',
      code: `
// HTTP API call
const url = {{url}};
const method = {{method}};
const headers = {{headers}};
const body = {{body}};

try {
  const requestOptions = {
    method: method,
    headers: headers
  };
  
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  
  const data = await response.json();
  
  return {
    success: true,
    status: response.status,
    data: data,
    timestamp: new Date().toISOString()
  };
} catch (error) {
  return {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  };
}
      `,
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'API URLaddress',
          required: true,
          defaultValue: 'https://api.example.com/data'
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTPmethod',
          required: true,
          defaultValue: 'GET',
          validation: { enum: ['GET', 'POST', 'PUT', 'DELETE'] }
        },
        {
          name: 'headers',
          type: 'object',
          description: 'Request header',
          required: false,
          defaultValue: { 'Content-Type': 'application/json' }
        },
        {
          name: 'body',
          type: 'object',
          description: 'Request body',
          required: false,
          defaultValue: null
        }
      ]
    })
  }

  /**
   * Create system template
   */
  private createSystemTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): void {
    const now = Date.now()
    const systemTemplate: ScriptTemplate = {
      ...template,
      id: nanoid(),
      isSystem: true,
      createdAt: now,
      updatedAt: now
    }

    this.templates.set(systemTemplate.id, systemTemplate)
  }
}
