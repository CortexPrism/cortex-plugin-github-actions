// deno-lint-ignore-file require-await
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { tools } from '../../mod.ts';
import type { PluginContext, ToolContext } from '../../types.ts';

// Mock PluginContext
const mockContext: PluginContext & ToolContext = {
  pluginId: 'cortex-plugin-github-actions',
  pluginDir: '/tmp/plugins/cortex-plugin-github-actions',
  state: {
    get: async () => null,
    set: async () => {},
    delete: async () => {},
    list: async () => ({}),
  },
  config: {
    get: async () => null,
    set: async () => {},
    getAll: async () => ({}),
  },
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
  host: {
    registerTool: () => {},
    unregisterTool: () => {},
  },
  sessionId: 'test-session',
  workingDir: '/tmp',
  agentId: 'test-agent',
  workspaceDir: '/tmp',
};

function findTool(name: string) {
  const tool = tools.find((t) => t.definition.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

Deno.test('tools array — exports all tools', () => {
  assertEquals(tools.length, 6);
  assertEquals(tools[0].definition.name, 'actions_list_workflows');
  assertEquals(tools[1].definition.name, 'actions_trigger');
  assertEquals(tools[2].definition.name, 'actions_get_run');
  assertEquals(tools[3].definition.name, 'actions_list_runs');
  assertEquals(tools[4].definition.name, 'actions_get_logs');
  assertEquals(tools[5].definition.name, 'actions_rerun');
});

Deno.test('actions_list_workflows — rejects empty repo', async () => {
  const tool = findTool('actions_list_workflows');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('actions_trigger — rejects empty repo', async () => {
  const tool = findTool('actions_trigger');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('actions_get_run — rejects empty repo', async () => {
  const tool = findTool('actions_get_run');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('actions_list_runs — rejects empty repo', async () => {
  const tool = findTool('actions_list_runs');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('actions_get_logs — rejects empty repo', async () => {
  const tool = findTool('actions_get_logs');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('actions_rerun — rejects empty repo', async () => {
  const tool = findTool('actions_rerun');
  const result = await tool.execute({ 'repo': '' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? '', 'non-empty string');
});

Deno.test('all tools return durationMs', async () => {
  for (const tool of tools) {
    const args: Record<string, unknown> = {};
    const result = await tool.execute(args, mockContext);
    assertEquals(typeof result.durationMs, 'number');
    assertEquals(result.durationMs >= 0, true);
  }
});
