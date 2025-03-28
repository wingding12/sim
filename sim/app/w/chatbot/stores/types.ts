import { Agent as AgentBase, MCPServer as MCPServerBase } from '@/app/w/agents/stores/types'

/**
 * Chat Message represents a single message in the chat interface
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  fileUrl: string | null
  fileType?: string
}

/**
 * Trace Span represents a unit of work performed by the agent
 * Used for observability and visualizing the agent's thinking process
 */
export interface TraceSpan {
  id: string
  traceId: string
  name: string
  startTime: number
  endTime: number | null
  status: 'in_progress' | 'completed' | 'failed'
  details: Record<string, any>
}

/**
 * Active MCP Server extends the base MCPServer with runtime information
 */
export interface ActiveMCPServer extends MCPServerBase {
  spanId: string
  traceId: string
}

/**
 * Re-export the Agent type from the agent store
 */
export type Agent = AgentBase

/**
 * Re-export the MCPServer type from the agent store
 */
export type MCPServer = MCPServerBase

/**
 * Chatbot State interface for the Zustand store
 */
export interface ChatbotState {
  // Chat state
  messages: ChatMessage[]
  isProcessing: boolean
  error: string | null
  
  // Agent state
  currentAgent: Agent | null
  
  // MCP state
  activeMCPServers: ActiveMCPServer[]
  activeTraceSpans: TraceSpan[]
  
  // Actions
  sendMessage: (content: string, file: File | null) => Promise<void>
  getAvailableAgents: () => Agent[]
  setCurrentAgent: (agent: Agent | null) => void
  clearChat: () => void
  clearTraceSpans: () => void
} 