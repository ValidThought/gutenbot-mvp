'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Download, Send, Copy, RotateCcw } from 'lucide-react';

export default function ComposePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useUserStore();
  const [letterContent, setLetterContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      router.push('/onboarding');
      return;
    }

    const loadTemplate = async () => {
      try {
        const response = await fetch('/api/templates', {
          method: 'POST',
          body: JSON.stringify({ templateId: `${params.id}.md` }),
        });

        if (!response.ok) {
          throw new Error('Failed to load template');
        }

        const { content } = await response.json();
        
        const variables: Record<string, string> = {
          absender_name: profile.name,
          absender_strasse: profile.address.street,
          absender_plz: profile.address.zip,
          absender_ort: profile.address.city,
          empfaenger_name: 'Finanzamt Berlin',
          empfaenger_adresse: 'Kirchstraße 7, 10557 Berlin',
          datum: new Date().toLocaleDateString('de-DE'),
          bescheid_typ: 'Einkommensteuerbescheid',
          bescheid_datum: '15.01.2025',
          aktenzeichen: '12345/67890',
          ihr_zeichen: 'ESt 2024/001',
          zustellung_datum: new Date().toLocaleDateString('de-DE'),
          begruendung: '[Hier Begründung einfügen]',
          verlaengerungsgrund: '[Hier Grund für Verlängerung angeben]',
          aktionsart: 'Widerspruch',
          neue_frist: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
        };

        let filledContent = content;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          filledContent = filledContent.replace(regex, value);
        });

        setLetterContent(filledContent);
      } catch (error) {
        console.error('Error loading template:', error);
        setLetterContent('Fehler beim Laden des Templates. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [profile, params.id, router]);

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
  };

  const handleDownload = () => {
    const blob = new Blob([letterContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brief.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    setIsSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSending(false);
    setSent(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Template wird geladen...</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Brief gesendet!</h1>
          <p className="text-muted-foreground mb-6">
            Dein Brief wurde erfolgreich versendet.
          </p>
          <button
            onClick={() => router.push('/history')}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Zum Verlauf
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
          <h1 className="text-xl font-bold">Brief erstellen</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-muted rounded-lg"
              title="Kopieren"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-muted rounded-lg"
              title="Herunterladen"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-card rounded-lg shadow">
            <div className="p-3 border-b">
              <h2 className="font-medium">Bearbeiten</h2>
            </div>
            <textarea
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              className="w-full h-[calc(100vh-300px)] p-4 resize-none bg-background rounded-b-lg focus:outline-none font-mono text-sm"
              placeholder="Briefinhalt..."
            />
          </div>

          {/* Preview */}
          <div className="bg-card rounded-lg shadow">
            <div className="p-3 border-b">
              <h2 className="font-medium">Vorschau</h2>
            </div>
            <div className="p-6 h-[calc(100vh-300px)] overflow-auto bg-white">
              <div className="whitespace-pre-wrap font-sans text-sm">
                {letterContent.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="ml-4">• {line.substring(2)}</p>;
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setLetterContent('')}
            className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-4 h-4" />
            Zurücksetzen
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !letterContent}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Senden
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
