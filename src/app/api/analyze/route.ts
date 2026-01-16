import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { completeWithSchema } from '@/lib/llm/client';
import { 
  ClassificationSchema, 
  AnalysisSchema, 
  FullAnalysisSchema,
  validateClassification,
  validateAnalysis,
  type FullAnalysis
} from '@/lib/llm/schemas';
import { 
  createClassificationPrompt, 
  createAnalysisPrompt,
  fillTemplate 
} from '@/lib/llm/prompts';
import type { BundeslandCode } from '@/types';

const projectRoot = process.cwd();

interface AnalyzeRequest {
  text: string;
  bundesland: BundeslandCode;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.text) {
      return NextResponse.json(
        { error: 'Kein Text vorhanden. Bitte laden Sie zuerst einen Brief hoch.' },
        { status: 400 }
      );
    }

    if (!body.bundesland) {
      return NextResponse.json(
        { error: 'Bundesland ist erforderlich für die Analyse.' },
        { status: 400 }
      );
    }

    // Load Bundesland-specific legal context
    const landesrecht = getLandesrechtContext(body.bundesland);

    // Step 1: Classification
    console.log('[Analysis] Starting classification...');
    const classificationPrompt = createClassificationPrompt(body.bundesland, landesrecht.name);
    const classification = await completeWithSchema(
      classificationPrompt,
      body.text,
      ClassificationSchema
    );
    console.log(`[Analysis] Classification: ${classification.category} (${Math.round(classification.confidence * 100)}%)`);

    // Step 2: Detailed Analysis
    console.log('[Analysis] Starting detailed analysis...');
    const analysisPrompt = createAnalysisPrompt(
      body.bundesland,
      landesrecht.name,
      JSON.stringify(classification)
    );
    const analysis = await completeWithSchema(
      analysisPrompt,
      body.text,
      AnalysisSchema
    );
    console.log(`[Analysis] Analysis complete: ${analysis.recommendedActions.length} actions recommended`);

    const result: FullAnalysis = {
      classification,
      analysis,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Analysis] Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: ' Analyse konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.' },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

function getLandesrechtContext(bundesland: BundeslandCode): { name: string; content: any } {
  try {
    const dataPath = join(projectRoot, `src/data/bundeslaender/${bundesland}.json`);
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    return {
      name: data.legalContext?.verwaltungsverfahrensgesetz || 'VwVfG',
      content: data,
    };
  } catch (error) {
    console.warn(`[Analysis] Could not load landesrecht for ${bundesland}, using defaults`);
    return {
      name: 'VwVfG',
      content: null,
    };
  }
}

// Helper function for generating response drafts
async function generateResponseDraft(
  letterText: string,
  action: {
    templateId: string;
    templateVariables: Record<string, string>;
  },
  userProfile: {
    name: string;
    address: { street: string; zip: string; city: string };
    bundesland: BundeslandCode;
    email: string;
  },
  senderInfo: {
    name: string;
    address: string;
    aktenzeichen?: string;
  }
): Promise<string> {
  const templatePath = join(projectRoot, `src/data/templates/${action.templateId}.md`);
  const template = readFileSync(templatePath, 'utf-8');

  const variables: Record<string, string> = {
    absender_name: userProfile.name,
    absender_strasse: userProfile.address.street,
    absender_plz: userProfile.address.zip,
    absender_ort: userProfile.address.city,
    empfaenger_name: senderInfo.name,
    empfaenger_adresse: senderInfo.address,
    datum: new Date().toLocaleDateString('de-DE'),
    aktenzeichen: senderInfo.aktenzeichen || '',
    ihr_zeichen: senderInfo.aktenzeichen || '',
    ...action.templateVariables,
  };

  return fillTemplate(template, variables);
}
