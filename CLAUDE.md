# MacOS Clipboard MCP - Development Guide

## Build & Run Commands
- `bun run start` - Start the MCP server
- `bun run dev` - Start development mode with fastmcp
- `bun run inspect` - Inspect mode with fastmcp

## Code Style Guidelines
- TypeScript with proper type definitions (use zod for schemas)
- Error handling with try/catch blocks and meaningful error messages
- Use async/await for asynchronous operations
- Import statement grouping: external modules first, then internal modules
- Use camelCase for variables and functions, PascalCase for types/interfaces
- Prefer const over let when variables aren't reassigned
- Use Bun's native functions for file operations
- Wrap clipboard operations with proper error handling
- Clean up temporary files in finally blocks
- Keep functions focused on a single responsibility

## Architecture
- Each clipboard operation is exposed as an MCP tool
- Uses osascript for MacOS clipboard interaction
- Handles both text and image content formats