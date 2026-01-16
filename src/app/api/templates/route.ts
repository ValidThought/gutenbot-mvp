import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId ist erforderlich' },
        { status: 400 }
      );
    }

    const validTemplates = [
      'widerspruch.md',
      'fristverlaengerung.md',
      'stellungnahme.md',
      'ratenzahlung.md',
      'akteneinsicht.md',
    ];

    const templateFile = validTemplates.includes(templateId) 
      ? templateId 
      : 'widerspruch.md';

    const templatePath = join(process.cwd(), 'src/data/templates', templateFile);
    const template = readFileSync(templatePath, 'utf-8');

    return NextResponse.json({ template: templateFile, content: template });
  } catch (error) {
    console.error('[Template] Error:', error);
    return NextResponse.json(
      { error: 'Template konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const templates = [
    { id: 'widerspruch.md', name: 'Widerspruch', description: 'Generic objection letter' },
    { id: 'fristverlaengerung.md', name: 'Fristverlängerung', description: 'Deadline extension request' },
    { id: 'stellungnahme.md', name: 'Stellungnahme', description: 'Official statement' },
    { id: 'ratenzahlung.md', name: 'Ratenzahlung', description: 'Installment payment request' },
    { id: 'akteneinsicht.md', name: 'Akteneinsicht', description: 'File inspection request' },
  ];

  return NextResponse.json({ templates });
}
