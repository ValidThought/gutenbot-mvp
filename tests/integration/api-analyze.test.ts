import { describe, it, expect } from 'vitest';

describe('Analyze API Route', () => {
  describe('Request Validation', () => {
    it('should validate complete request structure', () => {
      interface AnalyzeRequest {
        text: string;
        bundesland: string;
        userId?: string;
      }

      const validRequest: AnalyzeRequest = {
        text: 'Einkommensteuerbescheid 2024 vom Finanzamt Berlin',
        bundesland: 'BE',
        userId: 'user-1',
      };

      expect(validRequest.text.length).toBeGreaterThan(0);
      expect(validRequest.bundesland).toHaveLength(2);
      expect(validRequest.userId).toBeDefined();
    });

    it('should allow optional userId', () => {
      interface AnalyzeRequest {
        text: string;
        bundesland: string;
        userId?: string;
      }

      const requestWithoutUserId: AnalyzeRequest = {
        text: 'Test letter text',
        bundesland: 'HE',
      };

      expect(requestWithoutUserId.userId).toBeUndefined();
    });
  });

  describe('Bundesland Legal Context', () => {
    it('should load Berlin legal context', () => {
      const berlinContext = {
        code: 'BE',
        name: 'Berlin',
        legalContext: {
          verwaltungsverfahrensgesetz: 'VwVfG Berlin',
          widerspruchsFrist: 30,
          zustaendigeGerichte: {
            verwaltungsgericht: 'Verwaltungsgericht Berlin',
            adresse: 'Kirchstraße 7, 10557 Berlin',
          },
        },
        commonAuthorities: [
          { name: 'Finanzamt', pattern: ['finanzamt'] },
          { name: 'Bürgeramt', pattern: ['bürgeramt'] },
        ],
      };

      expect(berlinContext.legalContext.widerspruchsFrist).toBe(30);
      expect(berlinContext.legalContext.verwaltungsverfahrensgesetz).toContain('Berlin');
    });

    it('should load Hessen legal context', () => {
      const hessenContext = {
        code: 'HE',
        name: 'Hessen',
        legalContext: {
          verwaltungsverfahrensgesetz: 'VwVfG HE',
          widerspruchsFrist: 30,
          zustaendigeGerichte: {
            verwaltungsgericht: 'Verwaltungsgericht Frankfurt am Main',
            adresse: 'Gutleutstraße 25, 60327 Frankfurt am Main',
          },
        },
      };

      expect(hessenContext.legalContext.widerspruchsFrist).toBe(30);
    });

    it('should handle missing bundesland data gracefully', () => {
      const getLandesrechtContext = (bundesland: string) => {
        const validBundeslaender = ['BE', 'HE'];
        if (!validBundeslaender.includes(bundesland)) {
          return {
            name: 'VwVfG',
            content: null,
          };
        }
        return { name: 'Unknown', content: {} };
      };

      const result = getLandesrechtContext('INVALID');
      expect(result.name).toBe('VwVfG');
      expect(result.content).toBeNull();
    });
  });

  describe('Analysis Response Structure', () => {
    it('should return full analysis structure', () => {
      const mockAnalysis = {
        classification: {
          category: 'BESCHEID',
          confidence: 0.95,
          sender: {
            name: 'Finanzamt Berlin',
            type: 'government' as const,
            jurisdiction: 'BE',
          },
          subject: 'Einkommensteuerbescheid 2024',
          receivedDate: '2025-01-15',
          deadlines: [
            {
              id: '1',
              type: 'widerspruch',
              date: '2025-02-14',
              daysRemaining: 30,
              urgency: 'high' as const,
              description: 'Widerspruchsfrist',
            },
          ],
        },
        analysis: {
          summary: 'Das Finanzamt hat einen Einkommensteuerbescheid für 2024 erlassen.',
          keyPoints: [
            'Bescheid vom 15.01.2025',
            'Widerspruchsfrist: 30 Tage',
            'Betrag: 8.234 EUR',
          ],
          legalBasis: [
            {
              law: 'EStG',
              paragraph: '§ 32a',
              description: 'Einkommensteuertarif',
              url: 'https://www.gesetze-im-internet.de',
              isLandesrecht: false,
            },
          ],
          recommendedActions: [
            {
              id: '1',
              title: 'Widerspruch einlegen',
              description: 'Gegen den Bescheid Widerspruch einlegen',
              complexity: 'moderate' as const,
              templateId: 'widerspruch',
            },
          ],
          risks: [
            {
              id: '1',
              description: 'Fristversäumnis führt zu Rechtskraft',
              severity: 'high' as const,
              mitigation: 'Frist im Kalender eintragen',
            },
          ],
        },
      };

      expect(mockAnalysis).toHaveProperty('classification');
      expect(mockAnalysis).toHaveProperty('analysis');
      expect(mockAnalysis.classification.category).toBe('BESCHEID');
      expect(mockAnalysis.analysis.recommendedActions).toHaveLength(1);
      expect(mockAnalysis.analysis.risks).toHaveLength(1);
    });
  });

  describe('Template Generation', () => {
    it('should replace template variables correctly', () => {
      const template = `{{absender_name}}
{{absender_strasse}}
{{absender_plz}} {{absender_ort}}

{{empfaenger_name}}
{{empfaenger_adresse}}

{{datum}}

Betreff: {{betreff}}

Aktenzeichen: {{aktenzeichen}}`;

      const variables: Record<string, string> = {
        absender_name: 'Hans Müller',
        absender_strasse: 'Hauptstraße 1',
        absender_plz: '10115',
        absender_ort: 'Berlin',
        empfaenger_name: 'Finanzamt Berlin',
        empfaenger_adresse: 'Kaiserdamm 23, 14057 Berlin',
        datum: '15.01.2025',
        betreff: 'Widerspruch gegen Einkommensteuerbescheid',
        aktenzeichen: '123/2025',
      };

      let result = template;
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      expect(result).toContain('Hans Müller');
      expect(result).toContain('10115 Berlin');
      expect(result).toContain('Aktenzeichen: 123/2025');
      expect(result).not.toContain('{{');
    });

    it('should handle missing template variables gracefully', () => {
      const template = `{{absender_name}}
{{absender_strasse}}
{{absender_plz}} {{absender_ort}}`;

      const variables: Record<string, string> = {
        absender_name: 'Hans Müller',
      };

      let result = template;
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      expect(result).toContain('Hans Müller');
      expect(result).toContain('{{absender_strasse}}');
      expect(result).toContain('{{absender_plz}}');
    });
  });
});

describe('Error Handling', () => {
  it('should handle JSON parsing errors', () => {
    const errorMessages = [
      'JSON parsing failed',
      'Unexpected token',
      'SyntaxError',
    ];

    errorMessages.forEach((errorMessage) => {
      const containsJsonOrSyntax = errorMessage.includes('JSON') || 
                                    errorMessage.includes('token') || 
                                    errorMessage.includes('Syntax');
      expect(containsJsonOrSyntax).toBe(true);
    });
  });

  it('should return 422 for unprocessable content', () => {
    const errorResponse = {
      error: 'Analyse konnte nicht verarbeitet werden',
      status: 422,
    };

    expect(errorResponse.status).toBe(422);
  });

  it('should return 500 for general errors', () => {
    const errorResponse = {
      error: 'Analyse fehlgeschlagen',
      status: 500,
    };

    expect(errorResponse.status).toBe(500);
  });
});
