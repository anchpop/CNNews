import { Resend } from "resend";

const FROM_ADDRESS = "news@news.chadnauseam.com";

export async function sendDigestEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `CN News <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function sendConfirmationEmail(
  apiKey: string,
  to: string,
  confirmUrl: string,
  dashboardUrl: string,
  topics: string[] = []
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(apiKey);

  const topicsHtml = topics.length > 0
    ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px 0;">Your topics: <strong>${topics.map(escapeHtml).join("</strong>, <strong>")}</strong></p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;">
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 12px 0;">Confirm your CN News digest</h1>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px 0;">Click the button below to verify your email and start receiving digests.</p>
      ${topicsHtml}
      <a href="${confirmUrl}" style="display:inline-block;background:#e67e22;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 36px;border-radius:8px;">Confirm subscription</a>
      <p style="color:#999;font-size:12px;margin:24px 0 0 0;">If you didn't sign up, you can safely ignore this email.</p>
      <div style="padding-top:20px;margin-top:20px;border-top:1px solid #f0f0f0;">
        <a href="${dashboardUrl}" style="color:#e67e22;font-size:12px;text-decoration:none;">Manage digest settings</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: `CN News <${FROM_ADDRESS}>`,
    to,
    subject: "Confirm your CN News digest",
    html,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
