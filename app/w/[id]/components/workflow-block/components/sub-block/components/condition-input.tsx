import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash } from 'lucide-react'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { Button } from '@/components/ui/button'
import { EnvVarDropdown, checkEnvVarTrigger } from '@/components/ui/env-var-dropdown'
import { TagDropdown, checkTagTrigger } from '@/components/ui/tag-dropdown'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSubBlockValue } from '../hooks/use-sub-block-value'

interface ConditionalBlock {
  id: string
  title: string
  value: string
}

interface ConditionInputProps {
  blockId: string
  subBlockId: string
  isConnecting: boolean
}

export function ConditionInput({ blockId, subBlockId, isConnecting }: ConditionInputProps) {
  const [storeValue, setStoreValue] = useSubBlockValue(blockId, subBlockId)
  const [lineCount, setLineCount] = useState(1)
  const [showTags, setShowTags] = useState(false)
  const [showEnvVars, setShowEnvVars] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [activeSourceBlockId, setActiveSourceBlockId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [visualLineHeights, setVisualLineHeights] = useState<{ [key: string]: number[] }>({})
  const updateNodeInternals = useUpdateNodeInternals()

  // Initialize conditional blocks with empty values
  const [conditionalBlocks, setConditionalBlocks] = useState<ConditionalBlock[]>([
    { id: crypto.randomUUID(), title: 'if', value: '' },
  ])

  // Sync store value with conditional blocks on initial load
  useEffect(() => {
    if (storeValue !== null) {
      try {
        const parsedValue = JSON.parse(storeValue.toString())
        if (Array.isArray(parsedValue)) {
          setConditionalBlocks(parsedValue)
        }
      } catch {
        // If the store value isn't valid JSON, initialize with default block
        setConditionalBlocks([{ id: crypto.randomUUID(), title: 'if', value: '' }])
      }
    }
  }, [])

  // Update store whenever conditional blocks change
  useEffect(() => {
    setStoreValue(JSON.stringify(conditionalBlocks))
    updateNodeInternals(`${blockId}-${subBlockId}`)
  }, [conditionalBlocks, blockId, subBlockId])

  // Update block value
  const updateBlockValue = (blockId: string, newValue: string) => {
    setConditionalBlocks((blocks) =>
      blocks.map((block) => (block.id === blockId ? { ...block, value: newValue } : block))
    )
  }

  // Update the line counting logic to be block-specific
  useEffect(() => {
    if (!editorRef.current) return

    const calculateVisualLines = () => {
      const preElement = editorRef.current?.querySelector('pre')
      if (!preElement) return

      const newVisualLineHeights: { [key: string]: number[] } = {}

      conditionalBlocks.forEach((block) => {
        const lines = block.value.split('\n')
        const blockVisualHeights: number[] = []

        // Create a hidden container with the same width as the editor
        const container = document.createElement('div')
        container.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${preElement.clientWidth}px;
          font-family: ${window.getComputedStyle(preElement).fontFamily};
          font-size: ${window.getComputedStyle(preElement).fontSize};
          padding: 12px;
          white-space: pre-wrap;
          word-break: break-word;
        `
        document.body.appendChild(container)

        // Process each line
        lines.forEach((line) => {
          const lineDiv = document.createElement('div')

          if (line.includes('<') && line.includes('>')) {
            const parts = line.split(/(<[^>]+>)/g)
            parts.forEach((part) => {
              const span = document.createElement('span')
              span.textContent = part
              if (part.startsWith('<') && part.endsWith('>')) {
                span.style.color = 'rgb(153, 0, 85)'
              }
              lineDiv.appendChild(span)
            })
          } else {
            lineDiv.textContent = line || ' '
          }

          container.appendChild(lineDiv)

          const actualHeight = lineDiv.getBoundingClientRect().height
          const lineUnits = Math.ceil(actualHeight / 21)
          blockVisualHeights.push(lineUnits)

          container.removeChild(lineDiv)
        })

        document.body.removeChild(container)
        newVisualLineHeights[block.id] = blockVisualHeights
      })

      setVisualLineHeights(newVisualLineHeights)
    }

    calculateVisualLines()

    const resizeObserver = new ResizeObserver(calculateVisualLines)
    resizeObserver.observe(editorRef.current)

    return () => resizeObserver.disconnect()
  }, [conditionalBlocks])

  // Modify the line numbers rendering to be block-specific
  const renderLineNumbers = (blockId: string) => {
    const numbers: JSX.Element[] = []
    let lineNumber = 1
    const blockHeights = visualLineHeights[blockId] || []

    blockHeights.forEach((height) => {
      for (let i = 0; i < height; i++) {
        numbers.push(
          <div
            key={`${lineNumber}-${i}`}
            className={cn('text-xs text-muted-foreground leading-[21px]', i > 0 && 'invisible')}
          >
            {lineNumber}
          </div>
        )
      }
      lineNumber++
    })

    return numbers
  }

  // Handle drops from connection blocks
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type !== 'connectionBlock') return

      // Get current cursor position from the textarea
      const textarea = editorRef.current?.querySelector('textarea')
      const dropPosition =
        textarea?.selectionStart ?? conditionalBlocks.map((block) => block.value).join('\n').length

      // Insert '<' at drop position to trigger the dropdown
      const newValue =
        conditionalBlocks
          .map((block) => block.value)
          .join('\n')
          .slice(0, dropPosition) +
        '<' +
        conditionalBlocks
          .map((block) => block.value)
          .join('\n')
          .slice(dropPosition)

      updateBlockValue(data.connectionData?.sourceBlockId || '', newValue)
      setCursorPosition(dropPosition + 1)
      setShowTags(true)

      if (data.connectionData?.sourceBlockId) {
        setActiveSourceBlockId(data.connectionData.sourceBlockId)
      }

      // Set cursor position after state updates
      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = dropPosition + 1
          textarea.selectionEnd = dropPosition + 1
          textarea.focus()
        }
      }, 0)
    } catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  // Handle tag selection
  const handleTagSelect = (newValue: string) => {
    updateBlockValue(activeSourceBlockId || '', newValue)
    setShowTags(false)
    setActiveSourceBlockId(null)
  }

  // Handle environment variable selection
  const handleEnvVarSelect = (newValue: string) => {
    updateBlockValue(activeSourceBlockId || '', newValue)
    setShowEnvVars(false)
  }

  // Update block titles based on position
  const updateBlockTitles = (blocks: ConditionalBlock[]): ConditionalBlock[] => {
    return blocks.map((block, index) => ({
      ...block,
      title: index === 0 ? 'if' : index === blocks.length - 1 ? 'else' : 'else if',
    }))
  }

  // Update these functions to use updateBlockTitles
  const addBlock = (afterId: string) => {
    const blockIndex = conditionalBlocks.findIndex((block) => block.id === afterId)
    const newBlock = { id: crypto.randomUUID(), title: '', value: '' }

    const newBlocks = [...conditionalBlocks]
    newBlocks.splice(blockIndex + 1, 0, newBlock)
    setConditionalBlocks(updateBlockTitles(newBlocks))
  }

  const removeBlock = (id: string) => {
    if (conditionalBlocks.length === 1) return
    setConditionalBlocks((blocks) => updateBlockTitles(blocks.filter((block) => block.id !== id)))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const blockIndex = conditionalBlocks.findIndex((block) => block.id === id)
    if (
      (direction === 'up' && blockIndex === 0) ||
      (direction === 'down' && blockIndex === conditionalBlocks.length - 1)
    )
      return

    const newBlocks = [...conditionalBlocks]
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    ;[newBlocks[blockIndex], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[blockIndex],
    ]
    setConditionalBlocks(updateBlockTitles(newBlocks))
  }

  return (
    <div className="space-y-4">
      {conditionalBlocks.map((block, index) => (
        <div
          key={block.id}
          className="overflow-visible rounded-lg border bg-background group relative"
        >
          <div className="flex h-10 items-center justify-between border-b bg-card px-3">
            <span className="text-sm font-medium">{block.title}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`condition-${block.id}`}
              className={cn(
                '!w-3.5 !h-3.5',
                '!bg-white !rounded-full !border !border-gray-200',
                'group-hover:!border-blue-500',
                '!transition-border !duration-150 !cursor-crosshair',
                '!absolute !z-50',
                '!right-[-25px]'
              )}
              data-nodeid={`${blockId}-${subBlockId}`}
              data-handleid={`condition-${block.id}`}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              isConnectableStart={true}
              isConnectableEnd={false}
            />
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addBlock(block.id)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Block</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Block</TooltipContent>
              </Tooltip>

              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span className="sr-only">Move Up</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Up</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === conditionalBlocks.length - 1}
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Move Down</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Down</TooltipContent>
                </Tooltip>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(block.id)}
                    disabled={conditionalBlocks.length === 1}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete Block</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Condition</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div
            className={cn(
              'relative min-h-[100px] rounded-md bg-background font-mono text-sm',
              isConnecting && 'ring-2 ring-blue-500 ring-offset-2'
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Line numbers */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[30px] bg-muted/30 flex flex-col items-end pr-3 pt-3 select-none"
              aria-hidden="true"
            >
              {renderLineNumbers(block.id)}
            </div>

            <div className="pl-[30px] pt-0 mt-0 relative" ref={editorRef}>
              {block.value.length === 0 && (
                <div className="absolute left-[42px] top-[12px] text-muted-foreground/50 select-none pointer-events-none">
                  {'<response> === true'}
                </div>
              )}
              <Editor
                value={block.value}
                onValueChange={(newCode) => {
                  updateBlockValue(block.id, newCode)

                  // Check for tag trigger and environment variable trigger
                  const textarea = editorRef.current?.querySelector('textarea')
                  if (textarea) {
                    const pos = textarea.selectionStart
                    setCursorPosition(pos)

                    const tagTrigger = checkTagTrigger(newCode, pos)
                    setShowTags(tagTrigger.show)
                    if (!tagTrigger.show) {
                      setActiveSourceBlockId(null)
                    }

                    const envVarTrigger = checkEnvVarTrigger(newCode, pos)
                    setShowEnvVars(envVarTrigger.show)
                    setSearchTerm(envVarTrigger.show ? envVarTrigger.searchTerm : '')
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowTags(false)
                    setShowEnvVars(false)
                  }
                }}
                highlight={(code) => highlight(code, languages.javascript, 'javascript')}
                padding={12}
                style={{
                  fontFamily: 'inherit',
                  minHeight: '46px',
                  lineHeight: '21px',
                }}
                className="focus:outline-none"
                textareaClassName="focus:outline-none focus:ring-0 bg-transparent"
              />

              {showEnvVars && (
                <EnvVarDropdown
                  visible={showEnvVars}
                  onSelect={handleEnvVarSelect}
                  searchTerm={searchTerm}
                  inputValue={block.value}
                  cursorPosition={cursorPosition}
                  onClose={() => {
                    setShowEnvVars(false)
                    setSearchTerm('')
                  }}
                />
              )}

              {showTags && (
                <TagDropdown
                  visible={showTags}
                  onSelect={handleTagSelect}
                  blockId={blockId}
                  activeSourceBlockId={activeSourceBlockId}
                  inputValue={block.value}
                  cursorPosition={cursorPosition}
                  onClose={() => {
                    setShowTags(false)
                    setActiveSourceBlockId(null)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
