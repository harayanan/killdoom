import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendDigestEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();

    const { error } = await resend.emails.send({
      from: 'KillDoom Digest <onboarding@resend.dev>',
      to,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`Failed to send digest email to ${to}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Email send error for ${to}:`, msg);
    return { success: false, error: msg };
  }
}
