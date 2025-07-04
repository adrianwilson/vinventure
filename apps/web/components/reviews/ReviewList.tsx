'use client';

import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const displayName = review.user.displayName || review.user.email.split('@')[0];
  const visibleImages = showAllImages ? review.images : review.images.slice(0, 3);

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-medium text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Review Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900">{displayName}</h4>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
            <StarRating rating={review.rating} />
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
          )}

          {/* Images */}
          {review.images.length > 0 && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {visibleImages.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imageUrl)}
                    className="relative aspect-square rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={imageUrl}
                      alt={`Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {review.images.length > 3 && !showAllImages && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Show {review.images.length - 3} more photos
                </button>
              )}

              {showAllImages && review.images.length > 3 && (
                <button
                  onClick={() => setShowAllImages(false)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Show fewer photos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Review photo"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewList({ 
  reviews, 
  loading = false, 
  canLoadMore = false, 
  onLoadMore 
}: ReviewListProps) {
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">Be the first to leave a review for this winery!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {canLoadMore && (
        <div className="text-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
}