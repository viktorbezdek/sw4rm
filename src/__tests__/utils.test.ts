import {
  DefaultLogger,
  mergeFields,
  mergeChunk,
  parseArguments,
} from "../utils";
import { ValidationError } from "../errors";

describe("DefaultLogger", () => {
  let logger: DefaultLogger;
  let consoleLogSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]]
  >;
  let consoleErrorSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]]
  >;

  beforeEach(() => {
    logger = new DefaultLogger();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should log debug messages", () => {
    logger.debug("test debug");
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should log error messages", () => {
    logger.error("test error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe("mergeFields", () => {
  it("should merge string fields", () => {
    const target: Record<string, any> = { text: "Hello" };
    const source: Record<string, any> = { text: " World" };
    mergeFields(target, source);
    expect(target.text).toBe("Hello World");
  });

  it("should handle nested objects", () => {
    const target: Record<string, any> = { nested: { value: "test" } };
    const source: Record<string, any> = { nested: { value: "123" } };
    mergeFields(target, source);
    expect(target.nested.value).toBe("test123");
  });
});

describe("mergeChunk", () => {
  it("should merge content chunks", () => {
    const finalResponse: Record<string, any> = { content: "Hello" };
    const delta: Record<string, any> = { content: " World" };
    mergeChunk(finalResponse, delta);
    expect(finalResponse.content).toBe("Hello World");
  });

  it("should handle tool calls", () => {
    const finalResponse: Record<string, any> = { tool_calls: {} };
    const delta: Record<string, any> = {
      tool_calls: [
        {
          index: 0,
          id: "123",
          type: "function",
          function: { name: "test", arguments: "{}" },
        },
      ],
    };
    mergeChunk(finalResponse, delta);

    const toolCalls = finalResponse.tool_calls as Record<string, any>;
    expect(toolCalls[0]).toBeDefined();
    expect(toolCalls[0].id).toBe("123");
  });
});

describe("parseArguments", () => {
  it("should parse valid JSON arguments", () => {
    const args = parseArguments('{"name": "test", "value": 123}');
    expect(args).toEqual({ name: "test", value: 123 });
  });

  it("should throw ValidationError for invalid JSON", () => {
    expect(() => parseArguments("invalid json")).toThrow(ValidationError);
  });
});
