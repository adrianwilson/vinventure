'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Winery } from '../../../types/winery';
import { mockWineries } from '../../../lib/mock-data';
import WineryDetail from '../../../components/winery/WineryDetail';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface WineryPageClientProps {
  wineryId: string;
}

export default function WineryPageClient({ wineryId }: WineryPageClientProps) {
  const router = useRouter();
  const [winery, setWinery] = useState<Winery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWinery = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, use mock data. In production, this would be an API call
        const foundWinery = mockWineries.find(w => w.id === wineryId);

        if (!foundWinery) {
          setError('Winery not found');
          return;
        }

        setWinery(foundWinery);
      } catch (err) {
        setError('Failed to load winery details');
        console.error('Error fetching winery:', err);
      } finally {
        setLoading(false);
      }
    };

    if (wineryId) {
      fetchWinery();
    }
  }, [wineryId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!winery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Winery not found</h1>
          <button
            onClick={() => router.push('/discover')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Discovery
          </button>
        </div>
      </div>
    );
  }

  return <WineryDetail winery={winery} />;
}