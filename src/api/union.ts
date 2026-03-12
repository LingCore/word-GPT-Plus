/**
 * Re-exports from the new modular API layer.
 * Kept for backward compatibility during migration.
 */
export { getAgentResponse } from './agentService'
export { getChatResponse } from './chatService'
export { createModel, getRegisteredProviders } from './providerRegistry'
