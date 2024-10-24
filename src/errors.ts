/**
 * Custom error classes for the Swarm system.
 * Each error implements the SwarmError interface and provides specific error codes
 * for different types of failures that can occur during system operation.
 */

import type { SwarmError } from "./types";

/**
 * Error thrown when validation fails for inputs, configurations, or other data structures.
 * Used to indicate that data does not meet expected format or constraints.
 *
 * @example
 * ```ts
 * throw new ValidationError('Invalid agent configuration: missing required field "name"');
 * ```
 */
export class ValidationError extends Error implements SwarmError {
  code = "VALIDATION_ERROR";

  /**
   * Creates a new ValidationError instance.
   * @param message - Detailed description of what validation failed
   * @param cause - Optional underlying error that caused the validation failure
   */
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when API operations fail, typically during communication with OpenAI
 * or other external services. Used to wrap and enhance API-specific errors with
 * additional context.
 *
 * @example
 * ```ts
 * throw new APIError('Failed to create chat completion', originalError);
 * ```
 */
export class APIError extends Error implements SwarmError {
  code = "API_ERROR";

  /**
   * Creates a new APIError instance.
   * @param message - Description of the API failure
   * @param cause - Optional underlying error from the API call
   */
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Error thrown when a tool/function execution fails. Used to indicate that a
 * requested operation could not be completed by the tool implementation.
 *
 * @example
 * ```ts
 * throw new ToolExecutionError('Failed to read file: permission denied', fsError);
 * ```
 */
export class ToolExecutionError extends Error implements SwarmError {
  code = "TOOL_EXECUTION_ERROR";

  /**
   * Creates a new ToolExecutionError instance.
   * @param message - Description of what failed during tool execution
   * @param cause - Optional underlying error that caused the tool execution to fail
   */
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

/**
 * Error thrown when an operation exceeds its allocated time limit.
 * Used to indicate that a process took too long to complete and was terminated.
 *
 * @example
 * ```ts
 * throw new TimeoutError('Operation timed out after 30 seconds');
 * ```
 */
export class TimeoutError extends Error implements SwarmError {
  code = "TIMEOUT_ERROR";

  /**
   * Creates a new TimeoutError instance.
   * @param message - Description of what operation timed out
   * @param cause - Optional underlying error related to the timeout
   */
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}
