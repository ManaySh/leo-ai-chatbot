import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP_HOST/SMTP_USER/SMTP_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) throw new Error('Missing SMTP_FROM');

  const transport = getTransport();

  await transport.sendMail({
    from,
    to,
    subject: 'Reset your password',
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
