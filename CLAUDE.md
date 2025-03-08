# MacOS Clipboard MCP - Development Guide

## Build & Run Commands
- `bun run start` - Start the MCP server
- `bun run dev` - Start development mode with hot reloading
- `bun run dev2` - Alternative dev mode using fastmcp
- `bun run inspect` - Run with fastmcp inspector
- `bun run mcp-cli` - Run with mcp-cli tool

## Code Style Guidelines
- TypeScript with proper type safety (use zod for runtime validation)
- Error handling: use `UserError` for user-facing errors, include original error
- Group imports: external libraries first, then node modules, then local imports
- Use template literals with `OSA` for AppleScript execution
- Format: camelCase for variables/functions, PascalCase for types/interfaces
- Prefer composition over inheritance
- Use hex/base64 for binary data conversion
- Prefer const over let when variables aren't reassigned
- Use tagged template literals for special operations

## Architecture
- Each clipboard operation is exposed as an MCP resource or tool
- Uses osascript for MacOS clipboard interaction via template literal functions
- Supports multiple formats (text, PNG, and binary data)
- Uses MIME type mapping for cross-platform compatibility