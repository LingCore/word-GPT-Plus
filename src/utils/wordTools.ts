/**
 * Re-exports from the new modular wordTools directory.
 * Kept for backward compatibility — all imports from '@/utils/wordTools' continue to work.
 */
export {
  createWordTools,
  getWordTool,
  getWordToolDefinitions,
  wordToolDefinitions,
  type WordToolName,
} from './wordTools/index'
