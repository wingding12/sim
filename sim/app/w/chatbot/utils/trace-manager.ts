import { useChatbotStore } from '../stores/chatbot-store'
import { TraceSpan } from '../stores/types'

/**
 * Trace Manager
 * 
 * Provides utilities for working with trace spans:
 * - Creating and managing trace spans
 * - Visualizing the agent's thinking process
 * - Tracking what MCP servers/tools are being used
 */
class TraceManager {
  /**
   * Get all active trace spans
   */
  getActiveTraceSpans(): TraceSpan[] {
    return useChatbotStore.getState().activeTraceSpans
  }
  
  /**
   * Get trace spans for a specific trace
   */
  getTraceSpans(traceId: string): TraceSpan[] {
    return this.getActiveTraceSpans().filter(span => span.traceId === traceId)
  }
  
  /**
   * Get all trace IDs
   */
  getTraceIds(): string[] {
    const spans = this.getActiveTraceSpans()
    return [...new Set(spans.map(span => span.traceId))]
  }
  
  /**
   * Get the latest trace ID
   */
  getLatestTraceId(): string | null {
    const traceIds = this.getTraceIds()
    if (traceIds.length === 0) return null
    
    // Find the trace with the most recent span
    const latestTrace = traceIds.reduce((latest, traceId) => {
      const spans = this.getTraceSpans(traceId)
      const latestSpanTime = Math.max(...spans.map(span => span.startTime))
      
      if (!latest || latestSpanTime > latest.time) {
        return { id: traceId, time: latestSpanTime }
      }
      
      return latest
    }, null as { id: string, time: number } | null)
    
    return latestTrace?.id || null
  }
  
  /**
   * Get active MCP servers
   */
  getActiveMCPServers() {
    return useChatbotStore.getState().activeMCPServers
  }
  
  /**
   * Clear all trace spans
   */
  clearTraceSpans() {
    useChatbotStore.getState().clearTraceSpans()
  }
}

// Singleton instance
let traceManager: TraceManager | null = null

/**
 * Get the trace manager instance
 */
export function getTraceManager(): TraceManager {
  if (!traceManager) {
    traceManager = new TraceManager()
  }
  
  return traceManager
} 