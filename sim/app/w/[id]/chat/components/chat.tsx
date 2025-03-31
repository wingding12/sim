'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export function Chat(): React.ReactElement {
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
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  
  // Debug
  console.log("Chat component rendered", { messageCount: messages.length, isProcessing })
  
  // Select the first agent by default and setup MCP integration
  useEffect(() => {
    console.log("Agent useEffect", { agentsCount: agents?.length })
    if (agents?.length > 0 && !selectedAgent) {
      const agent = agents[0]
      setSelectedAgent(agent)
      
      // Set up MCP integration if agent has an associated MCP server
      if (agent.mcpServer) {
        const mcpServer = mcpServers.find((server: MCPServer) => server.id === agent.config.mcpServerId)
        if (mcpServer) {
          setMcpIntegration(createMCPIntegration({ 
            server: mcpServer,
            systemPrompt: agent.config.systemPrompt,
            model: agent.config.model || 'gemini-2.0-flash'
          }))
        }
      }
    }
  }, [agents, selectedAgent, mcpServers])
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    console.log("Scrolling to bottom", { messageCount: messages.length })
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])
  
  // Handle message send - simplified implementation
  const handleSend = (): void => {
    console.log("Send button clicked", { message, isProcessing })
    
    // Don't do anything if already processing or no content
    if (isProcessing || (!message.trim() && files.length === 0)) {
      console.log("Send blocked", { isProcessing, hasMessage: !!message.trim(), fileCount: files.length })
      return
    }
    
    // Prevent if no agent
    if (!selectedAgent) {
      console.log("No agent selected")
      return
    }
    
    console.log("Proceeding with send")
    
    // Create user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      agentId: selectedAgent.id,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    
    // Update messages with user message
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    
    // Clear input and set processing
    setMessage('')
    setIsProcessing(true)
    
    // Simulate response (for debugging)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        agentId: selectedAgent.id,
        role: 'assistant',
        content: `This is a simulated response to: "${userMessage.content}"`,
        timestamp: new Date().toISOString(),
      }
      
      // Update messages with assistant response
      setMessages([...newMessages, assistantMessage])
      setIsProcessing(false)
      setFiles([])
      
      console.log("Response added", { newCount: newMessages.length + 1 })
    }, 1000)
  }
  
  // Handle file upload
  const handleFileUpload = (newFiles: File[]): void => {
    setFiles((prev: File[]) => [...prev, ...newFiles])
  }
  
  // Handle file removal
  const handleRemoveFile = (fileName: string): void => {
    setFiles(files.filter((file: File) => file.name !== fileName))
  }
  
  return (
    <div className="flex flex-col h-full" style={{ paddingBottom: '8rem', marginTop: '1rem' }}>
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
        <div className="w-[400px]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="trace">Trace View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-hidden" 
        style={{ 
          maxHeight: 'calc(100vh - 16rem)',
          height: 'calc(100vh - 16rem)'
        }}
      >
        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full">
            <div 
              ref={scrollAreaRef} 
              className="flex-1 p-4 overflow-y-auto"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">Start a conversation with the agent by sending a message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg: ChatMessage) => (
                    <ChatMessageItem key={msg.id} message={msg} />
                  ))}
                  {isProcessing && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-pulse">Agent is thinking...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-background">
              {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {files.map((file: File) => (
                    <div key={file.name} className="flex items-center bg-muted px-2 py-1 rounded-md text-xs">
                      <span className="mr-1 truncate max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={() => handleRemoveFile(file.name)}
                        className="text-muted-foreground hover:text-destructive"
                        type="button"
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[80px]"
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <FileUpload onUpload={handleFileUpload} />
                  <Button 
                    onClick={handleSend}
                    disabled={isProcessing || (!message.trim() && files.length === 0)}
                    className="px-6"
                    type="button"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full p-4 overflow-y-auto">
            <MCPTraceViewer traces={mcpTraces} />
          </div>
        )}
      </div>
    </div>
  )
} 