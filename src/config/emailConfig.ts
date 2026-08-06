// ─────────────────────────────────────────────────────────
//  KRUPONAM 2026 — High-Volume Email Dispatch Configuration
// ─────────────────────────────────────────────────────────
//
//  FREE HIGH-VOLUME EMAIL OPTIONS:
//  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. RESEND API (RECOMMENDED FOR 3,000+ FREE EMAILS / MONTH):
//     - Sign up at https://resend.com/ (free)
//     - Copy your API Key (e.g. 're_12345678...')
//     - Capacity: 3,000 Free Emails / Month (100 / day)
//
//  2. BREVO API (FOR 9,000+ FREE EMAILS / MONTH):
//     - Sign up at https://www.brevo.com/ (free)
//     - Copy your SMTP/API Key (e.g. 'xkeysib-...')
//     - Capacity: 9,000 Free Emails / Month (300 / day)
//
//  3. EMAILJS API (FOR 200 FREE EMAILS / MONTH):
//     - Sign up at https://www.emailjs.com/
// ─────────────────────────────────────────────────────────

export interface EmailConfig {
  provider: 'resend' | 'brevo' | 'emailjs' | 'none';
  resendApiKey: string;
  brevoApiKey: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
}

export const getEmailConfig = (): EmailConfig => {
  if (typeof window === 'undefined') {
    return {
      provider: 'none',
      resendApiKey: '',
      brevoApiKey: '',
      emailjsServiceId: '',
      emailjsTemplateId: '',
      emailjsPublicKey: '',
    };
  }

  const resendKey = localStorage.getItem('kruponam_resend_api_key') || import.meta.env.VITE_RESEND_API_KEY || '';
  const brevoKey = localStorage.getItem('kruponam_brevo_api_key') || import.meta.env.VITE_BREVO_API_KEY || '';
  
  const emailjsServiceId = localStorage.getItem('kruponam_emailjs_service_id') || import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const emailjsTemplateId = localStorage.getItem('kruponam_emailjs_template_id') || import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const emailjsPublicKey = localStorage.getItem('kruponam_emailjs_public_key') || import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

  let provider: EmailConfig['provider'] = 'none';

  if (brevoKey && (brevoKey.startsWith('xsmtp') || brevoKey.startsWith('xkeysib') || brevoKey.length > 10)) {
    provider = 'brevo';
  } else if (resendKey && (resendKey.startsWith('re_') || resendKey.length > 5)) {
    provider = 'resend';
  } else if (
    emailjsServiceId && 
    emailjsTemplateId && 
    emailjsPublicKey &&
    emailjsServiceId !== 'YOUR_EMAILJS_SERVICE_ID'
  ) {
    provider = 'emailjs';
  }

  return {
    provider,
    resendApiKey: resendKey,
    brevoApiKey: brevoKey,
    emailjsServiceId,
    emailjsTemplateId,
    emailjsPublicKey,
  };
};

export const saveResendApiKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kruponam_resend_api_key', apiKey.trim());
  }
};

export const saveBrevoApiKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kruponam_brevo_api_key', apiKey.trim());
  }
};

export const saveEmailCredentials = (serviceId: string, templateId: string, publicKey: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kruponam_emailjs_service_id', serviceId.trim());
  localStorage.setItem('kruponam_emailjs_template_id', templateId.trim());
  localStorage.setItem('kruponam_emailjs_public_key', publicKey.trim());
};

export const isEmailEnabled = (): boolean => {
  const cfg = getEmailConfig();
  return cfg.provider !== 'none';
};
