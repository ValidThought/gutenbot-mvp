import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          🤖 GutenBot
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Dein intelligenter Assistent für Behördenbriefe
        </p>
        <p className="text-muted-foreground mb-8">
          Scanne einen Brief, verstehe deine Optionen, 
          und antworte mit einem Klick.
        </p>
        <Link 
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Jetzt starten →
        </Link>
      </div>
    </main>
  );
}
