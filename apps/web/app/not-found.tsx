import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
          <Link 
            href="/discover"
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Discover Wineries
          </Link>
        </div>
      </div>
    </div>
  );
}