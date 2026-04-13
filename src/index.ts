import express from "express";
import dotenv from "dotenv";
import { verifyLoftyRequest, postReplyToLofty } from "./lofty";
import { askOpenAI } from "./openai";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/mcp/health", (_req, res) => res.json({ status: "ok" }));

app.post("/lofty/webhook", async (req, res) => {
  try {
    if (!verifyLoftyRequest(req)) return res.status(401).json({ error: "unauthorized" });
    const { message, contactId } = req.body;
    if (!message || !contactId) return res.status(400).json({ error: "missing message or contactId" });

    const prompt = `Lofty inbound message from contact ${contactId}: ${message}`;
    const reply = await askOpenAI(prompt);

    await postReplyToLofty(contactId, reply);
    return res.json({ status: "sent", reply });
  } catch (err: any) {
    console.error(err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "internal" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MCP Lofty integration running on ${port}`));
