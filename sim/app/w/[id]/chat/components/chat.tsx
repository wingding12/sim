'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAgentStore } from '@/app/w/agents/stores/store'
import { Agent, ChatMessage, MCPServer } from '@/app/w/agents/stores/types'
import { ChatMessageItem } from './chat-message-item'
import { MCPTraceViewer } from './mcp-trace-viewer'
import { FileUpload } from './file-upload'
import { MCPTrace } from './types'
import { createMCPIntegration } from './mcp-integration'

export function Chat() {
  const params = useParams()
  const workspaceId = params.id as string
  
  // Agent and MCP state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState('chat')
  const [mcpIntegration, setMcpIntegration] = useState<ReturnType<typeof createMCPIntegration> | null>(null)
  
  // MCP trace state
  const [mcpTraces, setMcpTraces] = useState<MCPTrace[]>([])
  
  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // Store access
  const { agents, mcpServers } = useAgentStore()
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Select the first agent by default and setup MCP integration
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const agent = agents[0]
      setSelectedAgent(agent)
      
      // Set up MCP integration if agent has an associated MCP server
      if (agent.mcpServer) {
        const mcpServer = mcpServers.find(server => server.id === agent.config.mcpServerId)
        if (mcpServer) {
          setMcpIntegration(createMCPIntegration({ 
            server: mcpServer,
            systemPrompt: agent.config.systemPrompt,
            model: agent.config.model
          }))
        }
      }
    }
  }, [agents, selectedAgent, mcpServers])
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])
  
  // Handle message send
  const handleSendMessage = async () => {
    if (!message.trim() && files.length === 0) return
    if (!selectedAgent) return
    
    // Create user message
    const userMessageId = uuidv4()
    const userMessage: ChatMessage = {
      id: userMessageId,
      agentId: selectedAgent.id,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    
    // Add message to chat
    setMessages((prev: ChatMessage[]) => [...prev, userMessage])
    setMessage('')
    setIsProcessing(true)
    
    try {
      let response: string
      let traces: MCPTrace[] = []
      
      // Use MCP integration if available
      if (mcpIntegration) {
        const result = await mcpIntegration.sendMessage(message, files)
        response = result.response
        traces = result.traces
      } else {
        // Fallback to simulated response
        await new Promise(resolve => setTimeout(resolve, 1500))
        response = `This is a simulated response to your message: "${message}"${files.length > 0 ? ` and ${files.length} uploaded files` : ''}`
        traces = [
          { 
            id: uuidv4(), 
            tool: 'simulated_tool', 
            status: 'completed', 
            startTime: Date.now() - 1000, 
            endTime: Date.now(),
            result: 'Simulated result'
          }
        ]
      }
      
      // Update MCP traces
      setMcpTraces((prev: MCPTrace[]) => [...prev, ...traces])
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        agentId: selectedAgent.id,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      
      // Add assistant message
      setMessages((prev: ChatMessage[]) => [...prev, assistantMessage])
      setIsProcessing(false)
      setFiles([])
    } catch (error) {
      console.error('Error processing message:', error)
      setIsProcessing(false)
    }
  }
  
  // Handle file upload
  const handleFileUpload = (newFiles: File[]) => {
    setFiles((prev: File[]) => [...prev, ...newFiles])
  }
  
  // Handle file removal
  const handleRemoveFile = (fileName: string) => {
    setFiles(files.filter((file: File) => file.name !== fileName))
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Agent Chat</h1>
          {selectedAgent && (
            <div className="text-sm text-muted-foreground">
              Using agent: {selectedAgent.name}
              {mcpIntegration && (
                <span className="ml-1 text-green-500"> • Connected to MCP</span>
              )}
            </div>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="trace">Trace View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <TabsContent value="chat" className="h-full">
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">Start a conversation with the agent by sending a message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <ChatMessageItem key={msg.id} message={msg} />
                  ))}
                  {isProcessing && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-pulse">Agent is thinking...</div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t bg-background">
              {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {files.map((file) => (
                    <div key={file.name} className="flex items-center bg-muted px-2 py-1 rounded-md text-xs">
                      <span className="mr-1 truncate max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={() => handleRemoveFile(file.name)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <FileUpload onUpload={handleFileUpload} />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isProcessing || (!message.trim() && files.length === 0)}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trace" className="h-full p-4">
          <MCPTraceViewer traces={mcpTraces} />
        </TabsContent>
      </div>
    </div>
  )
} 