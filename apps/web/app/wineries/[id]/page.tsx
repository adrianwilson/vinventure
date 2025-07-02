import { mockWineries } from '../../../lib/mock-data';
import WineryPageClient from './WineryPageClient';

// Generate static params for all wineries at build time
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