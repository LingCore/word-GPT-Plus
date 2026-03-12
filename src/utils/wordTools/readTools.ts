const readToolDefinitions: Record<string, WordToolDefinition> = {
  getSelectedText: {
    name: 'getSelectedText',
    description:
      'Get the currently selected text in the Word document. Returns the selected text or empty string if nothing is selected.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.load('text')
        await context.sync()
        return range.text || ''
      })
    },
  },

  getDocumentContent: {
    name: 'getDocumentContent',
    description: 'Get the full content of the Word document body as plain text.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const body = context.document.body
        body.load('text')
        await context.sync()
        return body.text || ''
      })
    },
  },

  getDocumentProperties: {
    name: 'getDocumentProperties',
    description: 'Get document properties including paragraph count, word count, and character count.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const body = context.document.body
        body.load(['text'])
        const paragraphs = body.paragraphs
        paragraphs.load('items')
        await context.sync()

        const text = body.text || ''
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length

        return JSON.stringify(
          { paragraphCount: paragraphs.items.length, wordCount, characterCount: text.length },
          null,
          2,
        )
      })
    },
  },

  getRangeInfo: {
    name: 'getRangeInfo',
    description: 'Get detailed information about the current selection including text, formatting, and position.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.load([
          'text',
          'style',
          'font/name',
          'font/size',
          'font/bold',
          'font/italic',
          'font/underline',
          'font/color',
        ])
        await context.sync()

        return JSON.stringify(
          {
            text: range.text || '',
            style: range.style,
            font: {
              name: range.font.name,
              size: range.font.size,
              bold: range.font.bold,
              italic: range.font.italic,
              underline: range.font.underline,
              color: range.font.color,
            },
          },
          null,
          2,
        )
      })
    },
  },

  getTableInfo: {
    name: 'getTableInfo',
    description: 'Get information about tables in the document, including row and column counts.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const tables = context.document.body.tables
        tables.load(['items'])
        await context.sync()

        const tableInfos = []
        for (let i = 0; i < tables.items.length; i++) {
          const table = tables.items[i]
          table.load(['rowCount', 'values'])
          await context.sync()
          const columnCount = table.values && table.values[0] ? table.values[0].length : 0
          tableInfos.push({ index: i, rowCount: table.rowCount, columnCount })
        }

        return JSON.stringify({ tableCount: tables.items.length, tables: tableInfos }, null, 2)
      })
    },
  },

  findText: {
    name: 'findText',
    description: 'Find text in the document and return information about matches. Does not modify the document.',
    inputSchema: {
      type: 'object',
      properties: {
        searchText: { type: 'string', description: 'The text to search for' },
        matchCase: { type: 'boolean', description: 'Whether to match case (default: false)' },
        matchWholeWord: { type: 'boolean', description: 'Whether to match whole word only (default: false)' },
      },
      required: ['searchText'],
    },
    execute: async (args: Record<string, unknown>) => {
      const { searchText, matchCase = false, matchWholeWord = false } = args as {
        searchText: string
        matchCase?: boolean
        matchWholeWord?: boolean
      }
      return Word.run(async context => {
        const body = context.document.body
        const searchResults = body.search(searchText, { matchCase, matchWholeWord })
        searchResults.load(['items'])
        await context.sync()
        return JSON.stringify(
          { searchText, matchCount: searchResults.items.length, found: searchResults.items.length > 0 },
          null,
          2,
        )
      })
    },
  },
}

export default readToolDefinitions
