import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface LetterData {
  sender: {
    name: string;
    street: string;
    zip: string;
    city: string;
  };
  recipient: {
    name: string;
    address: string;
  };
  date: string;
  subject: string;
  content: string;
  aktenzeichen?: string;
}

export async function generatePDF(data: LetterData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginLeft = 72; // 1 inch
  const marginTop = height - 72;
  const marginRight = 72 * 5.5; // Right margin at 5.5 inches
  const lineHeight = 14;
  let y = marginTop;

  // Helper function to add text
  const addText = (text: string, x: number, yPos: number, options?: { font?: any; size?: number; color?: any }) => {
    const currentFont = options?.font || font;
    const currentSize = options?.size || 10;
    const currentColor = options?.color || rgb(0, 0, 0);
    
    page.drawText(text, {
      x,
      y: yPos,
      size: currentSize,
      font: currentFont,
      color: currentColor,
    });
  };

  // Sender address (left side, top)
  y = marginTop;
  addText(data.sender.name, marginLeft, y, { font: fontBold, size: 11 });
  y += lineHeight;
  addText(data.sender.street, marginLeft, y);
  y += lineHeight;
  addText(`${data.sender.zip} ${data.sender.city}`, marginLeft, y);

  // Date (right side)
  const dateText = `Berlin, den ${data.date}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 10);
  addText(dateText, marginRight - dateWidth, y);

  // Spacing
  y += lineHeight * 3;

  // Recipient
  const recipientLines = data.recipient.address.split('\n');
  recipientLines.forEach(line => {
    addText(line, marginLeft, y);
    y += lineHeight;
  });

  y += lineHeight * 2;

  // Subject line (bold)
  addText(`Betreff: ${data.subject}`, marginLeft, y, { font: fontBold });
  y += lineHeight * 2;

  // Aktenzeichen if present
  if (data.aktenzeichen) {
    addText(`Aktenzeichen: ${data.aktenzeichen}`, marginLeft, y);
    y += lineHeight * 2;
  }

    // Main content
    const contentLines = data.content.split('\n');
    contentLines.forEach(line => {
      if (y < 72) {
        // Add new page if we run out of space
        const newPage = pdfDoc.addPage();
        y = height - 72;
      }
    
    // Handle markdown-style formatting
    if (line.startsWith('**') && line.endsWith('**')) {
      addText(line.replace(/\*\*/g, ''), marginLeft, y, { font: fontBold });
    } else if (line.startsWith('**')) {
      addText(line.replace('**', ''), marginLeft, y, { font: fontBold });
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('•')) {
      addText(line.trim(), marginLeft + 10, y);
    } else {
      // Word wrap for long lines
      const maxWidth = marginRight - marginLeft;
      const words = line.split(' ');
      let lineText = '';
      
      words.forEach(word => {
        const testLine = lineText ? `${lineText} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        
        if (testWidth > maxWidth) {
          addText(lineText, marginLeft, y);
          y -= lineHeight;
          lineText = word;
        } else {
          lineText = testLine;
        }
      });
      
      if (lineText) {
        addText(lineText, marginLeft, y);
      }
    }
    y -= lineHeight;
  });

  // Signature line
  y -= lineHeight * 2;
  addText('Mit freundlichen Grüßen', marginLeft, y);
  y -= lineHeight * 3;
  addText(data.sender.name, marginLeft, y);

  // Footer with page number
  const pages = pdfDoc.getPageCount();
  for (let i = 0; i < pages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawText(`Seite ${i + 1} von ${pages}`, {
      x: width / 2 - 30,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function generateWiderspruchPDF(data: LetterData): Promise<Uint8Array> {
  const content = `
Sehr geehrte Damen und Herren,

hiermit lege ich gegen den oben genannten Bescheid fristgerecht

**Widerspruch**

ein.

**Begründung:**

${data.content}

Ich bitte um Überprüfung des Bescheids und um einen rechtsmittelfähigen Widerspruchsbescheid. Sollte dem Widerspruch nicht abgeholfen werden, behalte ich mir die Klage vor dem zuständigen Verwaltungsgericht vor.

Mit freundlichen Grüßen

${data.sender.name}

---
**Rechtsmittelbelehrung:**

Gegen diesen Bescheid kann innerhalb eines Monats nach Zustellung Widerspruch eingelegt werden. Der Widerspruch ist bei der herausgebenden Behörde oder bei dem im Bescheid genannten Verwaltungsgericht schriftlich einzulegen.
  `.trim();

  const fullData = { ...data, content };
  return generatePDF(fullData);
}
