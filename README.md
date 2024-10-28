<img src="public/swarm-logo.svg" width="200"/><br/><br/>

# Swarm TypeScript

A powerful TypeScript library for building AI agents with tool-use capabilities. Swarm enables you to create intelligent agents that can use multiple tools, chain operations together, and handle complex multi-step tasks.

Inspired by [openai/swarm](https://github.com/openai/swarm).

## Demo

<img src="public/demo.gif"/>

## Features

- 🛠 **Multi-Tool Support**: Create agents with access to multiple tools and functions
- 🔄 **Tool Chaining**: Intelligently chain multiple operations together
- 🌊 **Streaming Support**: Real-time streaming of agent responses
- 🎯 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🔍 **Smart Context**: Pass and maintain context variables across operations
- ⚡ **Parallel Execution**: Support for parallel tool calls when possible
- 🐛 **Error Handling**: Robust error handling and retry mechanisms
- 📝 **Logging**: Configurable logging system for debugging

## Installation

You can install the package using npm:

```bash
npm install sw4rm
```

## Quick Start

1. Create an agent with tools:

```typescript
import { Agent } from 'sw4rm/types';

const myAgent: Agent = {
  name: 'MyAssistant',
  model: 'gpt-4o-mini',
  instructions: 'You are a helpful assistant...',
  functions: [
    async function calculate(params: { expression: string }) {
      // Implementation
    }
  ],
  parallelToolCalls: true
};
```

2. Initialize and run the Swarm system:

```typescript
import { Swarm } from 'sw4rm/core';

const swarm = new Swarm();
const result = await swarm.run(
  myAgent,
  messages,
  contextVariables,
  { stream: true }
);
```

3. Use the CLI interface:

```typescript
import { CLI } from 'sw4rm/cli';

const cli = new CLI({
  agent: myAgent,
  stream: true
});

await cli.start();
```

## Examples

Check out the [examples directory](./examples) for complete working examples, including:

- Multi-tool agent implementation
- Weather and web search integration
- Data analysis and unit conversion
- Complex query handling

To run the examples:

```bash
npm run start:example
```

## Project Structure

```
sw4rm/
├── src/
│   ├── core.ts      # Core Swarm implementation
│   ├── cli.ts       # CLI interface
│   ├── types.ts     # TypeScript type definitions
│   ├── errors.ts    # Error handling
│   └── utils.ts     # Utility functions
├── examples/
│   ├── agent.ts     # Example agent configuration
│   ├── functions.ts # Tool implementations
│   ├── index.ts     # Example usage
│   └── README.md    # Example documentation
└── README.md        # This file
```

## API Documentation

### Core Classes

#### `Swarm`
The main class for running agents and managing tool execution.

```typescript
const swarm = new Swarm(config?: SwarmConfig);
await swarm.run(agent, messages, contextVariables, options);
```

#### `CLI`
Command-line interface for interactive agent sessions.

```typescript
const cli = new CLI(config: {
  agent: Agent;
  contextVariables?: Record<string, unknown>;
  stream?: boolean;
  debug?: boolean;
});
await cli.start();
```

### Key Interfaces

#### `Agent`
Defines an agent's capabilities and configuration.

```typescript
interface Agent {
  name: string;
  model: string;
  instructions: string | (() => string);
  functions: Function[];
  parallelToolCalls: boolean;
}
```

#### `SwarmConfig`
Configuration options for the Swarm system.

```typescript
interface SwarmConfig {
  logger?: Logger;
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
}
```

## Error Handling

The system includes several error types for different scenarios:

- `ValidationError`: For input validation failures
- `APIError`: For API communication issues
- `ToolExecutionError`: For tool execution failures
- `TimeoutError`: For operation timeouts

## Best Practices

1. **Tool Implementation**
   - Implement proper error handling in tools
   - Return clear, formatted responses
   - Include type definitions for parameters

2. **Agent Configuration**
   - Provide clear instructions
   - Set appropriate model parameters
   - Consider parallel execution capabilities

3. **Error Handling**
   - Catch and handle specific error types
   - Provide meaningful error messages
   - Implement retry mechanisms where appropriate

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
