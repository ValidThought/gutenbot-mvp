'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHistoryStore } from '@/store/historyStore';
import { seedMockHistory } from '@/store/historyStore';
import { ArrowRight, Search, Filter, Clock, CheckCircle, Send } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { letters, addLetter } = useHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Seed mock data if empty
    if (letters.length === 0) {
      const mockLetters = seedMockHistory();
      mockLetters.forEach(letter => addLetter(letter));
    }
  }, []);

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = letter.classification.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         letter.classification.sender.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            Abgeschlossen
          </span>
        );
      case 'response_sent':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">
            <Send className="w-3 h-3" />
            Gesendet
          </span>
        );
      case 'analyzed':
        return (
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            Analysiert
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'BESCHEID':
        return 'border-l-4 border-blue-500';
      case 'MAHNUNG':
        return 'border-l-4 border-red-500';
      case 'ANHOERUNG':
        return 'border-l-4 border-yellow-500';
      case 'ANTRAG_ABLEHNUNG':
        return 'border-l-4 border-orange-500';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Verlauf</h1>
          <p className="text-muted-foreground">Deine gescannten Briefe</p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            <option value="all">Alle</option>
            <option value="completed">Abgeschlossen</option>
            <option value="response_sent">Gesendet</option>
            <option value="analyzed">Analysiert</option>
          </select>
        </div>

        {/* Letter List */}
        <div className="space-y-3">
          {filteredLetters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Noch keine Briefe vorhanden.</p>
              <button
                onClick={() => router.push('/scan')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Ersten Brief scannen
              </button>
            </div>
          ) : (
            filteredLetters.map((letter) => (
              <div
                key={letter.id}
                onClick={() => router.push(`/analysis/${letter.id}`)}
                className={`bg-card rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow ${getCategoryColor(letter.classification.category)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{letter.classification.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {letter.classification.sender.name}
                    </p>
                  </div>
                  {getStatusBadge(letter.status)}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(letter.createdAt).toLocaleDateString('de-DE')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {letters.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{letters.length}</p>
              <p className="text-sm text-muted-foreground">Gesamt</p>
            </div>
            <div className="bg-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">
                {letters.filter(l => l.status === 'completed' || l.status === 'response_sent').length}
              </p>
              <p className="text-sm text-muted-foreground">Abgeschlossen</p>
            </div>
            <div className="bg-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">
                {letters.filter(l => l.status === 'analyzed').length}
              </p>
              <p className="text-sm text-muted-foreground">Offen</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
