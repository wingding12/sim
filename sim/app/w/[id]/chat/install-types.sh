#!/bin/bash

# Script to install TypeScript type definitions for the chat component

# Navigate to the project root
cd ../../../../

# Install the required type definitions
npm install --save-dev @types/react @types/react-dom @types/node @types/uuid typescript

echo "✅ TypeScript type definitions installed successfully" 