/**
 * Flow Think MCP - Server Unit Tests
 *
 * Tests for FlowThinkServer step processing, validation, and history management.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { FlowThinkServer } from "./server.js";
import { getDefaultConfig } from "./config.js";
import type { FlowThinkConfig } from "./types.js";

function createServer(configOverrides?: Partial<FlowThinkConfig>): FlowThinkServer {
  const config = { ...getDefaultConfig(), ...configOverrides };
  return new FlowThinkServer(config);
}

function createValidStep(overrides = {}) {
  return {
    step_number: 1,
    estimated_total: 3,
    purpose: "planning",
    context: "Starting a new task",
    thought: "I should analyze the requirements first",
    outcome: "Requirements understood",
    next_action: "Read the spec file",
    rationale: "Need to understand what to build",
    ...overrides,
  };
}

describe("FlowThinkServer", () => {
  describe("validateRequiredFields", () => {
    test("accepts valid step with all required fields", () => {
      const server = createServer();
      const step = createValidStep();
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test("rejects null input", () => {
      const server = createServer();
      const result = server.validateRequiredFields(null);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be an object");
    });

    test("rejects non-object input", () => {
      const server = createServer();
      const result = server.validateRequiredFields("string");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be an object");
    });

    test("reports missing step_number", () => {
      const server = createServer();
      const step = createValidStep();
      delete (step as Record<string, unknown>).step_number;
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(false);
      expect(result.missing.join(",")).toContain("step_number");
    });

    test("rejects non-positive step_number", () => {
      const server = createServer();
      const step = createValidStep({ step_number: 0 });
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(false);
      expect(result.missing.join(",")).toContain("step_number");
    });

    test("rejects non-integer step_number", () => {
      const server = createServer();
      const step = createValidStep({ step_number: 1.5 });
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(false);
      expect(result.missing.join(",")).toContain("step_number");
    });

    test("reports missing purpose", () => {
      const server = createServer();
      const step = createValidStep({ purpose: "" });
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("purpose");
    });

    test("accepts structured next_action with action", () => {
      const server = createServer();
      const step = createValidStep({
        next_action: {
          tool: "Read",
          action: "Read the file",
          expectedOutput: "File contents",
        },
      });
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(true);
    });

    test("rejects structured next_action without action", () => {
      const server = createServer();
      const step = createValidStep({
        next_action: { tool: "Read" },
      });
      const result = server.validateRequiredFields(step);

      expect(result.valid).toBe(false);
      expect(result.missing.join(",")).toContain("next_action.action");
    });

    test("reports all missing fields", () => {
      const server = createServer();
      const result = server.validateRequiredFields({});

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("processStep", () => {
    test("processes valid step and returns success", async () => {
      const server = createServer();
      const step = createValidStep();
      const response = await server.processStep(step);

      expect(response.isError).toBeUndefined();
      expect(response.content).toHaveLength(1);

      const data = JSON.parse(response.content[0].text);
      expect(data.status).toBe("flow_think_in_progress");
      expect(data.step_number).toBe(1);
      expect(data.completed).toBe(false);
    });

    test("returns error for invalid step", async () => {
      const server = createServer();
      const response = await server.processStep({});

      expect(response.isError).toBe(true);

      const data = JSON.parse(response.content[0].text);
      expect(data.error).toBeDefined();
      expect(data.missing_fields).toBeDefined();
    });

    test("adds timestamp to processed step", async () => {
      const server = createServer();
      const step = createValidStep();
      await server.processStep(step);

      const history = server.getHistory();
      expect(history.steps[0].timestamp).toBeDefined();
    });

    test("tracks duration_ms for processed step", async () => {
      const server = createServer();
      const step = createValidStep();
      await server.processStep(step);

      const history = server.getHistory();
      expect(history.steps[0].duration_ms).toBeDefined();
      expect(history.steps[0].duration_ms).toBeGreaterThanOrEqual(0);
    });

    test("marks completion when is_final_step is true", async () => {
      const server = createServer();
      const step = createValidStep({ is_final_step: true });
      const response = await server.processStep(step);

      const data = JSON.parse(response.content[0].text);
      expect(data.status).toBe("flow_think_complete");
      expect(data.completed).toBe(true);

      const history = server.getHistory();
      expect(history.completed).toBe(true);
    });

    test("detects completion phrases in thought", async () => {
      const server = createServer();
      const step = createValidStep({
        thought: "Based on my analysis, I have reached a final conclusion.",
      });
      const response = await server.processStep(step);

      const data = JSON.parse(response.content[0].text);
      expect(data.completed).toBe(true);
    });

    test("includes confidence in response when provided", async () => {
      const server = createServer();
      const step = createValidStep({ confidence: 0.85 });
      const response = await server.processStep(step);

      const data = JSON.parse(response.content[0].text);
      expect(data.confidence).toBe(0.85);
    });

    test("includes hypothesis status in response", async () => {
      const server = createServer();
      const step = createValidStep({
        hypothesis: "The bug is in the auth module",
        verification_status: "pending",
      });
      const response = await server.processStep(step);

      const data = JSON.parse(response.content[0].text);
      expect(data.hypothesis.text).toBe("The bug is in the auth module");
      expect(data.hypothesis.status).toBe("pending");
    });

    test("includes branch info in response", async () => {
      const server = createServer();
      const step = createValidStep({
        branch_id: "branch-1",
        branch_name: "Alternative approach",
        branch_from: 2,
      });
      const response = await server.processStep(step);

      const data = JSON.parse(response.content[0].text);
      expect(data.branch.id).toBe("branch-1");
      expect(data.branch.name).toBe("Alternative approach");
      expect(data.branch.from).toBe(2);
    });

    test("tracks tools used across steps", async () => {
      const server = createServer();
      await server.processStep(createValidStep({ tools_used: ["Read", "Grep"] }));
      await server.processStep(createValidStep({
        step_number: 2,
        tools_used: ["Edit"],
        next_action: { tool: "Bash", action: "Run tests" },
      }));

      const history = server.getHistory();
      expect(history.metadata?.tools_used).toContain("Read");
      expect(history.metadata?.tools_used).toContain("Grep");
      expect(history.metadata?.tools_used).toContain("Edit");
      expect(history.metadata?.tools_used).toContain("Bash");
    });
  });

  describe("history management", () => {
    test("stores steps in history", async () => {
      const server = createServer();
      await server.processStep(createValidStep({ step_number: 1 }));
      await server.processStep(createValidStep({ step_number: 2 }));

      const history = server.getHistory();
      expect(history.steps).toHaveLength(2);
    });

    test("getStep returns step by number", async () => {
      const server = createServer();
      await server.processStep(createValidStep({ step_number: 1 }));
      await server.processStep(createValidStep({ step_number: 2, purpose: "debug" }));

      const step = server.getStep(2);
      expect(step?.purpose).toBe("debug");
    });

    test("hasStep returns true for existing step", async () => {
      const server = createServer();
      await server.processStep(createValidStep({ step_number: 5 }));

      expect(server.hasStep(5)).toBe(true);
      expect(server.hasStep(10)).toBe(false);
    });

    test("clearHistory resets all state", async () => {
      const server = createServer();
      await server.processStep(createValidStep());
      server.clearHistory();

      const history = server.getHistory();
      expect(history.steps).toHaveLength(0);
      expect(history.completed).toBe(false);
      expect(server.hasStep(1)).toBe(false);
    });

    test("trims history when exceeding maxHistorySize", async () => {
      const server = createServer({ maxHistorySize: 3 });

      for (let i = 1; i <= 5; i++) {
        await server.processStep(createValidStep({ step_number: i }));
      }

      const history = server.getHistory();
      expect(history.steps).toHaveLength(3);
      expect(server.hasStep(1)).toBe(false);
      expect(server.hasStep(2)).toBe(false);
      expect(server.hasStep(3)).toBe(true);
    });

    test("updates metadata timestamps", async () => {
      const server = createServer();
      const history1 = server.getHistory();
      const created = history1.created_at;

      await new Promise((r) => setTimeout(r, 10));
      await server.processStep(createValidStep());

      const history2 = server.getHistory();
      expect(history2.created_at).toBe(created);
      expect(history2.updated_at).not.toBe(created);
    });
  });

  describe("exportHistory", () => {
    test("exports as JSON by default", async () => {
      const server = createServer();
      await server.processStep(createValidStep());

      const exported = server.exportHistory();
      const parsed = JSON.parse(exported);

      expect(parsed.steps).toHaveLength(1);
      expect(parsed.completed).toBe(false);
    });

    test("exports as markdown", async () => {
      const server = createServer();
      await server.processStep(createValidStep({ purpose: "planning" }));

      const exported = server.exportHistory("markdown");

      expect(exported).toContain("## Step 1/3: planning");
      expect(exported).toContain("**Context:**");
    });

    test("exports as text", async () => {
      const server = createServer({ outputFormat: "json" }); // Disable colors
      await server.processStep(createValidStep());

      const exported = server.exportHistory("text");

      // Text export includes color codes when colorOutput is true (default for console format)
      // The output format doesn't affect colorOutput, so check for content presence
      expect(exported).toContain("1/3");
      expect(exported).toContain("Context:");
    });
  });
});
