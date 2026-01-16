import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | Uint8Array;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('[Email] SMTP not configured, simulating send');
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content),
        contentType: att.contentType,
      })),
    };

    const result = await getTransporter().sendMail(mailOptions);
    
    console.log(`[Email] Sent to ${options.to}, messageId: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[Email] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function createLetterEmail({
  recipientEmail,
  recipientName,
  senderName,
  subject,
  letterContent,
  pdfBytes,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  letterContent: string;
  pdfBytes?: Uint8Array;
}): EmailOptions {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
    <h1 style="color: #1a1a2e;">GutenBot</h1>
    <p style="color: #666;">Ihr automatisch erstellter Brief</p>
  </div>
  
  <div style="margin-top: 20px;">
    <p>Sehr geehrte/r ${recipientName},</p>
    
    <p>im Anhang finden Sie einen Brief von <strong>${senderName}</strong>.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #1a1a2e; margin: 20px 0;">
      <p style="margin: 0;"><strong>Betreff:</strong> ${subject}</p>
    </div>
    
    <p>Der Brief wurde automatisch erstellt und kann unten eingesehen werden.</p>
  </div>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    <p style="color: #999; font-size: 12px;">
      Dieser Brief wurde mit GutenBot erstellt - Ihrem Assistenten für Behördenbriefe.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
GutenBot - Ihr automatisch erstellter Brief

Sehr geehrte/r ${recipientName},

im Anhang finden Sie einen Brief von ${senderName}.

Betreff: ${subject}

---

${letterContent}

---

Dieser Brief wurde mit GutenBot erstellt.
  `.trim();

  const attachments = pdfBytes
    ? [
        {
          filename: `brief-${Date.now()}.pdf`,
          content: pdfBytes,
          contentType: 'application/pdf',
        },
      ]
    : [];

  return {
    to: recipientEmail,
    subject: `${subject} - GutenBot`,
    text,
    html,
    attachments,
  };
}

export async function verifySMTPConnection(): Promise<boolean> {
  if (!process.env.SMTP_HOST) {
    return false;
  }

  try {
    await getTransporter().verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error);
    return false;
  }
}

export function resetTransporter() {
  transporter = null;
}
