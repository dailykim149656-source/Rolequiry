"use client";

type RegisteredTool = {
  name: string;
  description: string;
  execute: (args?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    __roleprobeTools?: Map<string, RegisteredTool>;
    __roleprobeInvoke?: (
      name: string,
      args?: Record<string, unknown>,
    ) => Promise<unknown>;
  }
  interface Document {
    modelContext?: {
      registerTool: (
        tool: RegisteredTool,
        options?: { signal?: AbortSignal },
      ) => void;
    };
  }
}

/** Test/dev helper only. Production must never call this. */
export function installLocalModelContext() {
  if (typeof document === "undefined") return;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ROLEPROBE_WEBMCP_SHIM !== "1"
  ) {
    return;
  }
  if (
    process.env.NODE_ENV !== "test" &&
    process.env.NEXT_PUBLIC_ROLEPROBE_WEBMCP_SHIM !== "1"
  ) {
    return;
  }
  const existing = window.__roleprobeTools;
  if (document.modelContext && existing) return;
  const tools = existing ?? new Map<string, RegisteredTool>();
  window.__roleprobeTools = tools;
  window.__roleprobeInvoke = async (name, args = {}) => {
    const tool = tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool.execute(args);
  };
  if (!document.modelContext) {
    document.modelContext = {
      registerTool(tool, options = {}) {
        tools.set(tool.name, tool);
        options.signal?.addEventListener("abort", () => {
          if (tools.get(tool.name) === tool) tools.delete(tool.name);
        });
      },
    };
  }
}
