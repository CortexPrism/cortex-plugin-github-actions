# cortex-plugin-github-actions

Trigger, monitor, and debug GitHub Actions runs from Cortex.

## Installation

```bash
cortex plugin install marketplace:cortex-plugin-github-actions
cortex plugin install github:CortexPrism/cortex-plugin-github-actions
cortex plugin install ./manifest.json
```

## Tools

### actions_list_workflows

List workflows for a repository.

- `repo` (string, required) — Repository in owner/repo format

### actions_trigger

Trigger a workflow run.

- `repo` (string, required) — Repository in owner/repo format
- `workflow_id` (string, required) — Workflow ID or filename
- `ref` (string, default: "main") — Git ref to run on
- `inputs` (string, optional) — JSON string of workflow inputs

### actions_get_run

Get details of a workflow run.

- `repo` (string, required) — Repository in owner/repo format
- `run_id` (number, required) — The run ID

### actions_list_runs

List recent workflow runs.

- `repo` (string, required) — Repository in owner/repo format
- `status` (string, optional) — Filter: completed, in_progress, queued, all
- `limit` (number, default: 10) — Maximum results

### actions_get_logs

Get logs for a workflow run.

- `repo` (string, required) — Repository in owner/repo format
- `run_id` (number, required) — The run ID
- `job_name` (string, optional) — Specific job name

### actions_rerun

Re-run a workflow.

- `repo` (string, required) — Repository in owner/repo format
- `run_id` (number, required) — The run ID

## Configuration

Set your GitHub personal access token in plugin settings under the "GitHub" section.

## Development

```bash
deno cache mod.ts
deno task test
deno fmt
deno lint
```

## License

MIT
