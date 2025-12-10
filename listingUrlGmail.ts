import * as path from "path";
import * as fs from "fs";
import { google, gmail_v1 } from "googleapis";
import * as cheerio from "cheerio";
// ----------------------------------------------------
// Paths
// ----------------------------------------------------
const ROOT = process.cwd();           // runtime working dir where pm2 starts
const CREDENTIALS_PATH = path.join(ROOT, 'credentials.json');
export const TOKEN_PATH = path.join(ROOT, "token.json");

// ----------------------------------------------------
// Validate credentials.json
// ----------------------------------------------------
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error("ERROR: credentials.json not found in project root.");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
const { client_id, client_secret, redirect_uris } = credentials.web;

// OAuth client
export const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  "http://nwmovers-scraping.com:8000/api/oauth2callback"
);

// ----------------------------------------------------
// Gmail Client
// ----------------------------------------------------
const getGmailClient = (accessToken: string, refreshToken: string) => {
  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oAuth2Client });
};

const decodeBody = (body: gmail_v1.Schema$MessagePartBody | undefined): string => {
  if (!body?.data) return "";
  const data = body.data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(data, "base64").toString("utf-8");
};

const extractHtmlFromPayload = (payload?: gmail_v1.Schema$MessagePart): string => {
  if (!payload) return "";

  if (payload.mimeType === "text/html" && payload.body) {
    return decodeBody(payload.body);
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const html = extractHtmlFromPayload(part);
      if (html) return html;
    }
  }

  return "";
};

const extractSeeMoreLink = (html: string | null): string | null => {
  if (!html) return null;

  // cheerio import note:
  // if using `import * as cheerio from 'cheerio'`, cheerio.load might be undefined depending on tsconfig.
  // prefer `import cheerio from 'cheerio'` with "esModuleInterop": true, or use require:
  // const cheerio = require('cheerio');

  const $ = (cheerio as any).load(html); // cast to any if TS import shape differs

  // helper: normalize text: remove extra spaces, digits, punctuation
  const norm = (s: string) =>
    s.replace(/\d+/g, "")           // remove numbers (so "See 49 More Photos" -> "See  More Photos")
      .replace(/[^\w\s]/g, "")      // remove punctuation
      .replace(/\s+/g, " ")         // collapse whitespace
      .trim()
      .toLowerCase();

  // 1) Primary: find anchor elements whose visible text matches common patterns
  const anchorByText = $("a").filter((_, el) => {
    const text = $(el).text() || "";
    if (!text.trim()) return false;
    const n = norm(text);
    if (n.includes("see more")) return true;             // "see more"
    if (n.match(/see\s*more|see\s*photos/)) return true; // "see more", "see photos"
    if (n.match(/see\s*.*more/)) return true;            // "see 49 more photos"
    if (/see.*photos/.test(n)) return true;              // "see 49 photos"
    return false;
  }).first();

  if (anchorByText && anchorByText.length) {
    const href = anchorByText.attr("href");
    if (href) return href;
  }

  // 2) Fallback: anchors containing trulia/click.prop.trulia domains (common for Trulia emails)
  const anchorByHref = $("a[href]").filter((_, el) => {
    const href = $(el).attr("href") || "";
    return /trulia\.com|prop\.trulia|click\.prop\.trulia|click\.prop\.trulia/.test(href);
  }).first();
  if (anchorByHref && anchorByHref.length) {
    return anchorByHref.attr("href") || null;
  }

  // 3) Last fallback: any anchor with text length > 0 that has words 'more' or 'photos'
  const anchorLoose = $("a").filter((_, el) => {
    const text = ($(el).text() || "").toLowerCase();
    return text.includes("more") || text.includes("photos");
  }).first();
  if (anchorLoose && anchorLoose.length) {
    return anchorLoose.attr("href") || null;
  }

  return null;
};

// ----------------------------------------------------
// Gmail Message Service Interface
// ----------------------------------------------------
interface ListInboxOptions {
  userId: string;
  accessToken: string;
  refreshToken: string;
  maxResults?: number;
  onlyUnread?: boolean;
  fromEmail?: string | null;
  after?: string;
  before?: string;
}

// ----------------------------------------------------
// Gmail Message Service
// ----------------------------------------------------
export class GmailMessageService {
  static async listInboxMessages(options: ListInboxOptions) {
    const {
      userId,
      accessToken,
      refreshToken,
      maxResults = 10,
      onlyUnread = false,
      fromEmail = null,
      after,
      before,
    } = options;

    try {
      const gmail = getGmailClient(accessToken, refreshToken);

      const labelIds = onlyUnread ? ["INBOX", "UNREAD"] : ["INBOX"];

      let query = "";
      if (onlyUnread && fromEmail) {
        // query = `${fromEmail}`;
        query = `${fromEmail} is:unread `;
      }
      // after:2025/11/26 before:2025/11/28
      if (after) {
        query += `after:${after} `;
      }
      if (before) {
        query += `before:${before} `;
      }
      console.log("Gmail Query:", query.trim());
      const list = await gmail.users.messages.list({
        userId,
        labelIds,
        maxResults,
        q: query || undefined,
      });

      const messageIds = list.data.messages?.map((m) => m.id) || [];
      if (messageIds.length === 0) return [];

      const final = [];

      for (const id of messageIds) {
        const msgRes = await gmail.users.messages.get({
          userId,
          id,
          format: "full",
        });

        const msg = msgRes.data;
        if (!msg?.payload) continue;

        const headers = msg.payload.headers || [];
        const pick = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

        const html = extractHtmlFromPayload(msg.payload);
        const seeMoreUrl = extractSeeMoreLink(html);

        final.push({
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet,
          subject: pick("Subject"),
          from: pick("From"),
          to: pick("To"),
          date: pick("Date"),
          seeMoreUrl,
        });
      }

      return final;
    } catch (err: any) {
      console.error("Error fetching inbox:", err.response?.data || err);
      throw new Error("Failed to fetch inbox messages");
    }
  }
}

export default {
  oAuth2Client,
  TOKEN_PATH,
  GmailMessageService,
}

