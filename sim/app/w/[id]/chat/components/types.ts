/**
 * Chat Component Types
 * This file contains type definitions used across the chat components.
 */

import { Agent, ChatMessage, MCPServer } from '@/app/w/agents/stores/types'

/**
 * MCP Trace Status
 */
export type MCPTraceStatus = 'running' | 'completed' | 'failed'

/**
 * MCP Trace
 * Represents a single trace of tool usage by the MCP server
 */
export interface MCPTrace {
  id: string
  tool: string
  status: MCPTraceStatus
  startTime: number
  endTime?: number
  result?: string
  error?: string
}

/**
 * File Upload Props
 */
export interface FileUploadProps {
  onUpload: (files: File[]) => void
}

/**
 * Chat Message Item Props
 */
export interface ChatMessageItemProps {
  message: ChatMessage
}

/**
 * MCP Trace Viewer Props
 */
export interface MCPTraceViewerProps {
  traces: MCPTrace[]
}

/**
 * MCP Server Integration Options
 */
export interface MCPIntegrationOptions {
  server: MCPServer
  systemPrompt?: string
  model?: string
}

/**
 * MCP Response
 */
export interface MCPResponse {
  traces: MCPTrace[]
  response: string
}

/**
 * Gemini-specific types
 */
export interface GeminiRequestMessage {
  role: string
  parts: {
    text: string
  }[]
}

export interface GeminiRequestConfig {
  contents: GeminiRequestMessage[]
  safetySettings?: any[]
  generationConfig?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
    finishReason: string
    safetyRatings: any[]
  }[]
} 