/**
 * Main entry point for the Swarm TypeScript library.
 * Exports all public interfaces, types, and classes.
 *
 * @module swarm-ts
 */

// Core functionality
export { Swarm } from "./core";
export { CLI } from "./cli";

// Types and interfaces
export {
  Agent,
  Message,
  MessageRole,
  ToolChoice,
  SwarmConfig,
  SwarmClient,
  Logger,
  Result,
  ResponseData,
  ToolCall,
  FunctionDefinition,
} from "./types";

// Error classes
export {
  ValidationError,
  APIError,
  ToolExecutionError,
  TimeoutError,
} from "./errors";

// Utility functions and classes
export {
  DefaultLogger,
  retry,
  parseArguments,
  mergeFields,
  mergeChunk,
} from "./utils";
