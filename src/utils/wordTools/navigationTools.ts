const navigationToolDefinitions: Record<string, WordToolDefinition> = {
  selectText: {
    name: 'selectText',
    description: 'Select all text in the document or specific location.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', description: 'What to select: "All" for entire document', enum: ['All'] },
      },
      required: ['scope'],
    },
    execute: async (args) => {
      const { scope } = args as { scope: string }
      return Word.run(async context => {
        if (scope === 'All') {
          context.document.body.select()
          await context.sync()
          return 'Successfully selected all text'
        }
        return 'Invalid scope'
      })
    },
  },

  goToBookmark: {
    name: 'goToBookmark',
    description: 'Navigate to a previously created bookmark in the document.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the bookmark to navigate to' },
      },
      required: ['name'],
    },
    execute: async (args) => {
      const { name } = args as { name: string }
      return Word.run(async context => {
        const bookmarkName = name.replace(/\s+/g, '_')
        const contentControls = context.document.contentControls
        contentControls.load(['items'])
        await context.sync()

        for (const cc of contentControls.items) {
          cc.load(['tag', 'title'])
        }
        await context.sync()

        for (const cc of contentControls.items) {
          if (cc.tag === `bookmark_${bookmarkName}` || cc.title === bookmarkName) {
            cc.select()
            await context.sync()
            return `Successfully navigated to bookmark: ${bookmarkName}`
          }
        }
        return `Bookmark not found: ${bookmarkName}`
      })
    },
  },
}

export default navigationToolDefinitions
