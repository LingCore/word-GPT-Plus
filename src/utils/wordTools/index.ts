import { tool } from '@langchain/core/tools'
import { z } from 'zod'

import formatToolDefinitions from './formatTools'
import navigationToolDefinitions from './navigationTools'
import readToolDefinitions from './readTools'
import writeToolDefinitions from './writeTools'

const wordToolDefinitions: Record<string, WordToolDefinition> = {
  ...readToolDefinitions,
  ...writeToolDefinitions,
  ...formatToolDefinitions,
  ...navigationToolDefinitions,
}

export type WordToolName =
  | 'getSelectedText'
  | 'getDocumentContent'
  | 'insertText'
  | 'replaceSelectedText'
  | 'appendText'
  | 'insertParagraph'
  | 'formatText'
  | 'searchAndReplace'
  | 'getDocumentProperties'
  | 'insertTable'
  | 'insertList'
  | 'deleteText'
  | 'clearFormatting'
  | 'setFontName'
  | 'insertPageBreak'
  | 'getRangeInfo'
  | 'selectText'
  | 'insertImage'
  | 'getTableInfo'
  | 'insertBookmark'
  | 'goToBookmark'
  | 'insertContentControl'
  | 'findText'

export function createWordTools(enabledTools?: WordToolName[]) {
  const tools = Object.entries(wordToolDefinitions)
    .filter(([name]) => !enabledTools || enabledTools.includes(name as WordToolName))
    .map(([, def]) => {
      const schemaObj: Record<string, z.ZodType> = {}

      for (const [propName, prop] of Object.entries(def.inputSchema.properties)) {
        let zodType: z.ZodType

        switch (prop.type) {
          case 'string':
            zodType = prop.enum ? z.enum(prop.enum as [string, ...string[]]) : z.string()
            break
          case 'number':
            zodType = z.number()
            break
          case 'boolean':
            zodType = z.boolean()
            break
          case 'array':
            zodType = z.array(z.unknown())
            break
          default:
            zodType = z.unknown()
        }

        if (prop.description) {
          zodType = zodType.describe(prop.description)
        }

        if (!def.inputSchema.required?.includes(propName)) {
          zodType = zodType.optional()
        }

        schemaObj[propName] = zodType
      }

      return tool(
        async (input: Record<string, unknown>) => {
          try {
            return await def.execute(input)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred'
            return `Error: ${message}`
          }
        },
        {
          name: def.name,
          description: def.description,
          schema: z.object(schemaObj),
        },
      )
    })

  return tools
}

export function getWordToolDefinitions(): WordToolDefinition[] {
  return Object.values(wordToolDefinitions)
}

export function getWordTool(name: WordToolName): WordToolDefinition | undefined {
  return wordToolDefinitions[name]
}

export { wordToolDefinitions }
