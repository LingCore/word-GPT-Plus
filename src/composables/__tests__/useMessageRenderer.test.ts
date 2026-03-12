import { describe, expect, it } from 'vitest'

import { cleanMessageText, getMessageText, splitThinkSegments } from '../useMessageRenderer'

const fakeMessage = (content: unknown) => ({ content }) as never

describe('getMessageText', () => {
  it('returns string content directly', () => {
    expect(getMessageText(fakeMessage('hello'))).toBe('hello')
  })

  it('joins array of strings', () => {
    expect(getMessageText(fakeMessage(['a', 'b', 'c']))).toBe('abc')
  })

  it('extracts text from object parts', () => {
    expect(getMessageText(fakeMessage([{ text: 'hello' }, { text: ' world' }]))).toBe('hello world')
  })

  it('extracts data from object parts', () => {
    expect(getMessageText(fakeMessage([{ data: 'some data' }]))).toBe('some data')
  })

  it('returns empty string for non-string, non-array content', () => {
    expect(getMessageText(fakeMessage(42))).toBe('')
  })

  it('returns empty string for null content', () => {
    expect(getMessageText(fakeMessage(null))).toBe('')
  })
})

describe('splitThinkSegments', () => {
  it('returns empty array for empty string', () => {
    expect(splitThinkSegments('')).toEqual([])
  })

  it('returns single text segment for plain text', () => {
    const result = splitThinkSegments('hello world')
    expect(result).toEqual([{ type: 'text', text: 'hello world' }])
  })

  it('splits think tags correctly', () => {
    const result = splitThinkSegments('before<think>thinking</think>after')
    expect(result).toEqual([
      { type: 'text', text: 'before' },
      { type: 'think', text: 'thinking' },
      { type: 'text', text: 'after' },
    ])
  })

  it('handles unclosed think tag', () => {
    const result = splitThinkSegments('before<think>still thinking')
    expect(result).toEqual([
      { type: 'text', text: 'before' },
      { type: 'think', text: 'still thinking' },
    ])
  })

  it('handles multiple think blocks', () => {
    const result = splitThinkSegments('<think>t1</think>mid<think>t2</think>end')
    expect(result).toEqual([
      { type: 'think', text: 't1' },
      { type: 'text', text: 'mid' },
      { type: 'think', text: 't2' },
      { type: 'text', text: 'end' },
    ])
  })

  it('filters empty segments', () => {
    const result = splitThinkSegments('<think></think>text')
    expect(result).toEqual([{ type: 'text', text: 'text' }])
  })
})

describe('cleanMessageText', () => {
  it('removes think tags and trims', () => {
    const msg = fakeMessage('Hello<think>internal</think> World')
    expect(cleanMessageText(msg)).toBe('Hello World')
  })

  it('returns plain text unchanged', () => {
    const msg = fakeMessage('just text')
    expect(cleanMessageText(msg)).toBe('just text')
  })

  it('handles multiple think blocks', () => {
    const msg = fakeMessage('<think>a</think>result<think>b</think>')
    expect(cleanMessageText(msg)).toBe('result')
  })
})
