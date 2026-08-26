import emailjs from '@emailjs/browser';
import { getEmailConfig } from '../config/emailConfig';
import type { Registration } from './registrationService';

// ── QR Code Generator (Gmail & Outlook Mobile Compatible) ─────────────
export const generateQrCode = async (text: string): Promise<string> => {
  // Use public HTTPS QR Code API so Gmail, Outlook, Apple Mail, and Web Browsers render the image sharply.
  // (Gmail mobile app strictly blocks inline base64 data URIs).
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}&color=0D472B&bgcolor=FFFBF0`;
};

// ── Kerala-themed HTML Email Template ─────────────────────────────
const buildEmailHtml = (registration: Registration, qrDataUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kruponam 2026 — Pass Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F0;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:20px;overflow:hidden;border:2px solid #D4AF37;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

          <!-- Header Band -->
          <tr>
            <td style="background:linear-gradient(135deg,#0D472B 0%,#1a6b42 100%);padding:36px 40px;text-align:center;border-bottom:4px solid #D4AF37;">
              <p style="margin:0 0 8px;font-size:28px;">🌸</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#D4AF37;letter-spacing:2px;font-family:Georgia,serif;">
                KRUPONAM 2026
              </h1>
              <p style="margin:6px 0 0;font-size:12px;color:#a8d5b5;letter-spacing:3px;font-weight:600;text-transform:uppercase;">
                Krupanidhi Degree College • Bengaluru
              </p>
              <p style="margin:12px 0 0;font-size:13px;color:#FDFBF7;font-style:italic;">
                Celebrate Tradition. Celebrate Together.
              </p>
            </td>
          </tr>

          <!-- Approval Banner -->
          <tr>
            <td style="background:#E8F5E9;padding:20px 40px;text-align:center;border-bottom:1px solid #C8E6C9;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#1B5E20;">
                ✅ &nbsp;Your Pass Has Been <span style="color:#0D472B;">APPROVED!</span>
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#388E3C;">
                Welcome to Onam 2026 at Krupanidhi Degree College!
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 40px 8px;">
              <div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
                <p style="margin:0;font-size:13px;font-weight:800;color:#92400E;letter-spacing:0.5px;">
                  📅 OFFICIAL EVENT DATE: FRIDAY, 11 SEPTEMBER 2026 (8:00 AM)
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:#78350F;line-height:1.6;">
                  Please note that <strong>Kruponam 2026</strong> is scheduled for <strong>11 September 2026, 8:00 AM onwards</strong> at Krupanidhi Degree College. Your digital event pass below is active, validated, and scanner-ready for campus gate entry!
                </p>
              </div>

              <p style="font-size:15px;color:#2D4A3E;margin:0;">
                Dear <strong>${registration.fullName}</strong>,
              </p>
              <p style="font-size:13px;color:#555;line-height:1.7;margin:12px 0 0;">
                Your registration for <strong>Kruponam 2026</strong> has been reviewed and 
                <strong style="color:#0D472B;">officially approved</strong> by the Krupanidhi Event Committee.
                Your updated digital event pass and payment invoice are attached below.
                Please carry this pass (digital or printed) to the campus gate for entry.
              </p>
            </td>
          </tr>

          <!-- Invoice Table -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1.5px solid #D4AF37;border-radius:12px;overflow:hidden;font-size:12px;">
                <tr style="background:#0D472B;">
                  <td colspan="2" style="padding:12px 20px;">
                    <span style="color:#D4AF37;font-weight:800;font-size:13px;letter-spacing:1px;">
                      🧾 &nbsp;PAYMENT INVOICE
                    </span>
                    <span style="float:right;color:#a8d5b5;font-size:11px;">Ref: ${registration.id}</span>
                  </td>
                </tr>
                ${[
                  ['Student Name', registration.fullName],
                  ['Email Address', registration.email],
                  ['Phone Number', registration.phone],
                  ['Department & Section', `${registration.department} — ${registration.section || 'Section A'} (${registration.year})`],
                  ['Pass Type', registration.ticketType === 'VIP Pass' ? 'Student Pass' : (registration.ticketType || 'Student Pass')],
                  ['Amount Paid', '₹700.00'],
                  ['Payment UTR / Ref', (!registration.paymentUtr || registration.paymentUtr === 'VIP_COMPLIMENTARY' || registration.paymentUtr === 'VIP') ? 'UPI-VERIFIED-700' : registration.paymentUtr],
                  ['Payment Status', '✅ Verified & Confirmed'],
                  ['Event Date', '11 September 2026, 8:00 AM onwards'],
                  ['Venue', 'Krupanidhi Degree College, Bengaluru'],
                  ['Approved On', registration.approvedAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                ].map(([label, value], i) => `
                  <tr style="background:${i % 2 === 0 ? '#FFFFFF' : '#FAFAF5'};">
                    <td style="padding:10px 20px;color:#555;font-weight:600;width:40%;border-bottom:1px solid #F0EBD8;">
                      ${label}
                    </td>
                    <td style="padding:10px 20px;color:#0D472B;font-weight:700;border-bottom:1px solid #F0EBD8;">
                      ${value}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- QR Code Ticket -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:linear-gradient(135deg,#0D472B 0%,#1a6b42 50%,#0D472B 100%);
                       border-radius:16px;border:3px solid #D4AF37;overflow:hidden;">
                <!-- Ticket Header -->
                <tr>
                  <td colspan="2" style="padding:16px 24px;text-align:center;border-bottom:2px dashed #D4AF37;">
                    <p style="margin:0;font-size:16px;font-weight:800;color:#D4AF37;letter-spacing:2px;">
                      🎟️ &nbsp;OFFICIAL EVENT PASS
                    </p>
                    <p style="margin:4px 0 0;font-size:10px;color:#a8d5b5;letter-spacing:3px;text-transform:uppercase;">
                      Kruponam 2026 • Krupanidhi Degree College
                    </p>
                  </td>
                </tr>
                <!-- Ticket Body -->
                <tr>
                  <td style="padding:20px 24px;vertical-align:middle;">
                    <p style="margin:0;font-size:11px;color:#a8d5b5;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Attendee</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#FFFFFF;font-family:Georgia,serif;">
                      ${registration.fullName}
                    </p>
                    <p style="margin:6px 0 0;font-size:12px;color:#a8d5b5;">
                      ${registration.department} • ${registration.year}
                    </p>
                    <p style="margin:10px 0 0;font-size:11px;color:#D4AF37;font-weight:700;">
                      📅 11 September 2026 &nbsp;|&nbsp; 8:00 AM
                    </p>
                    <p style="margin:4px 0 0;font-size:11px;color:#a8d5b5;">
                      📍 PSR Convention Centre
                    </p>
                    <p style="margin:12px 0 0;display:inline-block;padding:5px 14px;background:#D4AF37;color:#0D472B;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1px;">
                      ${(registration.ticketType === 'VIP Pass' ? 'STUDENT PASS' : (registration.ticketType || 'STUDENT PASS')).toUpperCase()}
                    </p>
                    <p style="margin:14px 0 0;font-size:11px;color:#D4AF37;font-family:monospace;font-weight:700;letter-spacing:1px;">
                      TOKEN: ${registration.id}
                    </p>
                  </td>
                  <!-- QR Code -->
                  <td style="padding:20px 24px;text-align:center;vertical-align:middle;min-width:140px;">
                    <div style="background:#FFFBF0;border-radius:12px;padding:8px;display:inline-block;border:2px solid #D4AF37;">
                      ${qrDataUrl
                        ? `<img src="${qrDataUrl}" width="130" height="130" alt="QR Code" style="display:block;border-radius:6px;" />`
                        : `<div style="width:130px;height:130px;display:flex;align-items:center;justify-content:center;color:#0D472B;font-size:11px;font-weight:700;">QR Code<br/>${registration.id}</div>`
                      }
                    </div>
                    <p style="margin:8px 0 0;font-size:9px;color:#a8d5b5;letter-spacing:1px;">SCAN AT CAMPUS GATE</p>
                  </td>
                </tr>
                <!-- Ticket Footer -->
                <tr>
                  <td colspan="2" style="padding:10px 24px;text-align:center;border-top:2px dashed #D4AF37;">
                    <p style="margin:0;font-size:10px;color:#a8d5b5;">
                      ✅ ₹700 Payment Verified &nbsp;|&nbsp; ✅ Student ID Approved &nbsp;|&nbsp; 🌸 Onasadya Feast Token: VALID
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="font-size:12px;color:#777;line-height:1.7;margin:0;">
                📌 <strong>Important:</strong> Please carry this pass (digital screenshot or print) at the campus gate on event day. 
                Your QR code will be scanned by the event coordinators for entry and Onasadya feast token validation.
              </p>
              <p style="font-size:12px;color:#777;margin:8px 0 0;">
                For any queries, contact us at 
                <a href="mailto:kruponam2026@krupanidhi.edu.in" style="color:#0D472B;font-weight:700;">kruponam2026@krupanidhi.edu.in</a>
              </p>
            </td>
          </tr>

          <!-- Bottom Band -->
          <tr>
            <td style="background:#0D472B;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#D4AF37;font-weight:700;letter-spacing:1px;">
                🌸 &nbsp;KRUPONAM 2026 &nbsp;•&nbsp; KRUPANIDHI DEGREE COLLEGE
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#a8d5b5;">
                Carmelaram Road, Chikkabellandur, Bengaluru — 560035
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#6aaf82;font-style:italic;">
                This is an automated email. Please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

// ── Email Result ────────────────────────────────────────────────────
export interface EmailResult {
  success: boolean;
  message: string;
  previewHtml: string;
  qrDataUrl: string;
}

let resendKeyIndex = 0;
let brevoKeyIndex = 0;

const getActiveResendKey = (rawKeys: string): string => {
  const keys = rawKeys.split(/[\s,]+/).map(k => k.trim()).filter(k => k.length > 5);
  if (keys.length === 0) return rawKeys;
  const key = keys[resendKeyIndex % keys.length];
  resendKeyIndex++;
  return key;
};

const getActiveBrevoKey = (rawKeys: string): string => {
  const keys = rawKeys.split(/[\s,]+/).map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return rawKeys;
  const key = keys[brevoKeyIndex % keys.length];
  brevoKeyIndex++;
  return key;
};

// ── Main Send Function ──────────────────────────────────────────────
export const sendApprovalEmail = async (registration: Registration): Promise<EmailResult> => {
  // 1. Generate QR code
  const qrDataUrl = await generateQrCode(
    `KRUPONAM2026|TOKEN:${registration.id}|NAME:${registration.fullName}|DEPT:${registration.department}|UTR:${registration.paymentUtr}`
  );

  // 2. Build HTML body
  const html = buildEmailHtml(registration, qrDataUrl);
  const cfg = getEmailConfig();

  let lastErrorNotice = '';

  // 3A. Try Resend API first (3,000 Free Emails / Month with verified lifestack.in domain)
  if (cfg.resendApiKey) {
    const apiKey = getActiveResendKey(cfg.resendApiKey);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: cfg.resendFromEmail || 'Kruponam 2026 Pass <pass@lifestack.in>',
          to: [registration.email],
          subject: `🎟️ Kruponam 2026 Official Pass [Sep 11, 2026] & Invoice (${registration.id})`,
          html: html,
        }),
      });

      if (res.ok) {
        return {
          success: true,
          message: `✉️ [Resend API] Invoice & QR Ticket sent directly to ${registration.email}!`,
          previewHtml: html,
          qrDataUrl,
        };
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.message?.includes('testing emails')) {
          lastErrorNotice = `⚠️ Resend Restriction: Free test account can only send to account owner (awtwhatsapp.crashlog@gmail.com). Add domain at resend.com/domains or use Brevo xkeysib key.`;
        } else {
          lastErrorNotice = `⚠️ Resend API Notice (${res.status}): ${errorData.message || res.statusText}`;
        }
        console.warn('Resend API notice:', lastErrorNotice);
      }
    } catch (err: any) {
      console.error('Resend API send error:', err);
    }
  }

  // 3B. Try Brevo API second (9,000 Free Emails / Month)
  if (cfg.brevoApiKey && cfg.brevoApiKey.startsWith('xkeysib')) {
    const apiKey = getActiveBrevoKey(cfg.brevoApiKey);
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Kruponam 2026', email: 'awtwhatsapp.crashlog@gmail.com' },
          to: [{ email: registration.email, name: registration.fullName }],
          subject: `🎟️ Kruponam 2026 Official Pass [Sep 11, 2026] & Invoice (${registration.id})`,
          htmlContent: html,
        }),
      });

      if (res.ok) {
        return {
          success: true,
          message: `✉️ [Brevo API] Invoice & QR Ticket sent directly to ${registration.email}!`,
          previewHtml: html,
          qrDataUrl,
        };
      } else {
        const errorData = await res.json().catch(() => ({}));
        lastErrorNotice = `⚠️ Brevo API Notice (${res.status}): ${errorData.message || res.statusText}`;
        console.warn('Brevo API notice:', lastErrorNotice);
      }
    } catch (err: any) {
      console.error('Brevo API send error:', err);
    }
  }

  // 3C. Send via EmailJS API (Free 200 emails / mo)
  if (cfg.provider === 'emailjs') {
    try {
      await emailjs.send(
        cfg.emailjsServiceId,
        cfg.emailjsTemplateId,
        {
          to_email: registration.email,
          to_name: registration.fullName,
          subject: `✅ Kruponam 2026 — Pass Approved! Your Invoice & QR Ticket (${registration.id})`,
          message_html: html,
          reg_id: registration.id,
          dept: `${registration.department} — ${registration.year}`,
          utr: registration.paymentUtr,
        },
        cfg.emailjsPublicKey
      );

      return {
        success: true,
        message: `✉️ [EmailJS] Invoice & QR Ticket sent directly to ${registration.email}!`,
        previewHtml: html,
        qrDataUrl,
      };
    } catch (err: any) {
      console.error('EmailJS send error:', err);
      return {
        success: false,
        message: `⚠️ Email delivery notice: ${err?.text || err?.message || 'Check EmailJS API credentials'}. Preview shown below.`,
        previewHtml: html,
        qrDataUrl,
      };
    }
  }

  // 4. Preview mode (No API key added yet)
  return {
    success: false,
    message: lastErrorNotice || `📧 Email Preview Mode — Enter Resend Key (3k free/mo) or Brevo Key (9k free/mo) in Admin Portal → Cloud DB & Email Settings to auto-send to student inbox.`,
    previewHtml: html,
    qrDataUrl,
  };
};
