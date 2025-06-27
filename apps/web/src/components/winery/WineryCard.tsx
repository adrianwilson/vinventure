'use client';

import Link from 'next/link';
import { Winery, EXPERIENCE_TYPE_LABELS } from '@vinventure/types';

// Icon components
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const HeartIconSolid = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

interface WineryCardProps {
  winery: Winery;
  isFavorite?: boolean;
  onToggleFavorite?: (wineryId: string) => void;
}

export default function WineryCard({ 
  winery, 
  isFavorite = false, 
  onToggleFavorite 
}: WineryCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(winery.id);
  };

  const averagePrice = winery.experiences?.length 
    ? winery.experiences.reduce((sum, exp) => sum + exp.price, 0) / winery.experiences.length
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {winery.bannerUrl || winery.images?.[0] ? (
          <img
            src={winery.bannerUrl || winery.images[0]}
            alt={winery.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            {isFavorite ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}

        {/* Featured Badge */}
        {winery.featured && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}

        {/* Sustainable Badge */}
        {winery.sustainable && (
          <div className="absolute bottom-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Sustainable
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {winery.name}
          </h3>
          {winery.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{winery.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
          <MapPinIcon className="h-4 w-4" />
          <span className="line-clamp-1">{winery.city}, {winery.region}</span>
        </div>

        {/* Description */}
        {winery.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {winery.description}
          </p>
        )}

        {/* Wine Types */}
        {winery.wineTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {winery.wineTypes.slice(0, 3).map(type => (
              <span
                key={type}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                {type}
              </span>
            ))}
            {winery.wineTypes.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{winery.wineTypes.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Experiences Preview */}
        {winery.experiences && winery.experiences.length > 0 && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-1">
              {winery.experiences.length} experience{winery.experiences.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-1">
              {winery.experiences.slice(0, 2).map(exp => (
                <span
                  key={exp.id}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {EXPERIENCE_TYPE_LABELS[exp.type]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price and Reviews */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {averagePrice && (
              <span>From ${averagePrice.toFixed(0)}</span>
            )}
            {winery._count?.reviews && (
              <span className="ml-2">
                ({winery._count.reviews} review{winery._count.reviews !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        {/* View Details Link */}
        <Link
          href={`/wineries/${winery.id}`}
          className="block w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-md text-sm font-medium transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}