# MCP Chat Interface for Sim Studio

This module implements a chat interface for Sim Studio that allows users to interact with AI agents using Model Context Protocol (MCP) servers.

## Features

- Chat interface for conversing with AI agents
- Support for multimodal content (file uploads)
- Integration with MCP servers for tool use
- Real-time trace view showing MCP server tool usage
- Seamless integration with existing Sim Studio agents

## Usage

1. Navigate to any workspace in Sim Studio
2. Click the "Chat" tab in the navigation
3. Start chatting with your agent
4. View real-time MCP traces in the Trace View tab

## Implementation Details

- **Chat Component**: Main chat interface with message history and input
- **MCP Integration**: Utility for integrating with MCP servers
- **Trace Viewer**: Component for visualizing MCP server tool usage
- **File Upload**: Component for handling multimodal content uploads

## MCP Tool Integration

The chat interface connects to MCP servers to enable AI agents to use external tools. The MCP trace viewer shows real-time information about:

- Which tools are being used
- Current status of each tool (running/completed/failed)
- Results returned by each tool
- Any errors encountered during tool execution

## File Structure

```
/chat
├── README.md              # Documentation
├── page.tsx               # Main page component
├── components/            # UI components
│   ├── chat.tsx           # Main chat interface
│   ├── chat-message-item.tsx  # Individual message display
│   ├── file-upload.tsx    # File upload component
│   ├── mcp-integration.ts # MCP server integration utility
│   ├── mcp-trace-viewer.tsx  # MCP trace visualization
│   ├── types.ts           # TypeScript interfaces
│   └── index.ts           # Component exports
``` 