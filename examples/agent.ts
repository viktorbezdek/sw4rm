/**
 * Example agent configuration demonstrating multi-tool capabilities.
 * This file shows how to create an agent with multiple tools and custom instructions.
 */

import type { Agent } from "../src/types";
import * as functions from "./functions";

/**
 * Example agent configuration with multiple tools for various tasks.
 * This agent can perform calculations, get weather data, search the web,
 * analyze numerical data, and convert between units.
 *
 * @example
 * ```ts
 * import { Swarm } from '../src/core';
 * import { multiToolAgent } from './agent';
 *
 * const swarm = new Swarm();
 * const result = await swarm.run(multiToolAgent, messages);
 * ```
 */
export const multiToolAgent: Agent = {
  /** Name identifier for the agent */
  name: "MultiToolAssistant",

  /** The model to use for this agent (e.g., GPT-4) */
  model: "gpt-4o",

  /**
   * System instructions that define the agent's behavior and capabilities.
   * These instructions guide the agent on how to use its available tools
   * and how to structure its responses.
   */
  instructions: `You are a helpful assistant with access to various tools. You can:
- Calculate mathematical expressions
- Get current weather information
- Search the web
- Analyze numerical data
- Convert between units

Use these tools to provide accurate and helpful responses. When using multiple tools, 
wait for each tool's response before proceeding with the next step of your analysis.
You should chain tools together when it makes sense to provide comprehensive answers.

Please format your responses clearly and explain your thought process when combining 
multiple tools.`,

  /**
   * Array of functions available to the agent.
   * Each function is wrapped to handle type conversion and parameter passing.
   */
  functions: [
    /**
     * Calculates the result of a mathematical expression.
     * @param args - First argument contains the expression to calculate
     * @returns The calculated result
     */
    async function calculate(...args: unknown[]) {
      const params = args[0] as { expression: string };
      return functions.calculate(params.expression);
    },

    /**
     * Retrieves weather information for a specified location.
     * @param args - First argument contains the location to get weather for
     * @returns Weather information for the specified location
     */
    async function getWeather(...args: unknown[]) {
      const params = args[0] as { location: string };
      return functions.getWeather(params.location);
    },

    /**
     * Performs a web search with the specified query.
     * @param args - First argument contains the search query and optional number of results
     * @returns Search results from the web
     */
    async function searchWeb(...args: unknown[]) {
      const params = args[0] as { query: string; numResults?: number };
      return functions.searchWeb(params.query, params.numResults);
    },

    /**
     * Analyzes an array of numerical data.
     * @param args - First argument contains the array of numbers to analyze
     * @returns Statistical analysis of the data
     */
    async function analyzeData(...args: unknown[]) {
      const params = args[0] as { data: number[] };
      return functions.analyzeData(params.data);
    },

    /**
     * Converts a value between different units of measurement.
     * @param args - First argument contains the value and units to convert between
     * @returns The converted value
     */
    async function convertUnits(...args: unknown[]) {
      const params = args[0] as {
        value: number;
        fromUnit: string;
        toUnit: string;
      };
      return functions.convertUnits(
        params.value,
        params.fromUnit,
        params.toUnit,
      );
    },
  ],

  /**
   * Whether the agent can execute multiple tools in parallel.
   * When true, the agent can make multiple tool calls simultaneously
   * for better performance when tools don't depend on each other.
   */
  parallelToolCalls: true,
};
