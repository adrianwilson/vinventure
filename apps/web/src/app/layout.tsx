import './global.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'VinVenture - Discover Unique Wine Experiences',
  description: 'Connect with wineries and book unique wine tastings, tours, and events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
