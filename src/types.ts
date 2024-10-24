// src/types.ts
import { z } from "zod";

/**
 * Enum representing different roles in a message exchange.
 */
export enum MessageRole {
  /** System messages providing context or instructions */
  System = "system",
  /** Messages from the user */
  User = "user",
  /** Messages from the AI assistant */
  Assistant = "assistant",
  /** Messages from tool executions */
  Tool = "tool",
}

/**
 * Enum defining how tools/functions should be chosen and executed.
 */
export enum ToolChoice {
  /** Do not use any tools */
  None = "none",
  /** Automatically choose when to use tools */
  Auto = "auto",
  /** Use a specific function */
  Function = "function",
}

/**
 * Schema for defining function parameters and structure.
 * Used to validate and type-check function definitions.
 */
export const FunctionDefinitionSchema = z.object({
  /** Name of the function */
  name: z.string(),
  /** Optional description of what the function does */
  description: z.string().optional(),
  /** Parameters the function accepts */
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(
      z.object({
        type: z.enum(["string", "number", "boolean", "object", "array"]),
        description: z.string().optional(),
        items: z
          .object({
            type: z.string(),
          })
          .optional(),
      }),
    ),
    required: z.array(z.string()).optional(),
  }),
});

/**
 * Schema for tool/function calls made by the assistant.
 */
export const ToolCallSchema = z.object({
  /** Unique identifier for the tool call */
  id: z.string(),
  /** Type of the tool (currently only 'function' is supported) */
  type: z.literal("function"),
  /** Function call details */
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

/**
 * Schema for messages exchanged between the user, assistant, and tools.
 */
export const MessageSchema = z.object({
  /** Role of the message sender */
  role: z.enum([
    MessageRole.System,
    MessageRole.User,
    MessageRole.Assistant,
    MessageRole.Tool,
  ]),
  /** Content of the message */
  content: z.string().nullable(),
  /** Optional identifier of the sender */
  sender: z.string().optional(),
  /** ID of the tool call this message is responding to */
  tool_call_id: z.string().optional(),
  /** Tool calls made in this message */
  tool_calls: z.array(ToolCallSchema).nullable().optional(),
});

/**
 * Schema defining an agent's configuration and capabilities.
 */
export const AgentSchema = z.object({
  /** Name of the agent */
  name: z.string(),
  /** Model to use for this agent (e.g., 'gpt-4') */
  model: z.string(),
  /** Instructions/system prompt for the agent */
  instructions: z.union([z.string(), z.function().returns(z.string())]),
  /** Functions available to this agent */
  functions: z.array(z.function()),
  /** How the agent should choose tools */
  toolChoice: z
    .union([
      z.enum([ToolChoice.None, ToolChoice.Auto]),
      z.object({
        type: z.literal(ToolChoice.Function),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  /** Whether multiple tools can be called in parallel */
  parallelToolCalls: z.boolean(),
});

/** Type definition for function specifications */
export type FunctionDefinition = z.infer<typeof FunctionDefinitionSchema>;
/** Type definition for tool calls */
export type ToolCall = z.infer<typeof ToolCallSchema>;
/** Type definition for messages */
export type Message = z.infer<typeof MessageSchema>;
/** Type definition for agents */
export type Agent = z.infer<typeof AgentSchema>;

/**
 * Interface for standardized error handling across the application.
 */
export interface SwarmError extends Error {
  /** Error code for categorizing the error */
  code: string;
  /** Optional underlying cause of the error */
  cause?: Error;
}

/**
 * Generic result type for operations that can succeed or fail.
 * @template T - The type of the success data
 * @template E - The type of the error, must extend SwarmError
 */
export interface Result<T, E extends SwarmError = SwarmError> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** The error if unsuccessful */
  error?: E;
}

/**
 * Interface for the response data structure returned by agent runs.
 */
export interface ResponseData {
  /** Messages generated during the run */
  messages: Message[];
  /** The final state of the agent */
  agent: Agent | null;
  /** Variables from the execution context */
  contextVariables: Record<string, unknown>;
}

/**
 * Configuration options for the Swarm system.
 */
export interface SwarmConfig {
  /** Optional logger implementation */
  logger?: Logger;
  /** Configuration for retry behavior */
  retryConfig?: {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial delay between retries in milliseconds */
    initialDelay: number;
    /** Maximum delay between retries in milliseconds */
    maxDelay: number;
  };
}

/**
 * Interface for logging operations throughout the system.
 */
export interface Logger {
  /** Log debug level messages */
  debug(message: string, ...args: any[]): void;
  /** Log informational messages */
  info(message: string, ...args: any[]): void;
  /** Log warning messages */
  warn(message: string, ...args: any[]): void;
  /** Log error messages */
  error(message: string, ...args: any[]): void;
}

/**
 * Interface for client implementations that interact with AI models.
 */
export interface SwarmClient {
  /**
   * Creates a chat completion request.
   * @param params - Parameters for the completion request
   * @returns A promise containing the completion result
   */
  createChatCompletion(params: any): Promise<Result<any>>;
}
