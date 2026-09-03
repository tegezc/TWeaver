# ThreatWeaver

Security-by-design architecture canvas for the [WebMCP Challenge](https://webmcp.devpost.com/).

**Live demo:** [https://t-weaver.vercel.app/](https://t-weaver.vercel.app/)

A human sketches a cloud system. An agent reads the live graph, draws STRIDE attack paths, and patches the same canvas — inserting a WAF, flipping encryption, closing public access.

This repository is a **new project** created during the submission period. There is no pre-existing product.

## Why this is a strong fit for WebMCP

Architecture work is spatial. A chat memo that says "add a WAF" still leaves the human redrawing the diagram. WebMCP lets the agent operate the same Zustand graph the UI renders: read semantic node kinds, spawn an attacker, rewire traffic through a WAF, and clear threat edges.

## What people and agents do together

1. The page loads an insecure 3-tier starter (Internet → Web → API Gateway → Backend → Database + Storage).
2. The human can drag more components, toggle public/encrypted/rate-limit flags, or ask the agent to add/connect nodes.
3. The agent calls `simulate_attack` — an Attacker node and animated red edges appear, with STRIDE badges.
4. The agent calls `apply_security_patch` — the graph changes (WAF inline, VPC, encryption, private access).
5. `get_threat_report` returns what is still open vs secured vs misconfigured. The activity log shows tool calls and human canvas edits.

## WebMCP implementation

Tools register on `document.modelContext` in [`client/src/hooks/useWebMCP.ts`](client/src/hooks/useWebMCP.ts).

| Tool | Role |
| --- | --- |
| `get_architecture_state` | Read-only graph (semantic `kind`, config, threats, patches) |
| `get_threat_report` | Read-only STRIDE / patch / misconfiguration summary |
| `load_starter_architecture` | Reset the insecure template |
| `add_node` | Add a component, including `waf` and `vpc` |
| `connect_nodes` | Data-flow edge |
| `update_node` | Label and config flags |
| `simulate_attack` | Attacker + threat edge + STRIDE finding |
| `apply_security_patch` | Mutate topology/config and remove threat edges |

Each tool uses JSON Schema (`additionalProperties: false`), `title`, `annotations.readOnlyHint`, and `AbortSignal` lifecycle (`await registerTool(tool, { signal })`). There is no backend MCP server.

The in-page badge **WebMCP ready · 8 tools** means the page registered tools on `document.modelContext`. It does **not** mean ChatGPT has called a tool. Site tools are discovered in ChatGPT **Work or Codex** (not the **Chat** tab) with **Terra / Terra Light**, or **Sol** if that model is available on the account. **Luna** disables WebMCP. Stock Chrome without the WebMCP flag also shows **unavailable** — that is expected.

## Judge path (four prompts)

Use the live HTTPS URL. In ChatGPT desktop: **Work or Codex** (not Chat), Terra / Terra Light (or Sol if available), Site tools = 8 (2 read / 6 write). Paste these prompts one at a time. Wait for the canvas and the activity log after each send. A text-only reply is not a successful demo.

1. `Read the architecture and list the highest-risk nodes.`
   Expected: activity log shows `get_architecture_state`. Agent names public gateway / public datastore ids such as `api-gateway-1` and `database-1`.
2. `Simulate a denial-of-service attack on the API gateway and information disclosure on the database.`
   Expected: Attacker node, animated red threat edges, STRIDE badges. Log: two `simulate_attack` calls (gateway DoS, then database disclosure).
3. `Apply a WAF in front of the API gateway, encrypt the database, and remove public access.`
   Expected: WAF node on the incoming path to the gateway; database encrypted and not public; red edges to those targets gone. Log: three `apply_security_patch` calls (WAF, encrypt, private access).
4. `Give me a threat report of what changed.`
   Expected: log `get_threat_report`. Report includes existing fields plus `misconfiguredNodes` and `openThreatCount`.

If the activity log stays empty, tools were not invoked — do not treat that as a passing run.

### If the agent leaves the page

If ChatGPT opens GitHub or leaves the live canvas, stay on this URL and send one of these instead (one prompt per send):

```
Use only the site tools on this open ThreatWeaver page. Do not open GitHub, do not read any repository, do not inspect source code. Call get_architecture_state and list the highest-risk node ids.
```

```
Stay on this page. Use site tools only. Simulate a denial-of-service attack on api-gateway-1. Do not browse away. Do not open GitHub.
```

```
Stay on this page. Use site tools only. Apply a WAF in front of api-gateway-1.
```

### Example tool payloads (shape, not a live capture)

`get_architecture_state` returns semantic kinds, not React Flow's `architectureNode` type:

```json
{
  "nodes": [
    {
      "id": "api-gateway-1",
      "kind": "apigateway",
      "label": "API Gateway",
      "config": { "publicAccess": true, "encrypted": false, "rateLimited": false },
      "threats": [],
      "patches": [],
      "position": { "x": 320, "y": 500 }
    }
  ],
  "edges": [
    { "id": "edge-webserver-1-api-gateway-1", "source": "webserver-1", "target": "api-gateway-1", "kind": "data" }
  ]
}
```

`get_threat_report` after the starter loads, before attacks:

```json
{
  "totalNodes": 6,
  "vulnerableNodes": [],
  "securedNodes": [],
  "misconfiguredNodes": [
    { "id": "webserver-1", "kind": "webserver" },
    { "id": "api-gateway-1", "kind": "apigateway" },
    { "id": "database-1", "kind": "database" },
    { "id": "storage-1", "kind": "storage" }
  ],
  "threatEdges": [],
  "openThreatCount": 0
}
```

(`misconfiguredNodes` in the real payload includes full node objects: label, config, threats, patches, position.)

## Run locally

```bash
cd client
npm install
npm run dev
```

The Vite app lives in `client/`. Build with `npm run build` from `client/`. Vercel Root Directory must be `client` (static Vite output).

## Test WebMCP (judges)

The Cursor / stock Chrome tab used for UI work will show **WebMCP unavailable**. That is expected.

### ChatGPT desktop (recommended)

1. Latest ChatGPT desktop app. Open a **Work or Codex** tab — not **Chat**.
2. Model: **Terra / Terra Light** (or **Sol** if available). **Luna** disables WebMCP.
3. Open the in-app browser → [https://t-weaver.vercel.app/](https://t-weaver.vercel.app/).
4. Confirm Site tools lists 8 tools (2 read / 6 write).
5. Run the four prompts in **Judge path** above. Confirm the activity log, not only the chat reply. If the agent leaves the page, use the tighter prompts in that section.

### Google Chrome 149+

1. Enable `chrome://flags/#enable-webmcp-testing` and relaunch. The flag only enables the API; an agent still has to call tools (for example the Model Context Tool Inspector extension).
2. Open the HTTPS URL.
3. DevTools → Application → WebMCP, or the Model Context Tool Inspector.
4. Same prompts as above.

Sample prompts are also on the left rail (click to copy).

## Stack

React 19, Vite, TypeScript, xyflow, Zustand, Tailwind CSS v4. Frontend only.

## License

MIT — see [LICENSE](LICENSE).
