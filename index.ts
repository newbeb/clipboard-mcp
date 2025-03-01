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

mcp.addResource({
  uri: "clipboard://localhost",
  name: "Clipboard",
  description:
    "Get the contents of the clipboard that the MCP Server is running on. This content can change.",
  async load() {
    try {
      const text = OSA`
        if ((clipboard info) as string) contains "text" then
          return the clipboard as text
        else if ((clipboard info) as string) contains "«class PNGf»" then
          return the clipboard as «class PNGf»
        else if ((clipboard info) as string) contains "«class DATA»" then
          return the clipboard as «class DATA»
        end if`;

      if (text.startsWith("«data PNGf")) {
        const clean = text.replace("«data PNGf", "").replace("»", "");
        return Promise.resolve({
          uri: "clipboard://localhost",
          mimeType: "image/png",
          blob: Buffer.from(clean, "hex").toString("base64"),
        });
      } else if (text.startsWith("«data DATA")) {
        const clean = text.replace("«data DATA", "").replace("»", "");
        return Promise.resolve({
          uri: "clipboard://localhost",
          mimeType: "application/octet-stream",
          blob: Buffer.from(clean, "hex").toString("base64"),
        });
      } else {
        return Promise.resolve({
          uri: "clipboard://localhost",
          mimeType: "text/plain",
          text,
        });
      }
    } catch (error) {
      throw new UserError(
        "Error retrieving content from the clipboard.",
        error,
      );
    }
  },
});

/*
// Get all available formats in clipboard
mcp.addTool({
  name: "getClipboardInfo",
  description: "Get information about what is available on the clipboard",
  parameters: z.object({}),
  execute: async (): Promise<ContentResult> => {
    try {
      const info = clipboardInfo(false);
      const content: Content[] = info.map(({ type, length, mimeType }) => ({
        type: "text",
        text: `Content-Type: ${mimeType}\nContent-Length: ${length}\nClipboard-Type: ${type}`,
      }));

      return {
        content,
      };
    } catch (error) {
      console.error("Error getting clipboard info:", error);
      throw new Error("Error getting clipboard info.");
    }
  },
});
*/

// Start the server with stdio transport
mcp.start({
  transportType: "stdio",
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
  });
};

/**
 * Get a list of what is on the clipboard.
 */
const clipboardInfo = () => {
  const result = OSA`clipboard info`;

  console.log("CLIPBOARD INFO", result);

  const pairs = result
    .trim()
    .split(",")
    .map((format) => format.trim())
    .reduce(
      (entries, value, index, arr) => {
        if (index % 2 === 0) {
          const type = value.trim();
          const length = parseInt(arr[index + 1].trim());
          const mimeType = clipboardToMime(type);
          entries = [
            ...entries,
            {
              type,
              length,
              mimeType: mimeType,
            },
          ];
        }
        return entries;
      },
      [] as { type: string; length: number; mimeType: string }[],
    );

  return pairs;
};

const TYPE_ROSETTA = [
  // Text formats
  ["Unicode text", "text/plain; charset=utf-16"],
  ["string", "text/plain"],
  ["«class ut16»", "text/plain; charset=utf-16le"],
  ["«class utf8»", "text/plain; charset=utf-8"],

  // Image formats
  ["«class PNGf»", "image/png"],
  ["«class 8BPS»", "image/vnd.adobe.photoshop"],
  ["GIF picture", "image/gif"],
  ["«class jp2 »", "image/jp2"],
  ["JPEG picture", "image/jpeg"],
  ["TIFF picture", "image/tiff"],
  ["«class BMP »", "image/bmp"],
  ["«class TPIC»", "image/targa"],
  ["«class PICT»", "image/pict"],
  ["«class SVG »", "image/svg+xml"],
  ["«class WEBP»", "image/webp"],
  ["«class HEIC»", "image/heic"],
  ["«class ICO »", "image/x-icon"],
  ["«class ICNS»", "image/icns"],
  ["«class DNG »", "image/x-adobe-dng"],
  ["«class PCX »", "image/x-pcx"],
  ["«class EPS »", "application/postscript"],

  // Document types
  ["«class PDF »", "application/pdf"],
  ["«class HTML»", "text/html"],
  ["HTML", "text/html"],
  ["«class RTF »", "application/rtf"],

  // Microsoft Office formats
  [
    "«class MSWD»",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [
    "«class XLS »",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  [
    "«class XCEL»",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  [
    "«class PPT »",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  [
    "«class SLD3»",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ["«class OXML»", "application/vnd.openxmlformats-officedocument"],

  // Other specialized formats
  ["«class alis»", "application/x-apple-alias"],
  ["«class furl»", "application/x-apple-fileurl"],
  ["«class hstg»", "application/x-apple-hashtag"],
  ["«class PBOA»", "application/x-apple-pboard-data"],
  ["«class clrt»", "application/x-apple-color"],
  ["«class URL »", "text/uri-list"],

  // Raw formats
  ["public.data", "application/octet-stream"],
  ["CorePasteboardFlavorType 0x54455854", "application/octet-stream"],
  ["«class DATA»", "application/octet-stream"], // Last so it is the winner in the reverse
];

const ClipboardToMimeType = new Map(TYPE_ROSETTA.map(([a, b]) => [a, b]));
const MimeToClipboard = new Map(TYPE_ROSETTA.map(([a, b]) => [b, a]));

function clipboardToMime(clipboardType: string): string {
  return ClipboardToMimeType.get(clipboardType) || "application/octet-stream";
}

function mimeToClipboard(mimeType: string): string {
  return MimeToClipboard.get(mimeType) || "«class DATA»";
}
