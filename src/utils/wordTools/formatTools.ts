const formatToolDefinitions: Record<string, WordToolDefinition> = {
  formatText: {
    name: 'formatText',
    description: 'Apply formatting to the currently selected text.',
    inputSchema: {
      type: 'object',
      properties: {
        bold: { type: 'boolean', description: 'Make text bold' },
        italic: { type: 'boolean', description: 'Make text italic' },
        underline: { type: 'boolean', description: 'Underline text' },
        fontSize: { type: 'number', description: 'Font size in points' },
        fontColor: { type: 'string', description: 'Font color as hex (e.g., "#FF0000" for red)' },
        highlightColor: {
          type: 'string',
          description:
            'Highlight color: Yellow, Green, Cyan, Pink, Blue, Red, DarkBlue, Teal, Lime, Purple, Orange, etc.',
        },
      },
      required: [],
    },
    execute: async (args) => {
      const { bold, italic, underline, fontSize, fontColor, highlightColor } = args as {
        bold?: boolean
        italic?: boolean
        underline?: boolean
        fontSize?: number
        fontColor?: string
        highlightColor?: string
      }
      return Word.run(async context => {
        const range = context.document.getSelection()
        if (bold !== undefined) range.font.bold = bold
        if (italic !== undefined) range.font.italic = italic
        if (underline !== undefined) range.font.underline = underline ? 'Single' : 'None'
        if (fontSize !== undefined) range.font.size = fontSize
        if (fontColor !== undefined) range.font.color = fontColor
        if (highlightColor !== undefined) range.font.highlightColor = highlightColor
        await context.sync()
        return 'Successfully applied formatting'
      })
    },
  },

  searchAndReplace: {
    name: 'searchAndReplace',
    description: 'Search for text in the document and replace it with new text.',
    inputSchema: {
      type: 'object',
      properties: {
        searchText: { type: 'string', description: 'The text to search for' },
        replaceText: { type: 'string', description: 'The text to replace with' },
        matchCase: { type: 'boolean', description: 'Whether to match case (default: false)' },
        matchWholeWord: { type: 'boolean', description: 'Whether to match whole word only (default: false)' },
      },
      required: ['searchText', 'replaceText'],
    },
    execute: async (args) => {
      const { searchText, replaceText, matchCase = false, matchWholeWord = false } = args as {
        searchText: string
        replaceText: string
        matchCase?: boolean
        matchWholeWord?: boolean
      }
      return Word.run(async context => {
        const body = context.document.body
        const searchResults = body.search(searchText, { matchCase, matchWholeWord })
        searchResults.load('items')
        await context.sync()

        const count = searchResults.items.length
        for (const item of searchResults.items) {
          item.insertText(replaceText, 'Replace')
        }
        await context.sync()
        return `Replaced ${count} occurrence(s) of "${searchText}" with "${replaceText}"`
      })
    },
  },

  clearFormatting: {
    name: 'clearFormatting',
    description: 'Clear all formatting from the selected text, returning it to default style.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.font.bold = false
        range.font.italic = false
        range.font.underline = 'None'
        range.styleBuiltIn = 'Normal'
        await context.sync()
        return 'Successfully cleared formatting'
      })
    },
  },

  setFontName: {
    name: 'setFontName',
    description: 'Set the font name/family for the selected text (e.g., Arial, Times New Roman, Calibri).',
    inputSchema: {
      type: 'object',
      properties: {
        fontName: {
          type: 'string',
          description: 'The font name to apply (e.g., "Arial", "Times New Roman", "Calibri", "Consolas")',
        },
      },
      required: ['fontName'],
    },
    execute: async (args) => {
      const { fontName } = args as { fontName: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.font.name = fontName
        await context.sync()
        return `Successfully set font to ${fontName}`
      })
    },
  },
}

export default formatToolDefinitions
