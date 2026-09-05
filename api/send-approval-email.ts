import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { registration, qrDataUrl } = req.body;
    if (!registration || !registration.email) {
      return res.status(400).json({ success: false, message: 'Missing registration details or email' });
    }

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const resendFrom = process.env.RESEND_FROM_EMAIL || 'Kruponam 2026 <onboarding@resend.dev>';
    const brevoApiKey = process.env.BREVO_API_KEY || '';

    const cleanEmail = registration.email.trim().toLowerCase();

    // 1. Try Resend API
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [cleanEmail],
            subject: `🎟️ Kruponam 2026 Official Pass & Invoice (${registration.id})`,
            html: req.body.html,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return res.status(200).json({
            success: true,
            message: `✉️ Official Pass emailed to ${cleanEmail} via Resend!`,
            providerId: data.id,
          });
        }

        // If from address failed (e.g. unverified domain), retry with default onboarding@resend.dev
        if (!response.ok && resendFrom !== 'onboarding@resend.dev' && (data.message?.includes('domain') || data.message?.includes('verify') || response.status === 403)) {
          const retryRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Kruponam 2026 <onboarding@resend.dev>',
              to: [cleanEmail],
              subject: `🎟️ Kruponam 2026 Official Pass & Invoice (${registration.id})`,
              html: req.body.html,
            }),
          });
          const retryData = await retryRes.json().catch(() => ({}));
          if (retryRes.ok) {
            return res.status(200).json({
              success: true,
              message: `✉️ Official Pass emailed to ${cleanEmail} via Resend (onboarding domain)!`,
              providerId: retryData.id,
            });
          }
        }
      } catch (err: any) {
        console.error('Serverless Resend Error:', err);
      }
    }

    // 2. Try Brevo API if valid v3 API key (starts with xkeysib-)
    if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'Kruponam 2026', email: 'awtwhatsapp.crashlog@gmail.com' },
            to: [{ email: cleanEmail, name: registration.fullName }],
            subject: `🎟️ Kruponam 2026 Official Pass & Invoice (${registration.id})`,
            htmlContent: req.body.html,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return res.status(200).json({
            success: true,
            message: `✉️ Official Pass emailed to ${cleanEmail} via Brevo!`,
            providerId: data.messageId,
          });
        }
      } catch (err: any) {
        console.error('Serverless Brevo Error:', err);
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Could not deliver email through configured providers. Please verify email provider credentials or domain verification.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while sending email',
    });
  }
}
