import { Resend } from "resend";

const FROM_ADDRESS = "update@news.chadnauseam.com";

export async function sendDigestEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `TellyTax <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
