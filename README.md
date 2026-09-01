# ThreatWeaver

Security-by-design architecture canvas for the [WebMCP Challenge](https://webmcp.devpost.com/).

A human sketches a cloud system. An agent reads the live graph, draws STRIDE attack paths, and patches the same canvas — inserting a WAF, flipping encryption, closing public access.

This repository is a **new project** created during the submission period. There is no pre-existing product.

## Why this is a strong fit for WebMCP

Architecture work is spatial. A chat memo that says "add a WAF" still leaves the human redrawing the diagram. WebMCP lets the agent operate the same Zustand graph the UI renders: read semantic node kinds, spawn an attacker, rewire traffic through a WAF, and clear threat edges.

## What people and agents do together

1. The page loads an insecure 3-tier starter (Internet → Web → API Gateway → Backend → Database + Storage).
2. The human can drag more components or ask the agent to add/connect nodes.
3. The agent calls `simulate_attack` — an Attacker node and animated red edges appear, with STRIDE badges.
4. The agent calls `apply_security_patch` — the graph changes (WAF inline, VPC, encryption, private access).
5. `get_threat_report` returns what is still open vs secured. The activity log shows every tool call.

## WebMCP implementation

Tools register on `document.modelContext` in [`client/src/hooks/useWebMCP.ts`](client/src/hooks/useWebMCP.ts).

| Tool | Role |
| --- | --- |
| `get_architecture_state` | Read-only graph (semantic `kind`, config, threats, patches) |
| `get_threat_report` | Read-only STRIDE / patch summary |
| `load_starter_architecture` | Reset the insecure template |
| `add_node` | Add a component, including `waf` and `vpc` |
| `connect_nodes` | Data-flow edge |
| `update_node` | Label and config flags |
| `simulate_attack` | Attacker + threat edge + STRIDE finding |
| `apply_security_patch` | Mutate topology/config and remove threat edges |

Each tool uses JSON Schema (`additionalProperties: false`), `title`, `annotations.readOnlyHint`, and `AbortSignal` lifecycle (`await registerTool(tool, { signal })`). There is no backend MCP server.

## Run locally

```bash
cd client
npm install
npm run dev
```

Build: `npm run build` from `client/`.

## Test WebMCP (judges)

The Cursor / stock Chrome tab used for UI work will show **WebMCP unavailable**. That is expected.

### ChatGPT desktop (recommended)

1. Latest ChatGPT desktop app.
2. Model: GPT-5.6 Sol or Terra (Luna disables WebMCP).
3. Open the in-app browser → this app's HTTPS URL.
4. Confirm Site tools lists 8 tools.
5. Prompt: "Read the architecture and simulate a denial-of-service attack on the API gateway."

### Google Chrome 149+

1. Enable `chrome://flags/#enable-webmcp-testing` and relaunch.
2. Open the HTTPS URL.
3. DevTools → Application → WebMCP, or the Model Context Tool Inspector.
4. Same prompts as above.

Sample prompts are also on the left rail (click to copy).

## Stack

React 19, Vite, TypeScript, xyflow, Zustand, Tailwind CSS v4. Frontend only.

## License

MIT — see [LICENSE](LICENSE).
