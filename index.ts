import {
  Content,
  ContentResult,
  FastMCP,
  imageContent,
  ImageContent,
  UserError,
} from "fastmcp";
import { z } from "zod";
import { spawn, execSync } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import { nanoid } from "nanoid";

// Create an MCP server
const mcp = new FastMCP({
  name: "MacOS Clipboard",
  version: "0.0.1",
});

/**
 * Execute applescript using osascript.
 *
 * @param script the script to execute.
 * @returns the stdout of the script as a string.
 */
const OSA = (strings: TemplateStringsArray, ...values: string[]) => {
  const input = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || "");
  }, "");
  return execSync("osascript", {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "ignore"] // Redirect stderr to /dev/null
  });
};

// Get clipboard contents as a tool
mcp.addTool({
  name: "getClipboardContents",
  description: "Fetch the contents of the clipboard (text, images, or binary data). Used to see what is on the clipboard. IMPORTANT: This tool should be called every time clipboard contents are needed as clipboard data can change; results should not be cached.",
  parameters: z.object({}),
  execute: async (): Promise<ContentResult> => {
    try {
      const text = OSA`
        if ((clipboard info) as string) contains "text" then
          return the clipboard as text
        else if ((clipboard info) as string) contains "«class PNGf»" then
          return the clipboard as «class PNGf»
        else if ((clipboard info) as string) contains "«class DATA»" then
          return the clipboard as «class DATA»
        end if`;

      let content: Content;

      if (text.startsWith("«data PNGf")) {
        const clean = text.replace("«data PNGf", "").replace("»", "");
        content = await imageContent({
          buffer: Buffer.from(clean, "hex")
        });
      } else if (text.startsWith("«data DATA")) {
        const clean = text.replace("«data DATA", "").replace("»", "");
        content = {
          type: "image",
          mimeType: "application/octet-stream",
          data: Buffer.from(clean, "hex").toString("base64")
        };
      } else {
        content = {
          type: "text",
          text,
        };
      }

      return {
        content: [content],
      };
    } catch (error) {
      console.error("Error retrieving content from the clipboard:", error);
      throw new UserError("Error retrieving content from the clipboard.", error);
    }
  },
});

// Start the server with stdio transport
mcp.start({
  transportType: "stdio",
});
