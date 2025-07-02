import { mockWineries } from '../../../lib/mock-data';
import WineryPageClient from './WineryPageClient';

// With static export, we need all winery IDs at build time
// Adding new wineries requires rebuilding unless we change the architecture

export async function generateStaticParams() {
  // For static export, we need to generate all possible [id] values
  return mockWineries.map((winery) => ({
    id: winery.id,
  }));
}

interface WineryPageProps {
  params: {
    id: string;
  };
}

export default function WineryPage({ params }: WineryPageProps) {
  // This is a server component that just passes the id to the client component
  return <WineryPageClient wineryId={params.id} />;
}