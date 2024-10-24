import {
  ValidationError,
  APIError,
  ToolExecutionError,
  TimeoutError,
} from "../errors";

describe("ValidationError", () => {
  it("should set message and name correctly", () => {
    const error = new ValidationError("Invalid input");
    expect(error.message).toBe("Invalid input");
    expect(error.name).toBe("ValidationError");
  });

  it("should set error code correctly", () => {
    const error = new ValidationError("Invalid input");
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("should handle cause properly", () => {
    const cause = new Error("Original error");
    const error = new ValidationError("Invalid input", cause);
    expect(error.cause).toBe(cause);
  });

  it("should be instanceof Error", () => {
    const error = new ValidationError("Invalid input");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("APIError", () => {
  it("should set message and name correctly", () => {
    const error = new APIError("API request failed");
    expect(error.message).toBe("API request failed");
    expect(error.name).toBe("APIError");
  });

  it("should set error code correctly", () => {
    const error = new APIError("API request failed");
    expect(error.code).toBe("API_ERROR");
  });

  it("should handle cause properly", () => {
    const cause = new Error("Network error");
    const error = new APIError("API request failed", cause);
    expect(error.cause).toBe(cause);
  });

  it("should be instanceof Error", () => {
    const error = new APIError("API request failed");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ToolExecutionError", () => {
  it("should set message and name correctly", () => {
    const error = new ToolExecutionError("Tool execution failed");
    expect(error.message).toBe("Tool execution failed");
    expect(error.name).toBe("ToolExecutionError");
  });

  it("should set error code correctly", () => {
    const error = new ToolExecutionError("Tool execution failed");
    expect(error.code).toBe("TOOL_EXECUTION_ERROR");
  });

  it("should handle cause properly", () => {
    const cause = new Error("Permission denied");
    const error = new ToolExecutionError("Tool execution failed", cause);
    expect(error.cause).toBe(cause);
  });

  it("should be instanceof Error", () => {
    const error = new ToolExecutionError("Tool execution failed");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("TimeoutError", () => {
  it("should set message and name correctly", () => {
    const error = new TimeoutError("Operation timed out");
    expect(error.message).toBe("Operation timed out");
    expect(error.name).toBe("TimeoutError");
  });

  it("should set error code correctly", () => {
    const error = new TimeoutError("Operation timed out");
    expect(error.code).toBe("TIMEOUT_ERROR");
  });

  it("should handle cause properly", () => {
    const cause = new Error("Process terminated");
    const error = new TimeoutError("Operation timed out", cause);
    expect(error.cause).toBe(cause);
  });

  it("should be instanceof Error", () => {
    const error = new TimeoutError("Operation timed out");
    expect(error).toBeInstanceOf(Error);
  });
});
