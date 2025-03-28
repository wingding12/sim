import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  ChatMessage, 
  MCPServer, 
  TraceSpan,
  ChatbotState,
  Agent
} from './types'
import { useAgentStore } from '@/app/w/agents/stores/store'

/**
 * Chatbot Store
 * 
 * Manages the state for the chatbot interface:
 * - Chat messages and history
 * - Active MCP servers and their status
 * - Agent configuration and selection
 * - File attachments and multimodal content
 * - Trace spans for observability
 */
export const useChatbotStore = create<ChatbotState>()(
  devtools(
    (set, get) => ({
      // Chat state
      messages: [],
      isProcessing: false,
      error: null,
      
      // Agent state
      currentAgent: null,
      
      // MCP server state
      activeMCPServers: [],
      activeTraceSpans: [],
      
      // Actions
      sendMessage: async (content: string, file: File | null = null) => {
        try {
          const { currentAgent } = get()
          
          if (!currentAgent) {
            throw new Error('No agent selected. Please select an agent before sending a message.')
          }
          
          set({ isProcessing: true, error: null })
          
          // Create user message
          const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
            fileUrl: null,
          }
          
          // If there's a file attachment, process it
          if (file) {
            // In a real implementation, this would upload the file to a server
            // For now, we'll just create an object URL
            userMessage.fileUrl = URL.createObjectURL(file)
            userMessage.fileType = file.type
          }
          
          // Add message to state
          set((state) => ({
            messages: [...state.messages, userMessage],
          }))
          
          // Start a new trace for this interaction
          const traceId = crypto.randomUUID()
          
          // Record the start of processing
          const processingSpan: TraceSpan = {
            id: crypto.randomUUID(),
            traceId,
            name: 'processing',
            startTime: Date.now(),
            endTime: null,
            status: 'in_progress',
            details: { message: 'Processing user message' },
          }
          
          set((state) => ({
            activeTraceSpans: [...state.activeTraceSpans, processingSpan],
          }))
          
          // Simulate MCP server activity
          // In a real implementation, this would call actual MCP servers
          const mcpServerIds = currentAgent.mcpServer ? [currentAgent.mcpServer.id] : []
          
          // For demonstration, we'll simulate using MCP servers
          const serverActivities = mcpServerIds.map((serverId) => {
            const server = useAgentStore.getState().mcpServers.find(s => s.id === serverId)
            
            if (!server) return null
            
            // Create trace span for MCP server activity
            const mcpSpan: TraceSpan = {
              id: crypto.randomUUID(),
              traceId,
              name: `mcp-${server.name}`,
              startTime: Date.now() + 100, // Slight delay
              endTime: null,
              status: 'in_progress',
              details: { 
                server: server.name,
                url: server.url,
                action: 'Processing request'
              },
            }
            
            // Update active MCP servers
            set((state) => ({
              activeMCPServers: [...state.activeMCPServers, {
                ...server,
                spanId: mcpSpan.id,
                traceId: mcpSpan.traceId,
              }],
              activeTraceSpans: [...state.activeTraceSpans, mcpSpan],
            }))
            
            return { server, spanId: mcpSpan.id }
          }).filter(Boolean)
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Complete MCP server activities
          serverActivities.forEach(activity => {
            if (!activity) return
            
            // Update trace span to completed
            set((state) => ({
              activeTraceSpans: state.activeTraceSpans.map(span => {
                if (span.id === activity.spanId) {
                  return {
                    ...span,
                    endTime: Date.now(),
                    status: 'completed',
                    details: {
                      ...span.details,
                      action: 'Request processed successfully'
                    }
                  }
                }
                return span
              }),
              activeMCPServers: state.activeMCPServers.filter(s => s.spanId !== activity.spanId)
            }))
          })
          
          // Generate assistant response
          // In a real implementation, this would come from the MCP server
          const assistantContent = `I've processed your message${file ? ' and the attached image' : ''}. 
          
This is a simulated response from the agent "${currentAgent.name}".

In a real implementation, this would use the MCP server to generate a response based on your input.`
          
          // Create assistant message
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date().toISOString(),
            fileUrl: null,
          }
          
          // Complete processing span
          set((state) => ({
            activeTraceSpans: state.activeTraceSpans.map(span => {
              if (span.id === processingSpan.id) {
                return {
                  ...span,
                  endTime: Date.now(),
                  status: 'completed',
                  details: {
                    ...span.details,
                    action: 'User message processed successfully'
                  }
                }
              }
              return span
            }),
          }))
          
          // Add assistant message to state
          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }))
          
        } catch (error) {
          console.error('Failed to send message:', error)
          
          set({
            error: error instanceof Error ? error.message : 'Failed to send message',
            activeTraceSpans: get().activeTraceSpans.map(span => {
              if (span.status === 'in_progress') {
                return {
                  ...span,
                  endTime: Date.now(),
                  status: 'failed',
                  details: {
                    ...span.details,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                }
              }
              return span
            }),
            activeMCPServers: []
          })
        } finally {
          set({ isProcessing: false })
        }
      },
      
      // Get available agents from the agent store
      getAvailableAgents: () => {
        return useAgentStore.getState().agents
      },
      
      // Set the current agent
      setCurrentAgent: (agent: Agent | null) => {
        set({ currentAgent: agent })
      },
      
      // Clear chat history
      clearChat: () => set({ messages: [], error: null }),
      
      // Clear active trace spans
      clearTraceSpans: () => set({ activeTraceSpans: [] }),
    }),
    { name: 'chatbot-store' }
  )
) 