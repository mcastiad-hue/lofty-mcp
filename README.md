# MCP — Lofty CRM integration

Quick scaffold for an MCP-style server that receives Lofty webhooks and forwards to OpenAI.

Setup

1. Copy `.env.example` to `.env` and fill values.

2. Install and run:

```bash
cd mcp-lofty-integration
npm install
npm run dev
```

Endpoints

- `POST /lofty/webhook` — accept incoming Lofty webhook (expects `Authorization: Bearer <LOFTY_API_TOKEN>`). The server will call OpenAI and post a reply back to the Lofty contact using `LOFTY_API_BASE_URL`.
- `GET /mcp/health` — simple health check.

Customize

- Update `LOFTY_API_BASE_URL` to the correct Lofty API, and adjust `src/lofty.ts` endpoints if needed.

Testing locally

- Start the server in one terminal:

```bash
npm run dev
```

- In another terminal, with `.env` filled, run the test webhook sender:

```bash
node src/test/send_test_webhook.js
```

This will POST a sample message to `/lofty/webhook` using the `LOFTY_API_TOKEN` from your `.env` file.
