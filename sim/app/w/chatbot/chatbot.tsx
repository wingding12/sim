'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Play, Pause, Image, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChatbotStore } from './stores/chatbot-store'
import { ActivityPanel } from './components/activity-panel'
import { MessageList } from './components/message-list'
import { getTraceManager } from './utils/trace-manager'

export function Chatbot() {
  const { 
    messages, 
    sendMessage, 
    isProcessing, 
    error, 
    currentAgent,
    activeMCPServers,
    setCurrentAgent,
    getAvailableAgents 
  } = useChatbotStore()
  
  const [userInput, setUserInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const availableAgents = getAvailableAgents()
  const traceManager = getTraceManager()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if file is an image
    if (file.type.startsWith('image/')) {
      setSelectedFile(file)
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    } else {
      alert('Please select an image file')
      e.target.value = ''
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userInput.trim() && !selectedFile) return
    
    try {
      await sendMessage(userInput, selectedFile)
      setUserInput('')
      clearSelectedFile()
      
      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col">
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col px-4 pt-4">
          <div className="flex-1 overflow-y-auto pb-4 space-y-4">
            <MessageList 
              messages={messages} 
              isProcessing={isProcessing} 
              messagesEndRef={messagesEndRef}
            />
          </div>
          
          {/* Display image preview if any */}
          {previewUrl && (
            <div className="relative mb-2 inline-block">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-32 max-w-xs rounded-md object-contain"
              />
              <button
                onClick={clearSelectedFile}
                className="absolute -right-2 -top-2 rounded-full bg-foreground/10 p-1 text-foreground hover:bg-foreground/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Input area */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 pb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={triggerFileInput}
              className="h-9 w-9 rounded-md shrink-0"
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            
            <Textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-[200px] flex-1 resize-none rounded-md"
              rows={1}
              disabled={isProcessing}
            />
            
            <Button
              type="submit"
              size="icon"
              disabled={isProcessing || (!userInput.trim() && !selectedFile)}
              className="h-9 w-9 rounded-md shrink-0"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="activity" className="flex-1 overflow-hidden px-4 pt-4">
          <ActivityPanel 
            activeMCPServers={activeMCPServers}
            traceManager={traceManager}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 