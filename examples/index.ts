/**
 * Example implementation demonstrating how to use the Swarm system
 * with a multi-tool agent in a CLI environment.
 *
 * This example shows:
 * 1. How to configure and initialize the CLI
 * 2. How to set up context variables
 * 3. How to handle errors and graceful shutdown
 * 4. How to provide user instructions and examples
 */

import { CLI } from "../src/cli";
import { multiToolAgent } from "./agent";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: __dirname + "/../.env" });

/**
 * Main function that initializes and runs the CLI interface.
 * Sets up the multi-tool agent with context variables and starts
 * an interactive session.
 *
 * @throws Will throw an error if CLI initialization or execution fails
 */
async function main() {
  // Initialize the CLI with the multi-tool agent and configuration
  const cli = new CLI({
    // Use the pre-configured multi-tool agent
    agent: multiToolAgent,

    // Provide context variables available to the agent
    contextVariables: {
      // Get user's timezone for location-aware responses
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Set default language for responses
      language: "en",
    },

    // Disable streaming for cleaner output in this example
    stream: false,

    // Enable debug mode for detailed logging
    debug: true,
  });

  // Display welcome message and usage instructions
  console.log(`
🔧 Multi-Tool Assistant Ready!
Available functions:
- calculate: Evaluate mathematical expressions
- getWeather: Get current weather for a location
- searchWeb: Search the web for information
- analyzeData: Analyze numerical data
- convertUnits: Convert between different units

Try some examples:
1. "What's the weather in London and convert the temperature to Fahrenheit?"
2. "Calculate 15% of 85 and then analyze the following data: [85, 90, 75, 95, 88]"
3. "Search for recent news about renewable energy and summarize the findings"
4. "Convert 10 km to miles and get the weather for that distance around New York"

Type your question below:
`);

  try {
    // Start the CLI interface and begin accepting user input
    await cli.start();
  } catch (error) {
    // Handle any fatal errors that occur during execution
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Execute the main function
main();
