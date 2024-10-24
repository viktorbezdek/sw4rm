/**
 * Command Line Interface implementation for the Swarm system.
 * Provides an interactive terminal interface for communicating with AI agents.
 */

import * as readline from "readline";
import { Swarm } from "./core";
import { Agent, Message, MessageRole, ResponseData, Result } from "./types";
import { DefaultLogger } from "./utils";

/**
 * CLI class that handles the interactive terminal interface.
 * Manages user input, displays responses, and coordinates communication with the Swarm system.
 */
export class CLI {
  private readonly logger = new DefaultLogger();
  private readonly rl: readline.Interface;
  private readonly swarm: Swarm;

  /**
   * Creates a new CLI instance.
   * @param config - Configuration object for the CLI
   * @param config.agent - The agent to interact with
   * @param config.contextVariables - Optional variables available to the agent
   * @param config.stream - Whether to stream responses
   * @param config.debug - Whether to enable debug logging
   */
  constructor(
    private readonly config: {
      agent: Agent;
      contextVariables?: Record<string, unknown>;
      stream?: boolean;
      debug?: boolean;
    },
  ) {
    this.swarm = new Swarm({ logger: this.logger });
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Processes streaming responses from the agent.
   * Handles the real-time display of agent responses and tool calls.
   *
   * @param generator - AsyncGenerator yielding response chunks
   * @returns Promise resolving to array of collected messages
   * @private
   */
  private async processStreamingResponse(
    generator: AsyncGenerator<any, Result<ResponseData>, unknown>,
  ): Promise<Message[]> {
    let content = "";
    let lastSender = "";
    const collectedMessages: Message[] = [];
    let currentMessage: Partial<Message> = {};
    try {
      for await (const chunk of generator) {
        if (!chunk) continue;

        if ("sender" in chunk) {
          lastSender = chunk.sender;
          if (currentMessage.sender !== lastSender) {
            if (Object.keys(currentMessage).length > 0) {
              collectedMessages.push(currentMessage as Message);
            }
            currentMessage = {
              role: MessageRole.Assistant,
              sender: lastSender,
              content: "",
              tool_calls: [],
            };
          }
        }

        if ("content" in chunk && chunk.content !== null) {
          if (!content && lastSender) {
            process.stdout.write(`\x1b[94m${lastSender}:\x1b[0m `);
            lastSender = "";
          }
          process.stdout.write(chunk.content);
          content += chunk.content;
          if (currentMessage.content !== undefined) {
            currentMessage.content += chunk.content;
          }
        }

        if ("tool_calls" in chunk && chunk.tool_calls) {
          for (const toolCall of chunk.tool_calls) {
            const name = toolCall.function?.name;
            if (!name) continue;
            console.log(`\x1b[94m${lastSender}: \x1b[95m${name}\x1b[0m()`);
            if (currentMessage.tool_calls) {
              currentMessage.tool_calls.push(toolCall);
            }
          }
        }

        if ("delim" in chunk && chunk.delim === "end" && content) {
          content = "";
        }
      }

      // Add the last message if it exists
      if (Object.keys(currentMessage).length > 0) {
        collectedMessages.push(currentMessage as Message);
      }
    } catch (error) {
      this.logger.error("Error processing stream:", error);
    }

    return collectedMessages;
  }

  /**
   * Formats and displays messages in a human-readable format.
   * Handles different message types and tool calls with color coding.
   *
   * @param messages - Array of messages to display
   * @private
   */
  private prettyPrintMessages(messages: Message[]): void {
    for (const message of messages) {
      if (message.role !== MessageRole.Assistant) continue;

      process.stdout.write(`\x1b[94m${message.sender}\x1b[0m: `);

      if (message.content) {
        console.log(message.content);
      }

      const toolCalls = message.tool_calls || [];
      if (toolCalls.length > 1) console.log();

      for (const toolCall of toolCalls) {
        const { name, arguments: args } = toolCall.function;
        const argStr = JSON.parse(args);
        console.log(`\x1b[95m${name}\x1b[0m(${JSON.stringify(argStr)})`);
      }
    }
  }

  /**
   * Starts the CLI interface and begins the interaction loop.
   * Handles user input, agent responses, and maintains conversation history.
   *
   * @example
   * ```ts
   * const cli = new CLI({
   *   agent: myAgent,
   *   stream: true
   * });
   * await cli.start();
   * ```
   */
  async start(): Promise<void> {
    console.log("Starting Swarm CLI 🐝");

    const messages: Message[] = [];
    let activeAgent = this.config.agent;

    while (true) {
      const userInput = await new Promise<string>((resolve) => {
        this.rl.question("\x1b[90mUser\x1b[0m: ", resolve);
      });

      messages.push({
        role: MessageRole.User,
        content: userInput,
        sender: "user",
      });

      const response = await this.swarm.run(
        activeAgent,
        messages,
        this.config.contextVariables || {},
        {
          stream: this.config.stream,
          executeTools: true,
        },
      );

      if (!response.success || !response.data) {
        this.logger.error("Error:", response.error);
        continue;
      }

      if (this.config.stream && response.data.messages) {
        const streamMessages = await this.processStreamingResponse(
          response.data.messages as unknown as AsyncGenerator<
            any,
            Result<ResponseData>,
            unknown
          >,
        );
        messages.push(...streamMessages);
      } else {
        this.prettyPrintMessages(response.data.messages);
        messages.push(...response.data.messages);
      }

      activeAgent = response.data.agent || activeAgent;
    }
  }

  /**
   * Stops the CLI interface and cleans up resources.
   * Closes the readline interface and any other open handles.
   */
  stop(): void {
    this.rl.close();
  }
}
