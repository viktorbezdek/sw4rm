# Swarm Examples

This directory contains example implementations demonstrating how to use the Swarm system with multiple tools and capabilities. The examples show how to create agents, implement custom tools, and handle complex multi-step queries.

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the examples directory with your API keys:

```env
WEATHERAPI_KEY=your_weather_api_key    # Required for weather functions
SERPAPI_KEY=your_serpapi_key          # Required for web search functions
```

You can obtain these API keys from:
- WeatherAPI: [https://www.weatherapi.com](https://www.weatherapi.com)
- SerpAPI: [https://serpapi.com](https://serpapi.com)

### 2. Install Dependencies

The examples require several dependencies for mathematical operations, API calls, and environment configuration:

```bash
npm install axios mathjs dotenv
```

### 3. Run the Example

Start the interactive CLI example:

```bash
npm run start:example
```

## Available Tools

The example implementation includes several tools that demonstrate different capabilities:

1. **calculate**: Evaluates mathematical expressions
   - Supports basic arithmetic and complex mathematical functions
   - Uses the mathjs library for safe evaluation

2. **getWeather**: Fetches current weather information
   - Requires WeatherAPI key
   - Returns temperature, conditions, humidity, and wind speed

3. **searchWeb**: Performs web searches
   - Requires SerpAPI key
   - Returns formatted search results with titles and snippets

4. **analyzeData**: Performs statistical analysis
   - Calculates sum, average, median, and range
   - Works with arrays of numerical data

5. **convertUnits**: Converts between different units
   - Supports distance (km/miles/meters)
   - Supports weight (kg/lbs/grams)

## Example Queries

Here are various example queries that demonstrate the system's capabilities:

### 1. Basic Calculations
```
What is the square root of 256 plus 75?
```
Demonstrates: Mathematical expression evaluation

### 2. Weather with Unit Conversion
```
What's the temperature in Tokyo? Convert it to Fahrenheit.
```
Demonstrates: API integration and unit conversion chaining

### 3. Web Search with Analysis
```
Search for the top 3 electric car companies and their stock prices, then calculate the average price.
```
Demonstrates: Web search, data extraction, and mathematical analysis

### 4. Complex Data Analysis
```
Analyze these test scores: [85, 92, 78, 95, 88, 90, 87] and tell me if they're above average.
```
Demonstrates: Statistical analysis and comparative logic

### 5. Multi-step Query
```
What's the weather in San Francisco? Also, search for best outdoor activities there and calculate the distance if I want to do them all.
```
Demonstrates: Multiple tool usage and complex query handling

### 6. Chained Conversions
```
Convert 26.2 miles to kilometers, then get the weather forecast for that radius around London.
```
Demonstrates: Unit conversion and weather API integration

### 7. Combined Search and Calculations
```
Search for the world's tallest buildings, then calculate the average height of the top 3.
```
Demonstrates: Web search with data extraction and analysis

### 8. Weather Comparison
```
Compare the weather between New York and Los Angeles, and calculate the temperature difference.
```
Demonstrates: Multiple API calls and comparative analysis

## Implementation Details

The example implementation consists of several key files:

- `index.ts`: Main entry point and CLI setup
- `agent.ts`: Agent configuration and tool definitions
- `functions.ts`: Implementation of tool functions
- `.env`: API keys and configuration

Each tool is implemented with proper error handling and type safety. The system can handle complex queries that require multiple tools and can chain operations together intelligently.

## Error Handling

The example implementation includes comprehensive error handling:

- API errors are caught and returned as readable messages
- Invalid mathematical expressions are safely handled
- Network issues are reported clearly
- Invalid unit conversions return helpful error messages

## Customization

You can extend the example by:

1. Adding new tools to `functions.ts`
2. Modifying the agent instructions in `agent.ts`
3. Adding new unit conversions to the `convertUnits` function
4. Implementing additional API integrations

## Best Practices

When using these examples as a base for your implementation:

1. Always validate API responses
2. Implement proper error handling
3. Use type safety with TypeScript
4. Keep API keys secure in environment variables
5. Consider rate limiting for API calls
6. Add logging for debugging purposes

## Support

For issues or questions about these examples:

1. Check the main project documentation
2. Ensure all dependencies are correctly installed
3. Verify API keys are properly configured
4. Check the console for detailed error messages
