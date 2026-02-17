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
    from: `Nauseam News <${FROM_ADDRESS}>`,
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
  digestSubject: string,
  digestHtml: string
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(apiKey);

  const confirmBanner = `
<div style="background:#fff3cd;border:2px solid #e67e22;border-radius:10px;padding:24px 28px;margin-bottom:32px;text-align:center;">
  <p style="margin:0 0 6px 0;font-size:18px;font-weight:700;color:#1a1a2e;">✅ Confirm your Nauseam News digest</p>
  <p style="margin:0 0 18px 0;font-size:14px;color:#555;">Click below to confirm your subscription and start receiving daily digests.</p>
  <a href="${confirmUrl}" style="display:inline-block;background:#e67e22;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:12px 32px;border-radius:6px;">Confirm subscription</a>
  <p style="margin:18px 0 0 0;font-size:12px;color:#999;">Your first digest is shown below as a preview. Future digests will only be sent after you confirm.</p>
</div>`;

  // Inject the confirmation banner at the top of the digest HTML body
  const combinedHtml = digestHtml.replace(
    /<div style="max-width:600px/,
    `<div style="max-width:600px;margin:0 auto;padding:20px 20px 0;">${confirmBanner}</div><div style="max-width:600px`
  );

  const { error } = await resend.emails.send({
    from: `Nauseam News <${FROM_ADDRESS}>`,
    to,
    subject: `[Action required] Confirm your digest — ${digestSubject}`,
    html: combinedHtml,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
