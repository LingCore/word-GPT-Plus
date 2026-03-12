import type { Message } from '@langchain/core/messages'

const THINK_TAG = '<think>'
const THINK_TAG_END = '</think>'

export interface RenderSegment {
  type: 'text' | 'think'
  text: string
}

export function getMessageText(msg: Message): string {
  const content = (msg as unknown as { content: unknown }).content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: unknown) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part && typeof (part as { text: string }).text === 'string')
          return (part as { text: string }).text
        if (part && typeof part === 'object' && 'data' in part && typeof (part as { data: string }).data === 'string')
          return (part as { data: string }).data
        return ''
      })
      .join('')
  }
  return ''
}

export function cleanMessageText(msg: Message): string {
  const raw = getMessageText(msg)
  const regex = new RegExp(`${THINK_TAG}[\\s\\S]*?${THINK_TAG_END}`, 'g')
  return raw.replace(regex, '').trim()
}

export function splitThinkSegments(text: string): RenderSegment[] {
  if (!text) return []

  const segments: RenderSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const start = text.indexOf(THINK_TAG, cursor)
    if (start === -1) {
      segments.push({ type: 'text', text: text.slice(cursor) })
      break
    }

    if (start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, start) })
    }

    const end = text.indexOf(THINK_TAG_END, start + THINK_TAG.length)
    if (end === -1) {
      segments.push({ type: 'think', text: text.slice(start + THINK_TAG.length) })
      break
    }

    segments.push({ type: 'think', text: text.slice(start + THINK_TAG.length, end) })
    cursor = end + THINK_TAG_END.length
  }

  return segments.filter(segment => segment.text)
}

export function renderSegments(msg: Message): RenderSegment[] {
  return splitThinkSegments(getMessageText(msg))
}
