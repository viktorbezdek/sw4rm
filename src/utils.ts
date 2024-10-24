/**
 * Utility functions and classes for the Swarm system.
 * This module provides common functionality used across the application,
 * including logging, data manipulation, and error handling utilities.
 */

import { inspect } from "util";
import type { Logger, SwarmConfig } from "./types";
import { ValidationError } from "./errors";

/** Special variable name used to pass context variables to tool functions */
export const CTX_VARS_NAME = "context_variables";

/**
 * Default implementation of the Logger interface.
 * Provides colored console output with timestamps for different log levels.
 */
export class DefaultLogger implements Logger {
  /**
   * Logs debug level messages with detailed object inspection.
   * @param message - The main message to log
   * @param args - Additional arguments to be stringified and logged
   */
  debug(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    const formattedArgs = args
      .map((arg) =>
        typeof arg === "object" ? inspect(arg, { depth: null }) : String(arg),
      )
      .join(" ");
    console.log(
      `\x1b[97m[\x1b[90m${timestamp}\x1b[90m DEBUG\x1b[97m]\x1b[90m ${message} ${formattedArgs}\x1b[0m`,
    );
  }

  /**
   * Logs informational messages.
   * @param message - The main message to log
   * @param args - Additional arguments to be logged
   */
  info(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    console.log(
      `\x1b[97m[\x1b[90m${timestamp}\x1b[90m INFO\x1b[97m]\x1b[90m ${message}\x1b[0m`,
      ...args,
    );
  }

  /**
   * Logs warning messages in yellow.
   * @param message - The warning message to log
   * @param args - Additional arguments to be logged
   */
  warn(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    console.log(
      `\x1b[97m[\x1b[90m${timestamp}\x1b[90m WARN\x1b[97m]\x1b[33m ${message}\x1b[0m`,
      ...args,
    );
  }

  /**
   * Logs error messages in red.
   * @param message - The error message to log
   * @param args - Additional arguments to be logged
   */
  error(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    console.error(
      `\x1b[97m[\x1b[90m${timestamp}\x1b[90m ERROR\x1b[97m]\x1b[31m ${message}\x1b[0m`,
      ...args,
    );
  }
}

/**
 * Recursively merges fields from source into target object.
 * Used primarily for handling streaming responses where data arrives in chunks.
 *
 * @param target - The object to merge into
 * @param source - The object to merge from
 *
 * @example
 * ```ts
 * const target = { text: 'Hello' };
 * const source = { text: ' World' };
 * mergeFields(target, source);
 * // target is now { text: 'Hello World' }
 * ```
 */
export function mergeFields(
  target: Record<string, any>,
  source: Record<string, any>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") {
      target[key] = (target[key] || "") + value;
    } else if (value !== null && typeof value === "object") {
      if (!target[key]) target[key] = {};
      mergeFields(target[key], value);
    }
  }
}

/**
 * Merges a chunk of streaming response data into the final response object.
 * Handles special cases like tool calls and maintains proper structure.
 *
 * @param finalResponse - The accumulated response object
 * @param delta - The new chunk of data to merge
 *
 * @example
 * ```ts
 * const finalResponse = { content: 'Hello' };
 * const delta = { content: ' World' };
 * mergeChunk(finalResponse, delta);
 * // finalResponse is now { content: 'Hello World' }
 * ```
 */
export function mergeChunk(
  finalResponse: Record<string, any>,
  delta: Record<string, any>,
): void {
  delete delta.role;
  mergeFields(finalResponse, delta);

  const toolCalls = delta.tool_calls;
  if (toolCalls?.length > 0) {
    const index = toolCalls[0].index;
    delete toolCalls[0].index;
    if (!finalResponse.tool_calls) finalResponse.tool_calls = {};
    if (!finalResponse.tool_calls[index]) {
      finalResponse.tool_calls[index] = {
        function: { arguments: "", name: "" },
        id: toolCalls[0].id || "",
        type: "",
      };
    } else {
      // Directly assign id instead of merging
      if (toolCalls[0].id) {
        finalResponse.tool_calls[index].id = toolCalls[0].id;
      }
    }
    // Remove id from toolCalls to prevent merging
    const { id, ...restToolCall } = toolCalls[0];
    mergeFields(finalResponse.tool_calls[index], restToolCall);
  }
}

/**
 * Retries an asynchronous operation with exponential backoff.
 * Useful for handling transient failures in network operations.
 *
 * @param operation - The async operation to retry
 * @param config - Configuration for retry behavior
 * @param logger - Logger instance for tracking retry attempts
 * @returns Promise resolving to the operation result
 * @throws The last error encountered if all retries fail
 *
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000, maxDelay: 5000 },
 *   logger
 * );
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  config: Required<SwarmConfig>["retryConfig"],
  logger: Logger,
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Operation failed (attempt ${attempt}/${config.maxRetries}): ${lastError.message}`,
      );

      if (attempt < config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, config.maxDelay);
      }
    }
  }

  if (!lastError) {
    lastError = new Error("Operation failed with unknown error");
  }
  throw lastError;
}

/**
 * Parses a JSON string into an object of arguments.
 * Used primarily for parsing function arguments in tool calls.
 *
 * @param argsStr - JSON string containing function arguments
 * @returns Parsed object of arguments
 * @throws ValidationError if parsing fails
 *
 * @example
 * ```ts
 * const args = parseArguments('{"name": "test", "value": 123}');
 * // args is { name: "test", value: 123 }
 * ```
 */
export function parseArguments(argsStr: string): Record<string, unknown> {
  try {
    return JSON.parse(argsStr);
  } catch (error) {
    throw new ValidationError(
      `Failed to parse function arguments: ${argsStr}`,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
