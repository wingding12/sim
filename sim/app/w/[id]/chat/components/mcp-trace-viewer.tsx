'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MCPTraceViewerProps } from './types'

export function MCPTraceViewer({ traces }: MCPTraceViewerProps) {
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({})
  
  // Update active tools when traces change
  useEffect(() => {
    const toolsStatus: Record<string, boolean> = {}
    
    traces.forEach(trace => {
      // A tool is active if any trace for that tool is running
      if (trace.status === 'running') {
        toolsStatus[trace.tool] = true
      } else if (!toolsStatus[trace.tool]) {
        // Only mark as inactive if no other trace for this tool is running
        toolsStatus[trace.tool] = false
      }
    })
    
    setActiveTools(toolsStatus)
  }, [traces])
  
  // Get unique tools
  const uniqueTools = Array.from(new Set(traces.map(t => t.tool)))
  
  // Get formatted duration
  const formatDuration = (start: number, end?: number) => {
    if (!end) return 'Running...'
    const duration = end - start
    return `${(duration / 1000).toFixed(2)}s`
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Active MCP Tools</h3>
        <div className="flex flex-wrap gap-2">
          {uniqueTools.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tools used yet</div>
          ) : (
            uniqueTools.map(tool => (
              <div 
                key={tool}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activeTools[tool] 
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tool}
                {activeTools[tool] && (
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-medium mb-2">Trace Logs</h3>
            {traces.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No traces available. Start a conversation to see MCP traces.
              </div>
            ) : (
              <div className="space-y-2">
                {[...traces].reverse().map(trace => (
                  <div key={trace.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{trace.tool}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(trace.startTime, trace.endTime)}
                      </div>
                    </div>
                    <div className={`text-sm ${
                      trace.status === 'failed' 
                        ? 'text-destructive' 
                        : trace.status === 'running' 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                    }`}>
                      Status: {trace.status}
                    </div>
                    {trace.result && (
                      <div className="mt-2 text-sm border-t pt-2">
                        <div className="font-medium mb-1">Result:</div>
                        <div className="text-xs whitespace-pre-wrap overflow-auto max-h-24">{trace.result}</div>
                      </div>
                    )}
                    {trace.error && (
                      <div className="mt-2 text-sm border-t pt-2 text-destructive">
                        <div className="font-medium mb-1">Error:</div>
                        <div className="text-xs whitespace-pre-wrap overflow-auto max-h-24">{trace.error}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
} 