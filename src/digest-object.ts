import { YServer } from "y-partyserver";
import * as Y from "yjs";
import type { Env, Digest } from "./types";
import { generateDigest } from "./anthropic";
import { sendDigestEmail, sendConfirmationEmail } from "./resend";

const MAX_DIGESTS = 30;
const DIGEST_CONTEXT_COUNT = 3;
const ALARM_HOUR_UTC = 8;

export class DigestObject extends YServer<Env> {
  async onLoad() {
    const stored = (await this.ctx.storage.get("doc")) as
      | Uint8Array
      | undefined;
    if (stored) Y.applyUpdate(this.document, new Uint8Array(stored));

    // Watch config changes for alarm scheduling
    this.document.getMap("config").observe(() => {
      this.syncAlarmState().catch((e) =>
        console.error("Alarm sync error:", e)
      );
    });
  }

  async onSave() {
    await this.ctx.storage.put("doc", Y.encodeStateAsUpdate(this.document));
  }

  // --- State helpers ---

  private getEmail(): string | null {
    return (this.document.getMap("config").get("email") as string) ?? null;
  }

  private getTopics(): string[] {
    return this.document.getArray("topics").toArray() as string[];
  }

  private getDigests(): Digest[] {
    return this.document.getArray("digests").toArray() as Digest[];
  }

  private isEnabled(): boolean {
    return (this.document.getMap("config").get("enabled") as boolean) ?? false;
  }

  private getFrequency(): string {
    return (this.document.getMap("config").get("frequency") as string) ?? "daily";
  }

  private isConfirmed(): boolean {
    return (this.document.getMap("config").get("confirmed") as boolean) ?? false;
  }

  private frequencyDays(): number {
    switch (this.getFrequency()) {
      case "every_other_day": return 2;
      case "weekly": return 7;
      case "biweekly": return 14;
      default: return 1;
    }
  }

  // --- Alarm management ---

  private lastScheduledFrequency: string | null = null;

  private async syncAlarmState(): Promise<void> {
    const enabled = this.isEnabled();
    const freq = this.getFrequency();
    const alarm = await this.ctx.storage.getAlarm();

    if (!enabled && alarm) {
      await this.ctx.storage.deleteAlarm();
      this.lastScheduledFrequency = null;
    } else if (enabled && !alarm) {
      await this.scheduleNextAlarm();
      this.lastScheduledFrequency = freq;
    } else if (enabled && alarm && this.lastScheduledFrequency !== freq) {
      // Frequency changed — reschedule
      await this.scheduleNextAlarm();
      this.lastScheduledFrequency = freq;
    }
  }

  private async scheduleNextAlarm(): Promise<void> {
    const days = this.frequencyDays();
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(ALARM_HOUR_UTC, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + days);
    else if (days > 1) next.setUTCDate(next.getUTCDate() + days - 1);
    await this.ctx.storage.setAlarm(next.getTime());
  }

  async onAlarm(): Promise<void> {
    if (!this.isConfirmed()) {
      // Not yet confirmed — skip digest but keep alarm so we retry tomorrow
      if (this.isEnabled()) {
        await this.scheduleNextAlarm();
      }
      return;
    }
    try {
      await this.runDigest();
    } catch (e) {
      console.error("Alarm digest failed:", e);
    }
    if (this.isEnabled()) {
      await this.scheduleNextAlarm();
    }
  }

  // --- Digest generation ---

  private getDashboardUrl(): string {
    // this.name is the room name (the UUID)
    return `https://tellytax.nauseam.workers.dev/d/${this.name}`;
  }

  private async getOrCreateConfirmToken(): Promise<string> {
    const existing = await this.ctx.storage.get<string>("confirmToken");
    if (existing) return existing;
    const token = crypto.randomUUID();
    await this.ctx.storage.put("confirmToken", token);
    return token;
  }

  private async runDigest(): Promise<Digest> {
    const topics = this.getTopics();
    const email = this.getEmail();
    if (topics.length === 0) throw new Error("No topics configured");

    const digests = this.getDigests();
    const context = digests.slice(-DIGEST_CONTEXT_COUNT);

    const digest = await generateDigest(
      this.env.ANTHROPIC_API_KEY,
      topics,
      context,
      this.getDashboardUrl()
    );

    this.document.transact(() => {
      const arr = this.document.getArray("digests");
      arr.push([digest]);
      while (arr.length > MAX_DIGESTS) arr.delete(0, 1);
    });

    if (email) {
      const confirmed = this.isConfirmed();
      let result: { success: boolean; error?: string };
      if (!confirmed) {
        // Token is stored only in DO storage — never exposed to the Yjs client
        const token = await this.getOrCreateConfirmToken();
        const confirmUrl = `https://tellytax.nauseam.workers.dev/confirm/${this.name}/${token}`;
        result = await sendConfirmationEmail(
          this.env.RESEND_API_KEY,
          email,
          confirmUrl,
          digest.subject,
          digest.html
        );
      } else {
        result = await sendDigestEmail(
          this.env.RESEND_API_KEY,
          email,
          digest.subject,
          digest.html
        );
      }
      if (!result.success) console.error("Email send failed:", result.error);
    }

    return digest;
  }

  // --- Custom messages (trigger from client) ---

  async onCustomMessage(
    connection: import("partyserver").Connection,
    message: string
  ): Promise<void> {
    const data = JSON.parse(message);
    if (data.type === "trigger") {
      try {
        await this.runDigest();
        this.sendCustomMessage(
          connection,
          JSON.stringify({ type: "trigger-result", ok: true })
        );
      } catch (e: any) {
        this.sendCustomMessage(
          connection,
          JSON.stringify({
            type: "trigger-result",
            ok: false,
            error: e.message,
          })
        );
      }
    }
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    // Path: /parties/digest-object/:uuid/confirm/:token
    const confirmMatch = url.pathname.match(/\/confirm\/([a-f0-9-]+)$/);
    if (confirmMatch && request.method === "GET") {
      const providedToken = confirmMatch[1];
      const storedToken = await this.ctx.storage.get<string>("confirmToken");
      if (!storedToken || providedToken !== storedToken) {
        return new Response("Invalid or expired confirmation link.", { status: 403 });
      }
      if (!this.isConfirmed()) {
        this.document.transact(() => {
          this.document.getMap("config").set("confirmed", true);
        });
      }
      return Response.redirect(this.getDashboardUrl(), 302);
    }
    return new Response("Not found", { status: 404 });
  }
}
