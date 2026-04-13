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

  (server as any).tool(
    "send_message_to_contact",
    "Send a message to a Lofty CRM contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The message to send to the contact"),
    },
    async (args: any) => {
      const contactId = args.contactId as string;
      const message = args.message as string;
      await postReplyToLofty(contactId, message);
      return {
        content: [{ type: "text", text: `Message sent to contact ${contactId}` }],
      };
    }
  );

  (server as any).tool(
    "generate_ai_reply",
    "Generate an AI reply for an inbound message from a Lofty contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The inbound message from the contact"),
    },
    async (args: any) => {
      const contactId = args.contactId as string;
      const message = args.message as string;
      const prompt = `Lofty inbound message from contact ${contactId}: ${message}`;
      const reply = await askOpenAI(prompt);
      return {
        content: [{ type: "text", text: reply }],
      };
    }
  );

  return server;
}

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message ?? "internal" });
    }
  }
});

app.get("/mcp", (_req: Request, res: Response) => {
  res.status(200).json({ name: "lofty-mcp", version: "0.1.0", status: "ok" });
});

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MCP Lofty server running on port ${port}`));
