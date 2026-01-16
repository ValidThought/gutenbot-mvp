'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { ArrowRight, Clock, AlertTriangle, CheckCircle, Scale, FileText } from 'lucide-react';
import { createMockLetter } from '@/store/letterStore';

type AnalysisStep = 'loading' | 'analyzing' | 'result' | 'error';

export default function AnalysisPage() {
  const router = useRouter();
  const { profile, isOnboarded } = useUserStore();
  const [step, setStep] = useState<AnalysisStep>('loading');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnboarded) {
      router.push('/onboarding');
      return;
    }

    // Simulate loading and analysis
    const runAnalysis = async () => {
      setStep('loading');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('analyzing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, use mock data - in real app would call /api/analyze
      const mockLetter = createMockLetter({
        classification: {
          category: 'BESCHEID',
          confidence: 0.95,
          sender: {
            name: 'Finanzamt Berlin',
            type: 'government',
            jurisdiction: profile?.bundesland || 'BE',
          },
          subject: 'Einkommensteuerbescheid 2024',
          deadlines: [
            {
              id: '1',
              type: 'widerspruch',
              date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              daysRemaining: 14,
              urgency: 'high',
              isLegal: true,
              description: 'Widerspruchsfrist',
            },
          ],
        },
        analysis: {
          summary: 'Das Finanzamt hat einen Einkommensteuerbescheid für 2024 erlassen.',
          keyPoints: [
            'Bescheid vom 15.01.2025',
            'Widerspruchsfrist: 14 Tage',
            'Betrag: 8.234 EUR',
          ],
          legalBasis: [
            { law: 'EStG', paragraph: '§ 32a', description: 'Einkommensteuertarif', url: '', isLandesrecht: false },
            { law: 'VwVfG Bln', paragraph: '§ 70', description: 'Widerspruchsverfahren', url: '', isLandesrecht: true },
          ],
          recommendedActions: [
            {
              id: '1',
              title: 'Widerspruch einlegen',
              description: 'Gegen den Bescheid Widerspruch einlegen',
              complexity: 'moderate',
              templateId: 'widerspruch',
            },
            {
              id: '2',
              title: 'Fristverlängerung beantragen',
              description: 'Verlängerung der Widerspruchsfrist beantragen',
              complexity: 'simple',
              templateId: 'fristverlaengerung',
            },
          ],
          risks: [
            {
              id: '1',
              description: 'Fristversäumnis führt zu Rechtskraft',
              severity: 'high',
              mitigation: 'Frist im Kalender eintragen, frühzeitig handeln',
            },
          ],
        },
      });

      setAnalysis(mockLetter);
      setStep('result');
    };

    runAnalysis();
  }, [isOnboarded, profile]);

  if (!isOnboarded) {
    return null;
  }

  const handleSelectAction = (actionId: string) => {
    router.push(`/compose/${actionId}`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Brief wird geladen...</h2>
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Brief wird analysiert...</h2>
          <p className="text-muted-foreground mt-2">Das dauert einen Moment</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Analyse fehlgeschlagen</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button
            onClick={() => router.push('/scan')}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg"
          >
            Zurück zum Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Analyse</h1>
          <p className="text-muted-foreground">Ergebnis der Briefanalyse</p>
        </div>

        {/* Classification Card */}
        <div className="bg-card rounded-lg p-6 mb-4 shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium mb-2">
                {analysis.classification.category}
              </span>
              <h2 className="text-lg font-semibold">{analysis.classification.subject}</h2>
              <p className="text-muted-foreground">{analysis.classification.sender.name}</p>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(analysis.classification.confidence * 100)}% sicher
            </span>
          </div>

          {/* Deadlines */}
          {analysis.classification.deadlines.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Fristen
              </h3>
              {analysis.classification.deadlines.map((deadline: any) => (
                <div
                  key={deadline.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${getUrgencyColor(deadline.urgency)}`}
                >
                  <div>
                    <p className="font-medium">{deadline.description}</p>
                    <p className="text-sm opacity-80">
                      {deadline.daysRemaining} Tage verbleibend
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {deadline.date.toLocaleDateString('de-DE')}
                    </p>
                    {deadline.isLegal && (
                      <p className="text-xs">Gesetzliche Frist</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg p-6 mb-4 shadow">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Zusammenfassung
          </h3>
          <p className="text-muted-foreground">{analysis.analysis.summary}</p>
          <ul className="mt-4 space-y-2">
            {analysis.analysis.keyPoints.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Basis */}
        {analysis.analysis.legalBasis.length > 0 && (
          <div className="bg-card rounded-lg p-6 mb-4 shadow">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Rechtliche Grundlagen
            </h3>
            <div className="space-y-2">
              {analysis.analysis.legalBasis.map((law: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                    {law.law} {law.paragraph}
                  </span>
                  <span className="text-muted-foreground">{law.description}</span>
                  {law.isLandesrecht && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Landesrecht
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {analysis.analysis.risks.length > 0 && (
          <div className="bg-card rounded-lg p-6 mb-4 shadow">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Risiken
            </h3>
            {analysis.analysis.risks.map((risk: any) => (
              <div
                key={risk.id}
                className={`p-3 rounded-lg mb-2 ${getSeverityColor(risk.severity)}`}
              >
                <p className="font-medium">{risk.description}</p>
                <p className="text-sm mt-1">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        <div className="bg-card rounded-lg p-6 shadow">
          <h3 className="font-medium mb-4">Empfohlene Aktionen</h3>
          <div className="space-y-3">
            {analysis.analysis.recommendedActions.map((action: any) => (
              <button
                key={action.id}
                onClick={() => handleSelectAction(action.id)}
                className="w-full p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        action.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                        action.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {action.complexity === 'simple' ? 'Einfach' :
                         action.complexity === 'moderate' ? 'Mittel' : 'Komplex'}
                      </span>
                      {action.templateId && (
                        <span className="text-xs text-muted-foreground">
                          Template: {action.templateId}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/scan')}
            className="flex-1 py-3 border rounded-lg font-medium hover:bg-muted"
          >
            Neuer Scan
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex-1 py-3 border rounded-lg font-medium hover:bg-muted"
          >
            Verlauf
          </button>
        </div>
      </div>
    </div>
  );
}
