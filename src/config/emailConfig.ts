// ─────────────────────────────────────────────────────────
//  KRUPONAM 2026 — EmailJS Configuration
// ─────────────────────────────────────────────────────────
//
//  HOW TO SET UP REAL EMAILS (FREE — 200/month):
//  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. Sign up at https://www.emailjs.com/ (free)
//  2. Dashboard → Email Services → Add Service (Gmail / SMTP)
//     → Copy the Service ID below.
//  3. Dashboard → Email Templates → Create Template
//     → Use the HTML body that emailService.ts sends.
//     → Map variables: {{to_email}}, {{to_name}}, {{message_html}}
//     → Copy the Template ID below.
//  4. Dashboard → Account → General → Public Key
//     → Copy the Public Key below.
//  5. Save this file — emails will start sending instantly!
//
//  Until configured, the system shows an on-screen Email Preview.
// ─────────────────────────────────────────────────────────

export const EMAIL_CONFIG = {
  SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',   // e.g. 'service_abc123'
  TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID', // e.g. 'template_xyz789'
  PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',   // e.g. 'AbCdEfGh12345678'
};

// Set to true only when the 3 values above are filled in.
export const EMAIL_ENABLED =
  EMAIL_CONFIG.SERVICE_ID !== 'YOUR_EMAILJS_SERVICE_ID' &&
  EMAIL_CONFIG.TEMPLATE_ID !== 'YOUR_EMAILJS_TEMPLATE_ID' &&
  EMAIL_CONFIG.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY';
