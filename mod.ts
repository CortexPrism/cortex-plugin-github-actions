import type { PluginContext, Tool, ToolCallResult, ToolContext } from './types.ts';

let config: Record<string, string> = {};

export async function onLoad(ctx: PluginContext): Promise<void> {
  config = await ctx.config.get() as Record<string, string>;
}

export async function onUnload(_ctx: PluginContext): Promise<void> {}

function ghApi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.githubToken || ''}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
  });
}

const actions_list_workflows: Tool = {
  definition: {
    name: 'actions_list_workflows',
    description: 'List workflows for a repository',
    params: [{
      name: 'repo',
      type: 'string',
      description: 'Repository in owner/repo format',
      required: true,
    }],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_list_workflows',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      const res = await ghApi(`/repos/${repo}/actions/workflows`);
      const data = await res.json();
      if (!res.ok) {
        return {
          toolName: 'actions_list_workflows',
          success: false,
          output: '',
          error: `GitHub API error ${res.status}: ${JSON.stringify(data)}`,
          durationMs: Date.now() - start,
        };
      }
      return {
        toolName: 'actions_list_workflows',
        success: true,
        output: JSON.stringify(data, null, 2),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_list_workflows',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const actions_trigger: Tool = {
  definition: {
    name: 'actions_trigger',
    description: 'Trigger a workflow run',
    params: [
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format',
        required: true,
      },
      {
        name: 'workflow_id',
        type: 'string',
        description: 'Workflow ID or filename',
        required: true,
      },
      {
        name: 'ref',
        type: 'string',
        description: 'Git ref to run on',
        required: false,
        default: 'main',
      },
      {
        name: 'inputs',
        type: 'string',
        description: 'JSON string of workflow inputs',
        required: false,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      const workflow_id = args.workflow_id;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_trigger',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      if (!workflow_id || typeof workflow_id !== 'string') {
        return {
          toolName: 'actions_trigger',
          success: false,
          output: '',
          error: 'workflow_id must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      const ref = typeof args.ref === 'string' ? args.ref : 'main';
      let body: Record<string, string | Record<string, string>> = { ref };
      if (args.inputs && typeof args.inputs === 'string') {
        try {
          body.inputs = JSON.parse(args.inputs);
        } catch { /* ignore invalid JSON */ }
      }
      const res = await ghApi(`/repos/${repo}/actions/workflows/${workflow_id}/dispatches`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          toolName: 'actions_trigger',
          success: false,
          output: '',
          error: `GitHub API error ${res.status}: ${JSON.stringify(data)}`,
          durationMs: Date.now() - start,
        };
      }
      return {
        toolName: 'actions_trigger',
        success: true,
        output: `Workflow ${workflow_id} triggered on ${ref}`,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_trigger',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const actions_get_run: Tool = {
  definition: {
    name: 'actions_get_run',
    description: 'Get details of a workflow run',
    params: [
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format',
        required: true,
      },
      { name: 'run_id', type: 'number', description: 'The run ID', required: true },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      const run_id = args.run_id;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_get_run',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      if (typeof run_id !== 'number') {
        return {
          toolName: 'actions_get_run',
          success: false,
          output: '',
          error: 'run_id must be a number',
          durationMs: Date.now() - start,
        };
      }
      const res = await ghApi(`/repos/${repo}/actions/runs/${run_id}`);
      const data = await res.json();
      if (!res.ok) {
        return {
          toolName: 'actions_get_run',
          success: false,
          output: '',
          error: `GitHub API error ${res.status}: ${JSON.stringify(data)}`,
          durationMs: Date.now() - start,
        };
      }
      return {
        toolName: 'actions_get_run',
        success: true,
        output: JSON.stringify(data, null, 2),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_get_run',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const actions_list_runs: Tool = {
  definition: {
    name: 'actions_list_runs',
    description: 'List recent workflow runs',
    params: [
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format',
        required: true,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Filter by run status',
        required: false,
        enum: ['completed', 'in_progress', 'queued', 'all'],
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum results to return',
        required: false,
        default: 10,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_list_runs',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      const limit = typeof args.limit === 'number' ? args.limit : 10;
      const status = typeof args.status === 'string' ? args.status : '';
      let path = `/repos/${repo}/actions/runs?per_page=${limit}`;
      if (status && status !== 'all') path += `&status=${status}`;
      const res = await ghApi(path);
      const data = await res.json();
      if (!res.ok) {
        return {
          toolName: 'actions_list_runs',
          success: false,
          output: '',
          error: `GitHub API error ${res.status}: ${JSON.stringify(data)}`,
          durationMs: Date.now() - start,
        };
      }
      return {
        toolName: 'actions_list_runs',
        success: true,
        output: JSON.stringify(data, null, 2),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_list_runs',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const actions_get_logs: Tool = {
  definition: {
    name: 'actions_get_logs',
    description: 'Get logs for a workflow run',
    params: [
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format',
        required: true,
      },
      { name: 'run_id', type: 'number', description: 'The run ID', required: true },
      {
        name: 'job_name',
        type: 'string',
        description: 'Specific job name to get logs for',
        required: false,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      const run_id = args.run_id;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_get_logs',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      if (typeof run_id !== 'number') {
        return {
          toolName: 'actions_get_logs',
          success: false,
          output: '',
          error: 'run_id must be a number',
          durationMs: Date.now() - start,
        };
      }
      const jobsRes = await ghApi(`/repos/${repo}/actions/runs/${run_id}/jobs`);
      const jobsData = await jobsRes.json();
      if (!jobsRes.ok) {
        return {
          toolName: 'actions_get_logs',
          success: false,
          output: '',
          error: `Failed to fetch jobs: ${jobsRes.status}`,
          durationMs: Date.now() - start,
        };
      }
      const jobs = Array.isArray(jobsData.jobs) ? jobsData.jobs : [];
      const jobName = typeof args.job_name === 'string' ? args.job_name : null;
      const targetJobs = jobName ? jobs.filter((j: { name: string }) => j.name === jobName) : jobs;
      if (targetJobs.length === 0) {
        return {
          toolName: 'actions_get_logs',
          success: false,
          output: '',
          error: 'No matching jobs found',
          durationMs: Date.now() - start,
        };
      }
      const logs: string[] = [];
      for (const job of targetJobs) {
        const logRes = await fetch(job.url + '/logs', {
          headers: {
            Authorization: `Bearer ${config.githubToken || ''}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (logRes.ok) {
          logs.push(`=== ${job.name} ===\n${await logRes.text()}`);
        }
      }
      return {
        toolName: 'actions_get_logs',
        success: true,
        output: logs.join('\n\n'),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_get_logs',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const actions_rerun: Tool = {
  definition: {
    name: 'actions_rerun',
    description: 'Re-run a workflow',
    params: [
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format',
        required: true,
      },
      { name: 'run_id', type: 'number', description: 'The run ID', required: true },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const repo = args.repo;
      const run_id = args.run_id;
      if (!repo || typeof repo !== 'string') {
        return {
          toolName: 'actions_rerun',
          success: false,
          output: '',
          error: 'repo must be a non-empty string',
          durationMs: Date.now() - start,
        };
      }
      if (typeof run_id !== 'number') {
        return {
          toolName: 'actions_rerun',
          success: false,
          output: '',
          error: 'run_id must be a number',
          durationMs: Date.now() - start,
        };
      }
      const res = await ghApi(`/repos/${repo}/actions/runs/${run_id}/rerun`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          toolName: 'actions_rerun',
          success: false,
          output: '',
          error: `GitHub API error ${res.status}: ${JSON.stringify(data)}`,
          durationMs: Date.now() - start,
        };
      }
      return {
        toolName: 'actions_rerun',
        success: true,
        output: `Run ${run_id} re-queued successfully`,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'actions_rerun',
        success: false,
        output: '',
        error: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

export const tools: Tool[] = [
  actions_list_workflows,
  actions_trigger,
  actions_get_run,
  actions_list_runs,
  actions_get_logs,
  actions_rerun,
];
