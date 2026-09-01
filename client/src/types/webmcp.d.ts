export {};

declare global {
  interface ToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  }

  interface ToolExecuteCallbackOptions {
    signal: AbortSignal;
  }

  interface ModelContextTool {
    name: string;
    title?: string;
    description: string;
    inputSchema?: object;
    execute: (
      inputObject: object,
      options: ToolExecuteCallbackOptions,
    ) => Promise<unknown> | unknown;
    annotations?: ToolAnnotations;
  }

  interface ModelContextRegisterToolOptions {
    exposedTo?: string[];
    signal?: AbortSignal;
  }

  interface ModelContext {
    registerTool(
      tool: ModelContextTool,
      options?: ModelContextRegisterToolOptions,
    ): Promise<undefined>;
    getTools?(): Promise<unknown[]>;
    executeTool?(tool: unknown, inputObject?: object): Promise<string>;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
