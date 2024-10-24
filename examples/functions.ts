/**
 * Example implementation of tool functions used by the multi-tool agent.
 * This module provides various utility functions that demonstrate different
 * types of operations an agent can perform.
 */

import axios from "axios";
import { evaluate } from "mathjs";

/**
 * Interface defining the structure of weather API responses.
 * @internal
 */
interface WeatherResponse {
  current: {
    temp_c: number;
    condition: {
      text: string;
    };
    humidity: number;
    wind_kph: number;
  };
  location: {
    name: string;
    country: string;
  };
}

/**
 * Evaluates mathematical expressions using the mathjs library.
 * Supports a wide range of mathematical operations and functions.
 *
 * @param expression - The mathematical expression to evaluate as a string
 * @returns A promise resolving to a string containing the result or error message
 *
 * @example
 * ```ts
 * const result = await calculate('2 + 2 * 3');
 * console.log(result); // "The result of 2 + 2 * 3 is 8"
 * ```
 */
export async function calculate(expression: string): Promise<string> {
  try {
    const result = evaluate(expression);
    return `The result of ${expression} is ${result}`;
  } catch (error) {
    return `Error calculating: ${(error as Error).message}`;
  }
}

/**
 * Fetches current weather information for a specified location using WeatherAPI.
 * Requires a valid WEATHERAPI_KEY environment variable.
 *
 * @param location - The location to get weather for (city name, coordinates, etc.)
 * @returns A promise resolving to a formatted string containing weather information
 *
 * @example
 * ```ts
 * const weather = await getWeather('London');
 * console.log(weather);
 * // Current weather in London, UK:
 * // Temperature: 18°C
 * // Condition: Partly cloudy
 * // Humidity: 72%
 * // Wind: 15 km/h
 * ```
 */
export async function getWeather(location: string): Promise<string> {
  try {
    const apiKey = process.env.WEATHERAPI_KEY || "your_weather_api_key";
    const response = await axios.get<WeatherResponse>(
      `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`,
    );

    const { current, location: loc } = response.data;
    return `
Current weather in ${loc.name}, ${loc.country}:
Temperature: ${current.temp_c}°C
Condition: ${current.condition.text}
Humidity: ${current.humidity}%
Wind: ${current.wind_kph} km/h
    `.trim();
  } catch (error) {
    return `Error getting weather: ${(error as Error).message}`;
  }
}

/**
 * Performs a web search using the SerpAPI service.
 * Requires a valid SERPAPI_KEY environment variable.
 *
 * @param query - The search query string
 * @param numResults - Number of results to return (default: 5)
 * @returns A promise resolving to a formatted string containing search results
 *
 * @example
 * ```ts
 * const results = await searchWeb('TypeScript tutorials', 3);
 * console.log(results);
 * // 1. TypeScript Tutorial for Beginners
 * //    Learn TypeScript basics in this comprehensive guide...
 * //    URL: https://example.com/typescript-tutorial
 * // ...
 * ```
 */
export async function searchWeb(
  query: string,
  numResults = 5,
): Promise<string> {
  try {
    const apiKey = process.env.SERPAPI_KEY || "your_serpapi_key";
    const response = await axios.get(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${numResults}`,
    );

    const results = response.data.organic_results;
    return results
      .slice(0, numResults)
      .map(
        (result: any, index: number) =>
          `${index + 1}. ${result.title}\n   ${result.snippet}\n   URL: ${result.link}`,
      )
      .join("\n\n");
  } catch (error) {
    return `Error searching web: ${(error as Error).message}`;
  }
}

/**
 * Performs basic statistical analysis on an array of numbers.
 * Calculates sum, average, median, and range of the dataset.
 *
 * @param data - Array of numbers to analyze
 * @returns A promise resolving to a formatted string containing statistical analysis
 *
 * @example
 * ```ts
 * const stats = await analyzeData([1, 2, 3, 4, 5]);
 * console.log(stats);
 * // Data Analysis Results:
 * // Sample size: 5
 * // Sum: 15
 * // Average: 3.00
 * // Median: 3
 * // Range: 1 to 5
 * ```
 */
export async function analyzeData(data: number[]): Promise<string> {
  try {
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(data.length / 2)];
    const max = Math.max(...data);
    const min = Math.min(...data);

    return `
Data Analysis Results:
Sample size: ${data.length}
Sum: ${sum}
Average: ${avg.toFixed(2)}
Median: ${median}
Range: ${min} to ${max}
    `.trim();
  } catch (error) {
    return `Error analyzing data: ${(error as Error).message}`;
  }
}

/**
 * Converts values between different units of measurement.
 * Currently supports conversions between:
 * - kilometers (km) <-> miles
 * - kilometers (km) <-> meters
 * - kilograms (kg) <-> pounds (lbs)
 * - kilograms (kg) <-> grams
 *
 * @param value - The numeric value to convert
 * @param fromUnit - The unit to convert from
 * @param toUnit - The unit to convert to
 * @returns A promise resolving to a string containing the conversion result
 *
 * @example
 * ```ts
 * const result = await convertUnits(10, 'km', 'miles');
 * console.log(result); // "10 km = 6.21 miles"
 * ```
 */
export async function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string,
): Promise<string> {
  const conversions: Record<string, Record<string, number>> = {
    km: { miles: 0.621371, meters: 1000 },
    miles: { km: 1.60934, meters: 1609.34 },
    kg: { lbs: 2.20462, grams: 1000 },
    lbs: { kg: 0.453592, grams: 453.592 },
  };

  try {
    const baseConversion = conversions[fromUnit]?.[toUnit];
    if (!baseConversion) {
      throw new Error(`Unsupported conversion from ${fromUnit} to ${toUnit}`);
    }

    const result = value * baseConversion;
    return `${value} ${fromUnit} = ${result.toFixed(2)} ${toUnit}`;
  } catch (error) {
    return `Error converting units: ${(error as Error).message}`;
  }
}
