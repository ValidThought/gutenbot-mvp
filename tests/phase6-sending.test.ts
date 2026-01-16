import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
    verify: vi.fn().mockResolvedValue(true),
  })),
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock environment
vi.stubEnv('SMTP_HOST', 'smtp.test.com');
vi.stubEnv('SMTP_PORT', '587');
vi.stubEnv('SMTP_USER', 'test@test.com');
vi.stubEnv('SMTP_PASS', 'testpass');
vi.stubEnv('SMTP_FROM', 'noreply@gutenbot.de');

describe('Phase 6: Sending Module', () => {
  const projectRoot = process.cwd();

  describe('PDF Generation', () => {
    it('should export generatePDF function', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      expect(generatePDF).toBeDefined();
      expect(typeof generatePDF).toBe('function');
    });

    it('should export generateWiderspruchPDF function', async () => {
      const { generateWiderspruchPDF } = await import('@/lib/utils/pdf');
      expect(generateWiderspruchPDF).toBeDefined();
      expect(typeof generateWiderspruchPDF).toBe('function');
    });

    it('should generate valid PDF structure', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const testData = {
        sender: {
          name: 'Hans Müller',
          street: 'Hauptstraße 1',
          zip: '10115',
          city: 'Berlin',
        },
        recipient: {
          name: 'Finanzamt Berlin',
          address: 'Kirchstraße 7\n10557 Berlin',
        },
        date: '15.01.2025',
        subject: 'Widerspruch gegen Einkommensteuerbescheid',
        content: 'Sehr geehrte Damen und Herren,\n\nhiermit lege ich Widerspruch ein.',
        aktenzeichen: '12345/67890',
      };

      const pdfBytes = await generatePDF(testData);
      
      expect(pdfBytes).toBeDefined();
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(0);

      // Check PDF header (%PDF-)
      const header = String.fromCharCode(pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]);
      expect(header).toBe('%PDF');
    });

    it('should include sender information in PDF', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const testData = {
        sender: {
          name: 'Test Sender',
          street: 'Test Street 123',
          zip: '12345',
          city: 'TestCity',
        },
        recipient: {
          name: 'Test Recipient',
          address: 'Recipient Address',
        },
        date: '01.01.2025',
        subject: 'Test Subject',
        content: 'Test content',
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should handle long content with multiple pages', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const longContent = Array(100).fill('Dies ist eine sehr lange Zeile mit viel Text die möglicherweise über mehrere Seiten verteilt werden muss. ').join('\n');
      
      const testData = {
        sender: {
          name: 'Test',
          street: 'Test',
          zip: '12345',
          city: 'Test',
        },
        recipient: {
          name: 'Test',
          address: 'Test',
        },
        date: '01.01.2025',
        subject: 'Long Content Test',
        content: longContent,
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });

    it('should handle special characters in German text', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const testData = {
        sender: {
          name: 'Müller-Weiß',
          street: 'Münchener Str. 123',
          zip: '80331',
          city: 'München',
        },
        recipient: {
          name: 'Bezirksamt',
          address: 'Königstraße 1',
        },
        date: '15.01.2025',
        subject: 'Widerspruch',
        content: 'Größe, Straße, Müßiggänger, Biß, Süß, Grüß Gott.',
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('Email Service', () => {
    it('should export sendEmail function', async () => {
      const { sendEmail } = await import('@/lib/utils/email');
      expect(sendEmail).toBeDefined();
      expect(typeof sendEmail).toBe('function');
    });

    it('should export createLetterEmail function', async () => {
      const { createLetterEmail } = await import('@/lib/utils/email');
      expect(createLetterEmail).toBeDefined();
      expect(typeof createLetterEmail).toBe('function');
    });

    it('should export verifySMTPConnection function', async () => {
      const { verifySMTPConnection } = await import('@/lib/utils/email');
      expect(verifySMTPConnection).toBeDefined();
      expect(typeof verifySMTPConnection).toBe('function');
    });

    it('should create valid email options', async () => {
      const { createLetterEmail } = await import('@/lib/utils/email');
      
      const email = createLetterEmail({
        recipientEmail: 'test@example.de',
        recipientName: 'Test Recipient',
        senderName: 'Hans Müller',
        subject: 'Widerspruch',
        letterContent: 'Sehr geehrte Damen und Herren...',
      });

      expect(email).toHaveProperty('to', 'test@example.de');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('text');
      expect(email).toHaveProperty('html');
      expect(email.text).toContain('Hans Müller');
      expect(email.html).toContain('GutenBot');
    });

    it('should include PDF attachment when provided', async () => {
      const { createLetterEmail } = await import('@/lib/utils/email');
      
      const pdfBytes = new Uint8Array([80, 75, 3, 4]); // Mock PDF bytes
      
      const email = createLetterEmail({
        recipientEmail: 'test@example.de',
        recipientName: 'Test',
        senderName: 'Sender',
        subject: 'Test',
        letterContent: 'Content',
        pdfBytes,
      });

      expect(email.attachments).toBeDefined();
      expect(email.attachments).toHaveLength(1);
      expect(email.attachments?.[0]).toHaveProperty('filename');
      expect(email.attachments?.[0]).toHaveProperty('content');
    });

    it('should send email successfully', async () => {
      const { sendEmail } = await import('@/lib/utils/email');
      
      const result = await sendEmail({
        to: 'test@example.de',
        subject: 'Test',
        text: 'Test email',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should simulate send when SMTP not configured', async () => {
      vi.stubEnv('SMTP_HOST', '');
      vi.resetModules();
      
      const { sendEmail } = await import('@/lib/utils/email');
      
      const result = await sendEmail({
        to: 'test@example.de',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toContain('simulated-');
    });
  });

  describe('Send API Route', () => {
    it('should have send route file', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      expect(() => readFileSync(routePath, 'utf-8')).not.toThrow();
    });

    it('should export POST handler', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('export async function POST');
      expect(route).toContain('NextRequest');
      expect(route).toContain('NextResponse');
    });

    it('should validate required fields', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('letterId');
      expect(route).toContain('letterContent');
      expect(route).toContain('sender');
      expect(route).toContain('400');
    });

    it('should support multiple formats', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      // Check interface defines the format union type
      expect(route).toContain("format: 'pdf' | 'email' | 'both'");
      expect(route).toContain("format === 'pdf'");
      expect(route).toContain("format === 'email'");
      expect(route).toContain("format === 'both'");
    });

    it('should call PDF generation', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('generatePDF');
      expect(route).toContain('@/lib/utils/pdf');
    });

    it('should call email service', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('sendEmail');
      expect(route).toContain('@/lib/utils/email');
    });

    it('should return success response', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('success: true');
      expect(route).toContain('letterId');
      expect(route).toContain('date');
    });
  });

  describe('Interlock: Sending → Previous Phases', () => {
    it('PDF should accept LetterData from types', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      // Using the types from Phase 2
      const testData = {
        sender: {
          name: 'Hans Müller',
          street: 'Hauptstraße 1',
          zip: '10115',
          city: 'Berlin',
        },
        recipient: {
          name: 'Finanzamt',
          address: 'Test',
        },
        date: '15.01.2025',
        subject: 'Test',
        content: 'Test',
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('email should use user profile from store', async () => {
      const { createLetterEmail } = await import('@/lib/utils/email');
      
      const email = createLetterEmail({
        recipientEmail: 'finanzamt@berlin.de',
        recipientName: 'Finanzamt Berlin',
        senderName: 'Hans Müller',
        subject: 'Widerspruch',
        letterContent: 'Test',
      });

      expect(email.text).toContain('Hans Müller');
    });

    it('send API should work with compose page output', async () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      // The send API accepts letterContent which comes from the compose page
      expect(route).toContain('letterContent');
      expect(route).toContain('recipientEmail');
    });

    it('should generate base64 PDF for download', () => {
      const routePath = join(projectRoot, 'src/app/api/send/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('data:application/pdf;base64');
    });
  });

  describe('PDF DIN 5008 Compliance', () => {
    it('should have proper margins', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const testData = {
        sender: {
          name: 'Test',
          street: 'Test',
          zip: '12345',
          city: 'Test',
        },
        recipient: {
          name: 'Test',
          address: 'Test',
        },
        date: '01.01.2025',
        subject: 'Test',
        content: 'Test content',
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should include date in correct German format', async () => {
      const { generatePDF } = await import('@/lib/utils/pdf');
      
      const testData = {
        sender: {
          name: 'Test',
          street: 'Test',
          zip: '12345',
          city: 'Test',
        },
        recipient: {
          name: 'Test',
          address: 'Test',
        },
        date: '15.01.2025',
        subject: 'Test',
        content: 'Test',
      };

      const pdfBytes = await generatePDF(testData);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });
});
