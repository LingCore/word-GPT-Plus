const writeToolDefinitions: Record<string, WordToolDefinition> = {
  insertText: {
    name: 'insertText',
    description: 'Insert text at the current cursor position in the Word document.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to insert' },
        location: {
          type: 'string',
          description: 'Where to insert: "Start", "End", "Before", "After", or "Replace"',
          enum: ['Start', 'End', 'Before', 'After', 'Replace'],
        },
      },
      required: ['text'],
    },
    execute: async (args) => {
      const { text, location = 'End' } = args as { text: string; location?: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.insertText(text, location as Word.InsertLocation)
        await context.sync()
        return `Successfully inserted text at ${location}`
      })
    },
  },

  replaceSelectedText: {
    name: 'replaceSelectedText',
    description: 'Replace the currently selected text with new text.',
    inputSchema: {
      type: 'object',
      properties: {
        newText: { type: 'string', description: 'The new text to replace the selection with' },
      },
      required: ['newText'],
    },
    execute: async (args) => {
      const { newText } = args as { newText: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.insertText(newText, 'Replace')
        await context.sync()
        return 'Successfully replaced selected text'
      })
    },
  },

  appendText: {
    name: 'appendText',
    description: 'Append text to the end of the document.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to append' },
      },
      required: ['text'],
    },
    execute: async (args) => {
      const { text } = args as { text: string }
      return Word.run(async context => {
        context.document.body.insertText(text, 'End')
        await context.sync()
        return 'Successfully appended text to document'
      })
    },
  },

  insertParagraph: {
    name: 'insertParagraph',
    description: 'Insert a new paragraph at the specified location.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The paragraph text' },
        location: {
          type: 'string',
          description:
            'Where to insert: "After" (after cursor/selection), "Before" (before cursor), "Start" (start of doc), or "End" (end of doc). Default is "After".',
          enum: ['After', 'Before', 'Start', 'End'],
        },
        style: {
          type: 'string',
          description: 'Optional Word built-in style: Normal, Heading1, Heading2, Heading3, Quote, etc.',
          enum: ['Normal', 'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Quote', 'IntenseQuote', 'Title', 'Subtitle'],
        },
      },
      required: ['text'],
    },
    execute: async (args) => {
      const { text, location = 'After', style } = args as { text: string; location?: string; style?: string }
      return Word.run(async context => {
        let paragraph
        if (location === 'Start' || location === 'End') {
          paragraph = context.document.body.insertParagraph(text, location)
        } else {
          const range = context.document.getSelection()
          paragraph = range.insertParagraph(text, location as 'After' | 'Before')
        }
        if (style) {
          paragraph.styleBuiltIn = style as Word.BuiltInStyleName
        }
        await context.sync()
        return `Successfully inserted paragraph at ${location}`
      })
    },
  },

  insertTable: {
    name: 'insertTable',
    description: 'Insert a table at the current cursor position.',
    inputSchema: {
      type: 'object',
      properties: {
        rows: { type: 'number', description: 'Number of rows' },
        columns: { type: 'number', description: 'Number of columns' },
        data: {
          type: 'array',
          description: 'Optional 2D array of cell values',
          items: { type: 'array', items: { type: 'string' } },
        },
      },
      required: ['rows', 'columns'],
    },
    execute: async (args) => {
      const { rows, columns, data } = args as { rows: number; columns: number; data?: string[][] }
      return Word.run(async context => {
        const range = context.document.getSelection()
        const tableData: string[][] =
          data ||
          Array(rows)
            .fill(null)
            .map(() => Array(columns).fill(''))
        const table = range.insertTable(rows, columns, 'After', tableData)
        table.styleBuiltIn = 'GridTable1Light'
        await context.sync()
        return `Successfully inserted ${rows}x${columns} table`
      })
    },
  },

  insertList: {
    name: 'insertList',
    description: 'Insert a bulleted or numbered list at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        items: { type: 'array', description: 'Array of list item texts', items: { type: 'string' } },
        listType: { type: 'string', description: 'Type of list: "bullet" or "number"', enum: ['bullet', 'number'] },
      },
      required: ['items', 'listType'],
    },
    execute: async (args) => {
      const { items, listType } = args as { items: string[]; listType: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        let insertionPoint = range

        const style = listType === 'bullet' ? 'ListBullet' : 'ListNumber'
        for (const item of items) {
          const paragraph = insertionPoint.insertParagraph(item, 'After')
          paragraph.styleBuiltIn = style as Word.BuiltInStyleName
          insertionPoint = paragraph.getRange('End')
        }
        await context.sync()
        return `Successfully inserted ${listType} list with ${items.length} items`
      })
    },
  },

  deleteText: {
    name: 'deleteText',
    description:
      'Delete the currently selected text or a specific range. If no text is selected, this will delete at the cursor position.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          description: 'Direction to delete if nothing selected: "Before" (backspace) or "After" (delete key)',
          enum: ['Before', 'After'],
        },
      },
      required: [],
    },
    execute: async (args) => {
      const { direction = 'After' } = args as { direction?: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.load('text')
        await context.sync()

        if (range.text && range.text.length > 0) {
          range.delete()
        } else {
          range.insertText('', direction === 'After' ? 'After' : 'Before')
        }
        await context.sync()
        return 'Successfully deleted text'
      })
    },
  },

  insertPageBreak: {
    name: 'insertPageBreak',
    description: 'Insert a page break at the current cursor position.',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Where to insert: "Before", "After", "Start", or "End"',
          enum: ['Before', 'After', 'Start', 'End'],
        },
      },
      required: [],
    },
    execute: async (args) => {
      const { location = 'After' } = args as { location?: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        const insertLoc = location === 'Start' || location === 'Before' ? 'Before' : 'After'
        range.insertBreak('Page', insertLoc)
        await context.sync()
        return `Successfully inserted page break ${location.toLowerCase()}`
      })
    },
  },

  insertImage: {
    name: 'insertImage',
    description:
      'Insert an image at the current cursor position. Accepts either a base64-encoded image string or a URL (http/https). If a URL is provided, the image will be fetched and converted automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Base64-encoded image data, or an http/https URL to fetch the image from',
        },
        width: { type: 'number', description: 'Optional width in points' },
        height: { type: 'number', description: 'Optional height in points' },
        location: {
          type: 'string',
          description: 'Where to insert: "Before", "After", "Start", "End", or "Replace"',
          enum: ['Before', 'After', 'Start', 'End', 'Replace'],
        },
      },
      required: ['image'],
    },
    execute: async (args) => {
      const { image, width, height, location = 'After' } = args as {
        image: string
        width?: number
        height?: number
        location?: string
      }

      let base64Data = image
      if (image.startsWith('http://') || image.startsWith('https://')) {
        const response = await fetch(image)
        if (!response.ok) return `Failed to fetch image: ${response.status} ${response.statusText}`
        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (const byte of bytes) binary += String.fromCharCode(byte)
        base64Data = btoa(binary)
      }

      return Word.run(async context => {
        const range = context.document.getSelection()
        const pic = range.insertInlinePictureFromBase64(base64Data, location as Word.InsertLocation)
        if (width) pic.width = width
        if (height) pic.height = height
        await context.sync()
        return `Successfully inserted image at ${location}`
      })
    },
  },

  insertBookmark: {
    name: 'insertBookmark',
    description: 'Insert a bookmark at the current selection to mark a location in the document.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the bookmark (must be unique, no spaces allowed)' },
      },
      required: ['name'],
    },
    execute: async (args) => {
      const { name } = args as { name: string }
      return Word.run(async context => {
        const range = context.document.getSelection()
        const bookmarkName = name.replace(/\s+/g, '_')
        const contentControl = range.insertContentControl()
        contentControl.tag = `bookmark_${bookmarkName}`
        contentControl.title = bookmarkName
        contentControl.appearance = 'Tags'
        await context.sync()
        return `Successfully inserted bookmark: ${bookmarkName}`
      })
    },
  },

  insertContentControl: {
    name: 'insertContentControl',
    description:
      'Insert a content control (a container for content) at the current selection. Useful for creating structured documents.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the content control' },
        tag: { type: 'string', description: 'Optional tag for programmatic identification' },
        appearance: {
          type: 'string',
          description: 'Visual appearance of the control',
          enum: ['BoundingBox', 'Tags', 'Hidden'],
        },
      },
      required: ['title'],
    },
    execute: async (args) => {
      const { title, tag, appearance = 'BoundingBox' } = args as {
        title: string
        tag?: string
        appearance?: string
      }
      return Word.run(async context => {
        const range = context.document.getSelection()
        const contentControl = range.insertContentControl()
        contentControl.title = title
        if (tag) contentControl.tag = tag
        contentControl.appearance = appearance as Word.ContentControlAppearance
        await context.sync()
        return `Successfully inserted content control: ${title}`
      })
    },
  },
}

export default writeToolDefinitions
