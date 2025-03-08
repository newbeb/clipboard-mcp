# MacOS Clipboard MCP Server

An MCP server that provides access to the macOS clipboard via OSAScript. This tool allows AI assistants to see what content is on the user's clipboard, including text, images, and binary data.

## Features

- Retrieve content from the macOS clipboard
- Supports multiple content types:
  - Text
  - Images (PNG)
  - Raw binary data

## Installation

```bash
bun install
```

## Usage

To start the server:

```bash
bun run start
```

For development with hot reloading:

```bash
bun run dev
```

Alternative development modes:

```bash
bun run dev2      # Run with fastmcp dev
bun run inspect   # Run with fastmcp inspector
bun run mcp-cli   # Run with mcp-cli tool
```

## Implementation Notes

- Uses AppleScript via the `osascript` command to interact with the macOS clipboard
- Handles various clipboard content types
- Content is returned with appropriate MIME types
- The clipboard should always be checked on demand (not cached) as content can change between requests

## Requirements

- macOS operating system
- Bun runtime
