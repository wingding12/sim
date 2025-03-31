# Sim Studio AI Agent Chat System

The Sim Studio AI Agent Chat system provides a powerful interface for interacting with AI agents using the Model Context Protocol (MCP). This document explains how to use and customize the chat interface.

## Features

- Interactive chat interface for communicating with AI agents
- Support for multimodal content (file uploads)
- Real-time visualization of MCP server tools usage
- Integration with Gemini 2.0 Flash and other LLM providers
- Docker containerization for easy deployment

## Getting Started

### Running with Docker

The easiest way to get started is using Docker:

```bash
# Clone the repository
git clone https://github.com/simstudioai/sim.git
cd sim

# Set your Gemini API key in .env or pass it directly
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Build and run the containers
docker-compose up -d
```

Once the containers are running, navigate to http://localhost:3000 in your browser to access Sim Studio.

### Using the Chat Interface

1. Navigate to any workspace in Sim Studio (e.g., `/w/1`)
2. Click the "Chat" tab in the top navigation bar
3. The agent chat interface will load with the following components:
   - Chat history display
   - Message input area
   - File upload button
   - Send button
   - Trace View tab for monitoring MCP tool usage

4. Type a message and press Enter or click Send to interact with the agent
5. Upload files using the upload button to send multimodal content
6. Switch to the Trace View tab to see which tools the agent is using

## Configuring the AI Model

The chat system defaults to using Gemini 2.0 Flash, but you can configure it to use other models:

1. Set up an MCP server with your preferred model
2. Create an agent in Sim Studio with the MCP server configured
3. The chat interface will automatically use the agent's configured model

## Environment Variables

The following environment variables can be set to customize the behavior:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `DATABASE_URL`: PostgreSQL database connection string
- `REDIS_URL`: Redis connection string for caching (optional)
- `NODE_ENV`: Set to 'production' for production deployments

## Developing and Extending

### Adding New Models

The MCP integration system is designed to be extensible. To add support for a new model:

1. Update the `mcp-integration.ts` file to include your new model provider
2. Add appropriate API calls for your model
3. Update the tracing system to record tool usage for your model

### Customizing the UI

The chat interface uses Tailwind CSS for styling. To customize the appearance:

1. Edit the component files in `sim/app/w/[id]/chat/components/`
2. Modify the Tailwind classes to change colors, spacing, and other visual properties

## Troubleshooting

### Common Issues

1. **Chat messages not updating**: Ensure your browser supports WebSockets and that you have a stable network connection.

2. **File uploads not working**: Check that your browser supports the File API and that you're not trying to upload files that are too large.

3. **Model errors**: Verify your API keys are correctly set and that your model provider is accessible from your deployment environment.

4. **Send button not working**: If the send button isn't responding, try the following fixes:
   - Check if there's text in the input field (the button is disabled when empty)
   - Verify the agent is properly loaded (check console for "No agent selected" messages)
   - Clear your browser cache and reload the page
   - If using development mode, try opening the browser console to see any errors
   - Add debug logging to the `handleSend` function to trace execution flow

### Fixing the Send Button

If you're experiencing issues with the send button not responding, a common fix is to simplify the message handling logic:

```tsx
// Simplified send handler for debugging
const handleSend = () => {
  console.log("Send button clicked", { message, isProcessing })
  
  // Don't do anything if already processing or no content
  if (isProcessing || (!message.trim() && files.length === 0)) {
    console.log("Send blocked", { isProcessing, hasMessage: !!message.trim() })
    return
  }
  
  // Prevent if no agent
  if (!selectedAgent) {
    console.log("No agent selected")
    return
  }
  
  // Create user message
  const userMessage = {
    id: uuidv4(),
    agentId: selectedAgent.id,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }
  
  // Update UI immediately
  setMessages(prev => [...prev, userMessage])
  setMessage('')
  setIsProcessing(true)
  
  // Use a direct timeout instead of async/await for debugging
  setTimeout(() => {
    const assistantMessage = {
      id: uuidv4(),
      agentId: selectedAgent.id,
      role: 'assistant',
      content: `Response to: ${message}`,
      timestamp: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, assistantMessage])
    setIsProcessing(false)
  }, 1000)
}
```

### Logs

When running with Docker, you can access logs with:

```bash
docker-compose logs -f simstudio
```

## Security Considerations

- API keys are stored in environment variables and should be kept secure
- User data is stored in the PostgreSQL database
- File uploads are processed in memory and not persisted unless explicitly configured

## Contributing

We welcome contributions to improve the agent chat system. Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md) file for guidelines. 