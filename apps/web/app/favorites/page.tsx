import Navigation from '../../components/ui/Navigation';
import FavoritesList from '../../components/favorites/FavoritesList';

export const metadata = {
  title: 'My Favorites - VinVenture',
  description: 'Your favorite wineries saved for easy access.',
};

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="favorites" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoritesList />
      </div>
    </div>
  );
}