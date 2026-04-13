import axios from "axios";
import { Request } from "express";

export function verifyLoftyRequest(req: Request) {
  const auth = (req.headers.authorization || "").toString();
  return auth === `Bearer ${process.env.LOFTY_API_TOKEN}`;
}

export async function postReplyToLofty(contactId: string, text: string) {
  const base = process.env.LOFTY_API_BASE_URL;
  if (!base) throw new Error("LOFTY_API_BASE_URL not set");
  const url = `${base.replace(/\/$/, "")}/contacts/${encodeURIComponent(contactId)}/messages`;
  await axios.post(url, { text }, { headers: { Authorization: `Bearer ${process.env.LOFTY_API_TOKEN}` } });
}

export async function createLead(args: Record<string, any>) {
  const base = process.env.LOFTY_API_BASE_URL;
  if (!base) throw new Error("LOFTY_API_BASE_URL not set");
  const url = `${base.replace(/\/$/, "")}/leads`;
  const resp = await axios.post(url, args, { headers: { Authorization: `Bearer ${process.env.LOFTY_API_TOKEN}` } });
  return resp.data;
}
