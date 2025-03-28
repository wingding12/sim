'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Server, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActiveMCPServer, TraceSpan } from '../stores/types'
import { getTraceManager } from '../utils/trace-manager'

interface ActivityPanelProps {
  activeMCPServers: ActiveMCPServer[]
  traceManager: ReturnType<typeof getTraceManager>
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ 
  activeMCPServers,
  traceManager 
}) => {
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null)
  const [traceSpans, setTraceSpans] = useState<TraceSpan[]>([])
  
  // Update active trace ID when traces change
  useEffect(() => {
    const latestTraceId = traceManager.getLatestTraceId()
    setActiveTraceId(latestTraceId)
  }, [traceManager])
  
  // Update trace spans when active trace ID changes
  useEffect(() => {
    if (activeTraceId) {
      const spans = traceManager.getTraceSpans(activeTraceId)
      setTraceSpans(spans)
    } else {
      setTraceSpans([])
    }
    
    // Set up interval to refresh spans
    const interval = setInterval(() => {
      if (activeTraceId) {
        const spans = traceManager.getTraceSpans(activeTraceId)
        setTraceSpans(spans)
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [activeTraceId, traceManager])
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
    }
  }
  
  const calculateDuration = (startTime: number, endTime: number | null) => {
    if (!endTime) return 'In progress'
    
    const duration = endTime - startTime
    if (duration < 1000) {
      return `${duration}ms`
    }
    
    return `${(duration / 1000).toFixed(2)}s`
  }
  
  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pb-4">
      <Tabs defaultValue="running" className="flex-1">
        <TabsList className="mb-2">
          <TabsTrigger value="running">Running Activity</TabsTrigger>
          <TabsTrigger value="trace">Trace Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="running" className="flex-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active MCP Servers</CardTitle>
              <CardDescription>
                MCP servers currently processing requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMCPServers.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No active MCP servers at the moment
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMCPServers.map((server) => (
                    <div
                      key={server.spanId}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{server.name}</p>
                          <p className="text-xs text-muted-foreground">{server.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Processing</span>
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trace" className="flex-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trace Spans</CardTitle>
              <CardDescription>
                Detailed view of the agent's processing steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {traceSpans.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No trace spans available
                </div>
              ) : (
                <div className="space-y-3">
                  {traceSpans.map((span) => (
                    <div
                      key={span.id}
                      className="border rounded-md p-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm font-medium">{span.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(span.status)}
                          <span className="text-xs">{span.status}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Started: {formatTime(span.startTime)}</span>
                          <span>
                            {span.endTime 
                              ? `Ended: ${formatTime(span.endTime)}` 
                              : 'In progress...'}
                          </span>
                        </div>
                        <div className="mt-1">
                          Duration: {calculateDuration(span.startTime, span.endTime)}
                        </div>
                      </div>
                      
                      {span.details && Object.keys(span.details).length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Details:</span>
                          <pre className="mt-1 p-1 bg-muted rounded-sm overflow-x-auto">
                            {JSON.stringify(span.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 