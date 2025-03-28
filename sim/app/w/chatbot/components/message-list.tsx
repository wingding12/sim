'use client'

import React from 'react'
import { Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { ChatMessage } from '../stores/types'

interface MessageListProps {
  messages: ChatMessage[]
  isProcessing: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isProcessing, 
  messagesEndRef 
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation with the AI assistant
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Card
            key={message.id}
            className={cn("p-4 max-w-[80%]", {
              "ml-auto bg-primary text-primary-foreground": message.role === 'user',
              "mr-auto": message.role === 'assistant',
            })}
          >
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium leading-none">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                  <span className="ml-2 text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                
                {/* Display attached image if any */}
                {message.fileUrl && message.fileType?.startsWith('image/') && (
                  <div className="mt-2">
                    <img 
                      src={message.fileUrl} 
                      alt="Attached" 
                      className="max-h-60 max-w-full rounded-md object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
      
      {/* Show typing indicator when processing */}
      {isProcessing && (
        <Card className="p-4 max-w-[80%] mr-auto">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Invisible div for auto-scrolling */}
      <div ref={messagesEndRef} />
    </>
  )
} 