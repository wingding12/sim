'use client'

import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { ChatMessageItemProps } from './types'

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user'
  const formattedTime = format(new Date(message.timestamp), 'h:mm a')
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Card className={`p-4 max-w-[80%] ${isUser ? 'bg-primary/10' : 'bg-secondary/10'}`}>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <div className="font-medium">{isUser ? 'You' : 'Agent'}</div>
            <div className="text-xs text-muted-foreground">{formattedTime}</div>
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </Card>
    </div>
  )
} 