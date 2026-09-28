import { config } from '../../config/index.js';
import { HttpError } from '../../utils/HttpError.js';

// Sends email through the provider chosen by MAIL_PROVIDER:
//   brevo   -> real delivery via the Brevo API
//   mailpit -> local test inbox at http://localhost:8025 (nothing leaves your machine)
//   console -> prints the email in the backend terminal

async function sendWithBrevo({ to, subject, html, text }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.mail.brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: config.mail.fromName, email: config.mail.fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Brevo returned ${response.status}: ${body.message || 'unknown error'}`);
  }
}

async function sendWithMailpit({ to, subject, html, text }) {
  const response = await fetch(`${config.mail.mailpitUrl}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      From: { Email: config.mail.fromEmail, Name: config.mail.fromName },
      To: [{ Email: to }],
      Subject: subject,
      HTML: html,
      Text: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mailpit returned ${response.status}. Is it running? (docker start mailpit)`);
  }
}

function printToConsole({ to, subject, text }) {
  console.log(`\n[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
}

export async function sendMail(message) {
  try {
    if (config.mail.provider === 'brevo') return await sendWithBrevo(message);
    if (config.mail.provider === 'mailpit') return await sendWithMailpit(message);
    return printToConsole(message);
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new HttpError(502, 'We could not send the email right now. Please try again in a minute.');
  }
}
