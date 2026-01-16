'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { BUNDESLAENDER, type BundeslandCode } from '@/types';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

type OnboardingStep = 'bundesland' | 'personal' | 'email' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, isOnboarded } = useUserStore();
  const [step, setStep] = useState<OnboardingStep>('bundesland');
  const [formData, setFormData] = useState({
    bundesland: '' as BundeslandCode | '',
    name: '',
    street: '',
    zip: '',
    city: '',
    email: '',
  });

  if (isOnboarded) {
    router.push('/scan');
    return null;
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'bundesland':
        return formData.bundesland !== '';
      case 'personal':
        return formData.name !== '' && formData.street !== '' && formData.zip !== '' && formData.city !== '';
      case 'email':
        return formData.email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (step) {
      case 'bundesland':
        setStep('personal');
        break;
      case 'personal':
        setStep('email');
        break;
      case 'email':
        setStep('complete');
        break;
      case 'complete':
        const profile = {
          id: `user-${Date.now()}`,
          name: formData.name,
          address: {
            street: formData.street,
            zip: formData.zip,
            city: formData.city,
          },
          bundesland: formData.bundesland as BundeslandCode,
          email: formData.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProfile(profile);
        router.push('/scan');
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'personal':
        setStep('bundesland');
        break;
      case 'email':
        setStep('personal');
        break;
      case 'complete':
        setStep('email');
        break;
    }
  };

  const steps: { id: OnboardingStep; label: string }[] = [
    { id: 'bundesland', label: 'Bundesland' },
    { id: 'personal', label: 'Daten' },
    { id: 'email', label: 'E-Mail' },
    { id: 'complete', label: 'Fertig' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${index < currentStepIndex ? 'bg-primary text-primary-foreground' : ''}
                  ${index === currentStepIndex ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' : ''}
                  ${index > currentStepIndex ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {index < currentStepIndex ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-4 text-sm text-muted-foreground">{steps[currentStepIndex].label}</p>
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-lg p-6 shadow-lg">
          {step === 'bundesland' && (
            <div>
              <h1 className="text-2xl font-bold mb-4">Wo wohnst du?</h1>
              <p className="text-muted-foreground mb-6">Wähle dein Bundesland aus, damit wir die richtigen rechtlichen Informationen verwenden können.</p>
              <div className="grid grid-cols-2 gap-3">
                {BUNDESLAENDER.map((bl) => (
                  <button
                    key={bl.code}
                    onClick={() => updateFormData('bundesland', bl.code)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${formData.bundesland === bl.code 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <span className="font-semibold">{bl.code}</span>
                    <span className="ml-2 text-muted-foreground">{bl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'personal' && (
            <div>
              <h1 className="text-2xl font-bold mb-4">Deine Daten</h1>
              <p className="text-muted-foreground mb-6">Diese Informationen werden für deine Briefe verwendet.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Straße und Hausnummer</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateFormData('street', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background"
                    placeholder="Musterstraße 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">PLZ</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => updateFormData('zip', e.target.value)}
                      className="w-full p-3 border rounded-lg bg-background"
                      placeholder="10115"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stadt</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className="w-full p-3 border rounded-lg bg-background"
                      placeholder="Berlin"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'email' && (
            <div>
              <h1 className="text-2xl font-bold mb-4">E-Mail-Adresse</h1>
              <p className="text-muted-foreground mb-6">An diese Adresse werden deine Briefe gesendet.</p>
              <div>
                <label className="block text-sm font-medium mb-1">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background"
                  placeholder="max@example.de"
                />
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Alles bereit!</h1>
              <p className="text-muted-foreground mb-6">
                Dein Profil wurde gespeichert. Du kannst jetzt loslegen und deinen ersten Brief scannen.
              </p>
              <div className="bg-muted rounded-lg p-4 text-left text-sm">
                <p><strong>Bundesland:</strong> {BUNDESLAENDER.find(b => b.code === formData.bundesland)?.name}</p>
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Adresse:</strong> {formData.street}, {formData.zip} {formData.city}</p>
                <p><strong>E-Mail:</strong> {formData.email}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step !== 'bundesland' && step !== 'complete' && (
              <button
                onClick={handleBack}
                className="flex items-center px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`
                flex items-center ml-auto px-6 py-3 rounded-lg font-medium transition-all
                ${canProceed() 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}
              `}
            >
              {step === 'complete' ? 'Loslegen' : 'Weiter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
