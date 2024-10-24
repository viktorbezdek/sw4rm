import * as SwarmExports from "../index";
import { Swarm } from "../core";
import { CLI } from "../cli";
import { MessageRole, ToolChoice } from "../types";
import {
  ValidationError,
  APIError,
  ToolExecutionError,
  TimeoutError,
} from "../errors";
import {
  DefaultLogger,
  retry,
  parseArguments,
  mergeFields,
  mergeChunk,
} from "../utils";

describe("Swarm exports", () => {
  it("should export core functionality", () => {
    expect(SwarmExports.Swarm).toBeDefined();
    expect(SwarmExports.Swarm).toBe(Swarm);
    expect(SwarmExports.CLI).toBeDefined();
    expect(SwarmExports.CLI).toBe(CLI);
  });

  it("should export types and enums", () => {
    expect(SwarmExports.MessageRole).toBeDefined();
    expect(SwarmExports.MessageRole.System).toBe(MessageRole.System);
    expect(SwarmExports.MessageRole.User).toBe(MessageRole.User);
    expect(SwarmExports.MessageRole.Assistant).toBe(MessageRole.Assistant);
    expect(SwarmExports.MessageRole.Tool).toBe(MessageRole.Tool);

    expect(SwarmExports.ToolChoice).toBeDefined();
    expect(SwarmExports.ToolChoice.None).toBe(ToolChoice.None);
    expect(SwarmExports.ToolChoice.Auto).toBe(ToolChoice.Auto);
    expect(SwarmExports.ToolChoice.Function).toBe(ToolChoice.Function);
  });

  it("should export error classes", () => {
    expect(SwarmExports.ValidationError).toBeDefined();
    expect(SwarmExports.ValidationError).toBe(ValidationError);
    expect(SwarmExports.APIError).toBeDefined();
    expect(SwarmExports.APIError).toBe(APIError);
    expect(SwarmExports.ToolExecutionError).toBeDefined();
    expect(SwarmExports.ToolExecutionError).toBe(ToolExecutionError);
    expect(SwarmExports.TimeoutError).toBeDefined();
    expect(SwarmExports.TimeoutError).toBe(TimeoutError);
  });

  it("should export utility functions and classes", () => {
    expect(SwarmExports.DefaultLogger).toBeDefined();
    expect(SwarmExports.DefaultLogger).toBe(DefaultLogger);
    expect(SwarmExports.retry).toBeDefined();
    expect(SwarmExports.retry).toBe(retry);
    expect(SwarmExports.parseArguments).toBeDefined();
    expect(SwarmExports.parseArguments).toBe(parseArguments);
    expect(SwarmExports.mergeFields).toBeDefined();
    expect(SwarmExports.mergeFields).toBe(mergeFields);
    expect(SwarmExports.mergeChunk).toBeDefined();
    expect(SwarmExports.mergeChunk).toBe(mergeChunk);
  });

  it("should export all type definitions", () => {
    // We can't directly test types at runtime, but we can verify they're exported
    // by checking they exist in the exports object
    const exportedTypeNames = [
      "Agent",
      "Message",
      "SwarmConfig",
      "SwarmClient",
      "Logger",
      "Result",
      "ResponseData",
      "ToolCall",
      "FunctionDefinition",
    ];

    exportedTypeNames.forEach((typeName) => {
      expect(typeName in SwarmExports).toBe(true);
    });
  });
});
