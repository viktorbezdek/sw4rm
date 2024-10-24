import { Interface as ReadlineInterface } from "node:readline";
import * as readline from "readline";
import { CLI } from "../cli";
import { Swarm } from "../core";
import { ValidationError } from "../errors";
import { MessageRole, ResponseData, Result, ToolChoice } from "../types";

// Mock readline
jest.mock("readline");

// Mock Swarm
jest.mock("../core", () => ({
  Swarm: jest.fn().mockImplementation(() => ({
    run: jest
      .fn()
      .mockImplementation(
        async (agent, messages, contextVariables, options) => {
          // Default mock implementation returns empty success response
          return {
            success: true,
            data: {
              messages: [],
              agent: agent,
              contextVariables: contextVariables,
            },
          };
        },
      ),
  })),
}));

describe("CLI", () => {
  let cli: CLI;
  let mockRl: jest.Mocked<ReadlineInterface>;
  let mockSwarm: jest.Mocked<{ run: jest.Mock }>;
  let stdoutSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let mockAnswer: string;

  const mockAgent = {
    name: "test-agent",
    model: "gpt-4o-mini",
    instructions: "Test instructions",
    functions: [] as ((...args: unknown[]) => unknown)[],
    toolChoice: ToolChoice.Auto as const,
    parallelToolCalls: false,
  };

  beforeEach(() => {
    mockAnswer = "";
    // Create a mock question function that handles both 2 and 3 argument cases
    const mockQuestionFn = jest.fn(
      (
        query: string,
        optionsOrCallback:
          | ((answer: string) => void)
          | { signal?: AbortSignal },
        maybeCallback?: (answer: string) => void,
      ) => {
        const callback =
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback;
        if (callback) {
          callback(mockAnswer);
        }
        return mockRl;
      },
    );

    // Mock readline interface
    mockRl = {
      question: mockQuestionFn,
      close: jest.fn(),
      write: jest.fn(),
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      pause: jest.fn(),
      resume: jest.fn(),
      removeListener: jest.fn(),
      addListener: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      eventNames: jest.fn(),
      getMaxListeners: jest.fn(),
      listenerCount: jest.fn(),
      listeners: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      rawListeners: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
    } as unknown as jest.Mocked<ReadlineInterface>;

    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);

    // Mock Swarm
    mockSwarm = (Swarm as unknown as jest.Mock).mock.results[0]?.value || {
      run: jest.fn(),
    };

    // Mock stdout and console.log
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    cli = new CLI({
      agent: mockAgent,
      stream: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    stdoutSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should initialize correctly", () => {
    expect(readline.createInterface).toHaveBeenCalled();
    expect(Swarm).toHaveBeenCalled();
  });

  it("should handle basic user input and response", async () => {
    const userInput = "Hello";
    mockAnswer = userInput;

    const mockResponse: Result<ResponseData> = {
      success: true,
      data: {
        messages: [
          {
            role: MessageRole.Assistant,
            content: "Hi there!",
            sender: "test-agent",
            tool_calls: null,
          },
        ],
        agent: mockAgent,
        contextVariables: {},
      },
    };

    mockSwarm.run.mockResolvedValueOnce(mockResponse);

    // Set up stop after first interaction
    mockRl.question.mockImplementationOnce((...args) => {
      const result = mockRl.question(...args);
      cli.stop();
      return result;
    });

    await cli.start();

    expect(mockRl.question).toHaveBeenCalled();
    expect(mockSwarm.run).toHaveBeenCalledWith(
      mockAgent,
      expect.arrayContaining([
        {
          role: MessageRole.User,
          content: userInput,
          sender: "user",
        },
      ]),
      {},
      expect.any(Object),
    );
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("test-agent"),
    );
  });

  it("should handle tool calls in response", async () => {
    const userInput = "Use tool";
    mockAnswer = userInput;

    const mockResponse: Result<ResponseData> = {
      success: true,
      data: {
        messages: [
          {
            role: MessageRole.Assistant,
            content: "",
            sender: "test-agent",
            tool_calls: [
              {
                id: "call-1",
                type: "function" as const,
                function: {
                  name: "testTool",
                  arguments: "{}",
                },
              },
            ],
          },
        ],
        agent: mockAgent,
        contextVariables: {},
      },
    };

    mockSwarm.run.mockResolvedValueOnce(mockResponse);

    // Set up stop after first interaction
    mockRl.question.mockImplementationOnce((...args) => {
      const result = mockRl.question(...args);
      cli.stop();
      return result;
    });

    await cli.start();

    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("testTool"));
  });

  it("should handle streaming responses", async () => {
    cli = new CLI({
      agent: mockAgent,
      stream: true,
    });

    const userInput = "Hello";
    mockAnswer = userInput;

    const mockStreamResponse: Result<ResponseData> = {
      success: true,
      data: {
        messages: [
          {
            role: MessageRole.Assistant,
            content: "Hi",
            sender: "test-agent",
            tool_calls: null,
          },
        ],
        agent: mockAgent,
        contextVariables: {},
      },
    };

    mockSwarm.run.mockResolvedValueOnce(mockStreamResponse);

    // Set up stop after first interaction
    mockRl.question.mockImplementationOnce((...args) => {
      const result = mockRl.question(...args);
      cli.stop();
      return result;
    });

    await cli.start();

    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("test-agent"),
    );
  });

  it("should handle errors", async () => {
    const userInput = "Hello";
    mockAnswer = userInput;

    const mockError: Result<ResponseData> = {
      success: false,
      error: new ValidationError("Test error"),
    };

    mockSwarm.run.mockResolvedValueOnce(mockError);

    // Set up stop after first interaction
    mockRl.question.mockImplementationOnce((...args) => {
      const result = mockRl.question(...args);
      cli.stop();
      return result;
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await cli.start();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should stop correctly", () => {
    cli.stop();
    expect(mockRl.close).toHaveBeenCalled();
  });
});
