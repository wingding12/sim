/**
 * MCP Server Integration
 * 
 * This module provides utilities for communicating with MCP servers
 * using the Model Context Protocol standard.
 */

import { MCPServer } from '@/app/w/agents/stores/types'
import { MCPTrace, MCPIntegrationOptions, MCPResponse, GeminiRequestMessage, GeminiRequestConfig, GeminiResponse } from './types'
import { v4 as uuidv4 } from 'uuid'

// Access environment variables safely
const getEnvVariable = (key: string): string | undefined => {
  // For client-side, access from window.__ENV__ if available
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  // For server-side, access from process.env
  return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
};

/**
 * Creates an MCP integration for communicating with an MCP server
 */
export function createMCPIntegration(options: MCPIntegrationOptions) {
  const { server, systemPrompt = '', model = 'gemini-2.0-flash' } = options
  
  // Convert files to base64 strings for transmitting
  const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(
        (file) => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(',')[1]); // Remove data URL prefix
          };
          reader.readAsDataURL(file);
        })
      )
    );
  };
  
  /**
   * Calls the Gemini API directly
   */
  const callGeminiAPI = async (userMessage: string, files: File[] = []): Promise<string> => {
    try {
      const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
      const API_KEY = server.apiKey || getEnvVariable('GEMINI_API_KEY');
      
      if (!API_KEY) {
        throw new Error('Gemini API key not found. Please set it in the MCP server configuration.');
      }
      
      const messages: GeminiRequestMessage[] = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          parts: [{ text: systemPrompt }]
        });
      }
      
      // Add user message
      messages.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
      
      // Create request payload
      const requestBody: GeminiRequestConfig = {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      };
      
      // Send request to Gemini API
      const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };
  
  /**
   * Send a message to the MCP server
   */
  const sendMessage = async (message: string, files: File[] = []): Promise<MCPResponse> => {
    try {
      // Start tracking time for our trace
      const startTime = Date.now();
      const traceId = uuidv4();
      
      // Create initial trace
      const initialTrace: MCPTrace = {
        id: traceId,
        tool: 'gemini_model',
        status: 'running',
        startTime,
      };
      
      const traces: MCPTrace[] = [initialTrace];
      
      // In a real implementation, this would make an API call to the MCP server
      // For now, we'll use a direct Gemini integration if apiKey is provided
      let response: string;
      
      if (server.apiKey && model.includes('gemini')) {
        response = await callGeminiAPI(message, files);
      } else {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate a response
        response = `This is a simulated response to your message: "${message}"${
          files.length > 0 ? ` and ${files.length} uploaded files` : ''
        }`;
      }
      
      // Update our trace with the completion status
      const endTime = Date.now();
      traces[0] = {
        ...traces[0],
        status: 'completed',
        endTime,
        result: 'Model generated a response successfully'
      };
      
      // Add additional trace for content processing (simulated)
      if (files.length > 0) {
        traces.push({
          id: uuidv4(),
          tool: 'content_processor',
          status: 'completed',
          startTime: startTime + 200,
          endTime: startTime + 700,
          result: `Processed ${files.length} file(s)`
        });
      }
      
      return { response, traces };
    } catch (error) {
      console.error('Error in MCP integration:', error);
      
      // Create an error trace
      const errorTrace: MCPTrace = {
        id: uuidv4(),
        tool: 'gemini_model',
        status: 'failed',
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      return {
        traces: [errorTrace],
        response: `I encountered an error while processing your request: ${
          error instanceof Error ? error.message : 'An unknown error occurred'
        }`
      };
    }
  };

  return {
    server,
    sendMessage,
    model
  };
} 