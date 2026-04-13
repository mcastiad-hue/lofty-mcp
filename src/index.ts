// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { postReplyToLofty, createLead } from "./lofty";
import { askOpenAI } from "./openai";

dotenv.config();

const app = express();
app.use(express.json());

function createServer() {
  const server = new McpServer({
    name: "lofty-mcp",
    version: "0.1.0",
  });

  const sendMessageCallback = (async (args: any) => {
    const contactId = args.contactId as string;
    const message = args.message as string;
    await postReplyToLofty(contactId, message);
    return {
      content: [{ type: "text", text: `Message sent to contact ${contactId}` }],
    };
  }) as any;

  server.tool(
    "send_message_to_contact",
    "Send a message to a Lofty CRM contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The message to send to the contact"),
    },
    sendMessageCallback
  );

  const generateAiReplyCallback = (async (args: any) => {
    const contactId = args.contactId as string;
    const message = args.message as string;
    const prompt = `Lofty inbound message from contact ${contactId}: ${message}`;
    const reply = await askOpenAI(prompt);
    return {
      content: [{ type: "text", text: reply }],
    };
  }) as any;

  server.tool(
    "generate_ai_reply",
    "Generate an AI reply for an inbound message from a Lofty contact",
    {
      contactId: z.string().describe("The Lofty contact ID"),
      message: z.string().describe("The inbound message from the contact"),
    },
    generateAiReplyCallback
  );

  const addLoftyLeadCallback = (async (args: any) => {
    const result = await createLead(args);
    return {
      content: [{ type: "text", text: `Lead created: ${JSON.stringify(result)}` }],
    };
  }) as any;

  server.tool(
    "add_lofty_lead",
    "Create a new lead in Lofty CRM",
    {
      firstName: z.string().describe("Lead's first name"),
      lastName: z.string().describe("Lead's last name"),
      email: z.string().optional().describe("Lead's email address"),
      phone: z.string().optional().describe("Lead's phone number"),
      source: z.string().optional().describe("Lead source (e.g. website, referral)"),
    },
    addLoftyLeadCallback
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
