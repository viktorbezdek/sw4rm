import { OpenAIClient, Swarm } from "../core";
import { MessageRole, ToolChoice } from "../types";
import { APIError, ToolExecutionError } from "../errors";
import OpenAI from "openai";

// Mock OpenAI
jest.mock("openai");

describe("OpenAIClient", () => {
  let mockOpenAI: jest.Mocked<OpenAI>;
  let client: OpenAIClient;

  beforeEach(() => {
    mockOpenAI = new OpenAI({ apiKey: "test" }) as jest.Mocked<OpenAI>;
    client = new OpenAIClient(mockOpenAI);
  });

  it("should successfully create chat completion", async () => {
    const mockResponse = { id: "test", choices: [] };
    mockOpenAI.chat.completions.create = jest
      .fn()
      .mockResolvedValue(mockResponse);

    const result = await client.createChatCompletion({});
    expect(result.success).toBe(true);
    expect(result.data).toBe(mockResponse);
  });

  it("should handle API errors", async () => {
    const mockError = new Error("API Error");
    mockOpenAI.chat.completions.create = jest.fn().mockRejectedValue(mockError);

    const result = await client.createChatCompletion({});
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(APIError);
  });
});

describe("Swarm", () => {
  let swarm: Swarm;
  const mockAgent = {
    name: "test-agent",
    model: "gpt-4o-mini",
    instructions: "Test instructions",
    functions: [] as ((...args: unknown[]) => unknown)[],
    toolChoice: ToolChoice.Auto as const,
    parallelToolCalls: false,
  };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    swarm = new Swarm();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if API key is not set", () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => new Swarm()).toThrow(
      "OPENAI_API_KEY environment variable is not set",
    );
  });

  it("should run agent without tools", async () => {
    const mockMessages = [{ role: MessageRole.User, content: "Hello" }];
    const mockResponse = {
      choices: [
        {
          message: {
            role: MessageRole.Assistant,
            content: "Hi there!",
            tool_calls: null,
          },
        },
      ],
    };

    // @ts-expect-error - Mocking private client
    swarm.client.createChatCompletion = jest.fn().mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const result = await swarm.run(mockAgent, mockMessages);
    expect(result.success).toBe(true);
    expect(result.data?.messages[0].content).toBe("Hi there!");
  });

  it("should handle tool execution", async () => {
    const mockFunction = jest.fn().mockResolvedValue("Tool result");
    const agentWithTool = {
      ...mockAgent,
      functions: [mockFunction] as ((...args: unknown[]) => unknown)[],
    };

    const mockMessages = [{ role: MessageRole.User, content: "Use tool" }];
    const mockResponse = {
      choices: [
        {
          message: {
            role: MessageRole.Assistant,
            content: "",
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: {
                  name: "testTool",
                  arguments: "{}",
                },
              },
            ],
          },
        },
      ],
    };

    // @ts-expect-error - Mocking private client
    swarm.client.createChatCompletion = jest.fn().mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const result = await swarm.run(agentWithTool, mockMessages);
    expect(result.success).toBe(true);
    expect(mockFunction).toHaveBeenCalled();
  });

  it("should handle tool execution errors", async () => {
    const mockFunction = jest.fn().mockRejectedValue(new Error("Tool failed"));
    const agentWithTool = {
      ...mockAgent,
      functions: [mockFunction] as ((...args: unknown[]) => unknown)[],
    };

    const mockMessages = [{ role: MessageRole.User, content: "Use tool" }];
    const mockResponse = {
      choices: [
        {
          message: {
            role: MessageRole.Assistant,
            content: "",
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: {
                  name: "testTool",
                  arguments: "{}",
                },
              },
            ],
          },
        },
      ],
    };

    // @ts-expect-error - Mocking private client
    swarm.client.createChatCompletion = jest.fn().mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const result = await swarm.run(agentWithTool, mockMessages);
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ToolExecutionError);
  });

  it("should handle streaming mode", async () => {
    const mockMessages = [{ role: MessageRole.User, content: "Hello" }];
    const mockStream = {
      choices: [
        {
          delta: {
            role: MessageRole.Assistant,
            content: "Hi",
          },
        },
      ],
    };

    // @ts-expect-error - Mocking private client
    swarm.client.createChatCompletion = jest.fn().mockResolvedValue({
      success: true,
      data: [mockStream],
    });

    const result = await swarm.run(
      mockAgent,
      mockMessages,
      {},
      { stream: true },
    );
    expect(result.success).toBe(true);
  });
});
