import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { postReplyToLofty } from "./lofty";
import { askOpenAI } from "./openai";

dotenv.config();

const app = express();
app.use(express.json());

function createServer() {
  const server = new McpServer({
    name: "lofty-mcp",
    version: "0.1.0",
  });

  server.tool(
    "send_message_to_contact",
    "Send a message to a Lofty CRM contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The message to send to the contact"),
    },
    async ({ contactId, message }: { contactId: string; message: string }) => {
      await postReplyToLofty(contactId, message);
      return {
        content: [{ type: "text", text: `Message sent to contact ${contactId}` }],
      };
    }
  );

  server.tool(
    "generate_ai_reply",
    "Generate an AI reply for an inbound message from a Lofty contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The inbound message from the contact"),
    },
    async ({ contactId, message }: { contactId: string; message: string }) => {
      const prompt = `Lofty inbound message from contact ${contactId}: ${message}`;
      const reply = await askOpenAI(prompt);
      return {
        content: [{ type: "text", text: reply }],
      };
    }
  );

  return server;
}

app.all("/mcp", async (req: Request, res: Response) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MCP Lofty server running on port ${port}`));
