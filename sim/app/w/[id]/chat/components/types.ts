/**
 * Type definitions for MCP chat interface components
 */

import { ChatMessage } from '@/app/w/agents/stores/types'

export interface MCPTrace {
  id: string
  tool: string
  status: 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  result?: string
  error?: string
}

export interface ChatMessageItemProps {
  message: ChatMessage
}

export interface MCPTraceViewerProps {
  traces: MCPTrace[]
}

export interface FileUploadProps {
  onUpload: (files: File[]) => void
} 