import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/utils/pdf';
import { sendEmail, createLetterEmail } from '@/lib/utils/email';

interface SendRequest {
  letterId: string;
  format: 'pdf' | 'email' | 'both';
  recipientEmail?: string;
  recipientName?: string;
  recipientAddress?: string;
  letterContent: string;
  subject: string;
  sender: {
    name: string;
    street: string;
    zip: string;
    city: string;
  };
  aktenzeichen?: string;
  date?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendRequest = await request.json();

    if (!body.letterId) {
      return NextResponse.json(
        { error: 'letterId ist erforderlich' },
        { status: 400 }
      );
    }

    if (!body.letterContent) {
      return NextResponse.json(
        { error: 'letterContent ist erforderlich' },
        { status: 400 }
      );
    }

    if (!body.sender) {
      return NextResponse.json(
        { error: 'sender Informationen sind erforderlich' },
        { status: 400 }
      );
    }

    const date = body.date || new Date().toLocaleDateString('de-DE');
    const pdfBytes = await generatePDF({
      sender: body.sender,
      recipient: {
        name: body.recipientName || 'Empfänger',
        address: body.recipientAddress || '',
      },
      date,
      subject: body.subject,
      content: body.letterContent,
      aktenzeichen: body.aktenzeichen,
    });

    const results: {
      pdf?: { success: boolean; url?: string };
      email?: { success: boolean; messageId?: string };
    } = {};

    // Generate PDF download URL
    if (body.format === 'pdf' || body.format === 'both') {
      // In production, this would upload to S3/R2
      // For now, return base64 encoded PDF
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      results.pdf = {
        success: true,
        url: `data:application/pdf;base64,${pdfBase64}`,
      };
    }

    // Send email
    if (body.format === 'email' || body.format === 'both') {
      if (!body.recipientEmail) {
        return NextResponse.json(
          { error: 'recipientEmail ist erforderlich für E-Mail-Versand' },
          { status: 400 }
        );
      }

      const emailOptions = createLetterEmail({
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName || 'Empfänger',
        senderName: body.sender.name,
        subject: body.subject,
        letterContent: body.letterContent,
        pdfBytes: body.format === 'both' ? pdfBytes : undefined,
      });

      const emailResult = await sendEmail(emailOptions);
      results.email = {
        success: emailResult.success,
        messageId: emailResult.messageId,
      };

      if (!emailResult.success) {
        return NextResponse.json(
          { error: `E-Mail-Versand fehlgeschlagen: ${emailResult.error}` },
          { status: 500 }
        );
      }
    }

    console.log(`[Send] Letter ${body.letterId} sent successfully`);

    return NextResponse.json({
      success: true,
      letterId: body.letterId,
      date: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('[Send] Error:', error);
    return NextResponse.json(
      { error: 'Versand fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'send-api',
    methods: ['POST'],
    requiredFields: ['letterId', 'letterContent', 'sender', 'subject'],
    formats: ['pdf', 'email', 'both'],
  });
}
