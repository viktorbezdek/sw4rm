import OpenAI from "openai";
import { EventEmitter } from "events";
import dotenv from "dotenv";
import type {
  Agent,
  Message,
  ResponseData,
  SwarmConfig,
  SwarmClient,
  Result,
  ToolCall,
  SwarmError,
} from "./types";
import { MessageRole } from "./types";
import { APIError, ToolExecutionError } from "./errors";
import {
  DefaultLogger,
  retry,
  parseArguments,
  mergeChunk,
  CTX_VARS_NAME,
} from "./utils";

// Load environment variables
dotenv.config();

/**
 * Implementation of the SwarmClient interface for OpenAI API interactions.
 * Handles communication with OpenAI's chat completion endpoints.
 */
export class OpenAIClient implements SwarmClient {
  /**
   * Creates a new OpenAIClient instance.
   * @param client - The initialized OpenAI client instance
   */
  constructor(private readonly client: OpenAI) {}

  /**
   * Creates a chat completion request to OpenAI's API.
   * @param params - The parameters for the chat completion request
   * @returns A Promise containing either the successful response or an error
   */
  async createChatCompletion(params: any): Promise<Result<any>> {
    try {
      const result = await this.client.chat.completions.create(params);
      return { success: true, data: result };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      return {
        success: false,
        error: new APIError("OpenAI API call failed", error as Error),
      };
    }
  }
}

/**
 * Main Swarm class that orchestrates the interaction between agents and the OpenAI API.
 * Extends EventEmitter to support event-based communication.
 */
export class Swarm extends EventEmitter {
  private readonly logger;
  private readonly client: SwarmClient;
  private readonly config: Required<SwarmConfig>;

  /**
   * Creates a new Swarm instance.
   * @param config - Configuration options for the Swarm instance
   * @throws Error if OPENAI_API_KEY environment variable is not set
   */
  constructor(config: SwarmConfig = {}) {
    super();
    this.logger = config.logger || new DefaultLogger();

    // Initialize OpenAI with API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });
    this.client = new OpenAIClient(openai);

    this.config = {
      logger: this.logger,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        ...config.retryConfig,
      },
    };

    this.logger.debug(
      "Initialized Swarm with OpenAI API key:",
      apiKey.substring(0, 10) + "...",
    );
  }

  /**
   * Gets a chat completion from the OpenAI API.
   * @param agent - The agent to use for the completion
   * @param history - Message history for context
   * @param contextVariables - Variables available to the completion
   * @param modelOverride - Optional model override
   * @param stream - Whether to stream the response
   * @returns A Promise containing the completion result
   * @private
   */
  private async getChatCompletion(
    agent: Agent,
    history: Message[],
    contextVariables: Record<string, unknown>,
    modelOverride: string | null,
    stream: boolean,
  ): Promise<Result<any>> {
    const instructions =
      typeof agent.instructions === "function"
        ? agent.instructions()
        : agent.instructions;

    const messages = [
      { role: MessageRole.System, content: instructions },
      ...history,
    ];

    this.logger.debug("Getting chat completion for:", { messages });

    const createParams = {
      model: modelOverride || agent.model,
      messages,
      stream,
      ...(agent.functions.length > 0 && {
        tools: agent.functions.map((f) => ({
          type: "function",
          function: {
            name: f.name,
            description: undefined,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        })),
        tool_choice: agent.toolChoice,
        parallel_tool_calls: agent.parallelToolCalls,
      }),
    };

    this.logger.debug("OpenAI request params:", createParams);

    const result = await retry(
      () => this.client.createChatCompletion(createParams),
      this.config.retryConfig,
      this.logger,
    );

    this.logger.debug("OpenAI response:", result);
    return result;
  }

  /**
   * Handles the execution of tool calls requested by the agent.
   * @param toolCalls - Array of tool calls to execute
   * @param agent - The agent making the tool calls
   * @param contextVariables - Context variables available to the tools
   * @returns A Promise containing the result of tool executions
   * @private
   */
  private async handleToolCalls(
    toolCalls: ToolCall[],
    agent: Agent,
    contextVariables: Record<string, unknown>,
  ): Promise<Result<ResponseData>> {
    const response: ResponseData = {
      messages: [],
      agent: null,
      contextVariables: { ...contextVariables },
    };

    for (const toolCall of toolCalls) {
      const { name } = toolCall.function;
      const func = agent.functions.find((f) => f.name === name);

      if (!func) {
        this.logger.warn(`Tool ${name} not found`);
        response.messages.push({
          role: MessageRole.Tool,
          content: `Error: Tool ${name} not found.`,
          tool_call_id: toolCall.id,
        });
        continue;
      }

      try {
        const args = parseArguments(toolCall.function.arguments);
        if (func.toString().includes(CTX_VARS_NAME)) {
          args[CTX_VARS_NAME] = contextVariables;
        }

        const result = await func(args);
        response.messages.push({
          role: MessageRole.Tool,
          content: typeof result === "string" ? result : JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      } catch (error) {
        throw new ToolExecutionError(
          `Failed to execute tool ${name}: ${(error as Error).message}`,
          error as Error,
        );
      }
    }

    return { success: true, data: response };
  }

  /**
   * Runs an agent with the given messages and context.
   * @param agent - The agent to run
   * @param messages - Initial messages to provide context
   * @param contextVariables - Variables available to the agent
   * @param options - Additional options for the run
   * @returns A Promise containing the result of the agent run
   */
  async run(
    agent: Agent,
    messages: Message[],
    contextVariables: Record<string, unknown> = {},
    options: {
      modelOverride?: string;
      stream?: boolean;
      maxTurns?: number;
      executeTools?: boolean;
    } = {},
  ): Promise<Result<ResponseData>> {
    const {
      modelOverride = null,
      stream = false,
      maxTurns = Infinity,
      executeTools = true,
    } = options;

    if (stream) {
      const streamResult = await this.runStream(
        agent,
        messages,
        contextVariables,
        options,
      );
      return streamResult;
    }

    let activeAgent = agent;
    const context = { ...contextVariables };
    const history = [...messages];
    const initLen = messages.length;

    try {
      while (history.length - initLen < maxTurns && activeAgent) {
        const completion = await this.getChatCompletion(
          activeAgent,
          history,
          context,
          modelOverride,
          false,
        );

        if (!completion.success) {
          return completion;
        }

        const message = completion.data.choices[0].message;
        message.sender = activeAgent.name;
        history.push(message);

        if (!message.tool_calls || !executeTools) {
          break;
        }

        const toolResult = await this.handleToolCalls(
          message.tool_calls,
          activeAgent,
          context,
        );

        if (!toolResult.success || !toolResult.data) {
          return toolResult;
        }

        history.push(...toolResult.data.messages);
        Object.assign(context, toolResult.data.contextVariables);

        if (toolResult.data.agent) {
          activeAgent = toolResult.data.agent;
        }
      }

      return {
        success: true,
        data: {
          messages: history.slice(initLen),
          agent: activeAgent,
          contextVariables: context,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        const swarmError: SwarmError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: "UNKNOWN_ERROR",
        };
        return {
          success: false,
          error: swarmError,
        };
      }
      return {
        success: false,
        error: {
          name: "UnknownError",
          message: String(error),
          code: "UNKNOWN_ERROR",
        },
      };
    }
  }

  /**
   * Generator function that yields streaming responses from the agent.
   * @param agent - The agent to run
   * @param messages - Initial messages to provide context
   * @param contextVariables - Variables available to the agent
   * @param options - Additional options for the stream
   * @yields Chunks of the agent's response
   * @private
   */
  private async *streamGenerator(
    agent: Agent,
    messages: Message[],
    contextVariables: Record<string, unknown>,
    options: {
      modelOverride?: string;
      maxTurns?: number;
      executeTools?: boolean;
    },
  ): AsyncGenerator<any, Result<ResponseData>, unknown> {
    const {
      modelOverride = null,
      maxTurns = Infinity,
      executeTools = true,
    } = options;

    let activeAgent = agent;
    const context = { ...contextVariables };
    const history = [...messages];
    const initLen = messages.length;

    try {
      while (history.length - initLen < maxTurns) {
        const message: Message = {
          content: "",
          sender: agent.name,
          role: MessageRole.Assistant,
          tool_calls: null,
        };

        const completion = await this.getChatCompletion(
          activeAgent,
          history,
          context,
          modelOverride,
          true,
        );

        if (!completion.success) {
          return completion;
        }

        yield { delim: "start" };

        for await (const chunk of completion.data) {
          const delta = chunk.choices[0].delta;
          if (delta.role === MessageRole.Assistant) {
            delta.sender = activeAgent.name;
          }
          yield delta;

          delete delta.role;
          delete delta.sender;
          mergeChunk(message, delta);
        }

        yield { delim: "end" };

        message.tool_calls = Object.values(message.tool_calls || {});
        if (!message.tool_calls.length) {
          message.tool_calls = null;
        }

        this.logger.debug("Received completion:", message);
        history.push(message);

        if (!message.tool_calls || !executeTools) {
          this.logger.debug("Ending turn.");
          break;
        }

        const toolResult = await this.handleToolCalls(
          message.tool_calls,
          activeAgent,
          context,
        );

        if (!toolResult.success || !toolResult.data) {
          return toolResult;
        }

        history.push(...toolResult.data.messages);
        Object.assign(context, toolResult.data.contextVariables);

        if (toolResult.data.agent) {
          activeAgent = toolResult.data.agent;
        }
      }

      return {
        success: true,
        data: {
          messages: history.slice(initLen),
          agent: activeAgent,
          contextVariables: context,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        const swarmError: SwarmError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: "UNKNOWN_ERROR",
        };
        return {
          success: false,
          error: swarmError,
        };
      }
      return {
        success: false,
        error: {
          name: "UnknownError",
          message: String(error),
          code: "UNKNOWN_ERROR",
        },
      };
    }
  }

  /**
   * Runs an agent in streaming mode, yielding responses as they become available.
   * @param agent - The agent to run
   * @param messages - Initial messages to provide context
   * @param contextVariables - Variables available to the agent
   * @param options - Additional options for the stream
   * @returns A Promise containing the final result of the streaming run
   */
  async runStream(
    agent: Agent,
    messages: Message[],
    contextVariables: Record<string, unknown> = {},
    options: {
      modelOverride?: string;
      maxTurns?: number;
      executeTools?: boolean;
    } = {},
  ): Promise<Result<ResponseData>> {
    try {
      const generator = this.streamGenerator(
        agent,
        messages,
        contextVariables,
        options,
      );
      const result = await generator.next();

      if (result.done && result.value) {
        return result.value;
      }

      return {
        success: true,
        data: {
          messages: [],
          agent: null,
          contextVariables: {},
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        const swarmError: SwarmError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: "UNKNOWN_ERROR",
        };
        return {
          success: false,
          error: swarmError,
        };
      }
      return {
        success: false,
        error: {
          name: "UnknownError",
          message: String(error),
          code: "UNKNOWN_ERROR",
        },
      };
    }
  }
}
